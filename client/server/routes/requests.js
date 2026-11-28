const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');
const { resolveCoords } = require('../utils/pakistanCities');
const { getIO } = require('../socket');

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const NEED_URDU = {
  Food: 'خوراک / راشن',
  Medical: 'طبی امداد',
  Shelter: 'رہائش',
  Education: 'تعلیم',
  Other: 'دیگر مدد',
};

const URGENCY_URDU = {
  High: 'فوری',
  Medium: 'درمیانی',
  Low: 'کم',
};

const CITIES = [
  'Karachi', 'Hyderabad', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Quetta',
  'Multan', 'Faisalabad', 'Sukkur', 'Larkana', 'Dadu', 'Jamshoro', 'Thatta', 'Badin',
  'Nawabshah', 'Mirpurkhas', 'Khairpur', 'Shikarpur', 'Jacobabad', 'Ghotki',
  'Sialkot', 'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Mardan', 'Swat',
  'Gilgit', 'Kotri', 'Umerkot', 'Tando Allahyar',
];

const URDU_CITIES = {
  'کراچی': 'Karachi',
  'حیدرآباد': 'Hyderabad',
  'لاہور': 'Lahore',
  'اسلام آباد': 'Islamabad',
  'راولپنڈی': 'Rawalpindi',
  'پشاور': 'Peshawar',
  'کوئٹہ': 'Quetta',
  'ملتان': 'Multan',
  'فیصل آباد': 'Faisalabad',
  'سکھر': 'Sukkur',
  'لاڑکانہ': 'Larkana',
  'دادو': 'Dadu',
  'جامشورو': 'Jamshoro',
};

function foldText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarMessage(a, b) {
  const left = foldText(a);
  const right = foldText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 18 && right.length >= 18 && (left.includes(right) || right.includes(left))) {
    return true;
  }
  const leftTokens = left.split(' ').filter((word) => word.length > 2);
  const rightTokens = right.split(' ').filter((word) => word.length > 2);
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;
  const rightSet = new Set(rightTokens);
  let overlap = 0;
  leftTokens.forEach((word) => {
    if (rightSet.has(word)) overlap += 1;
  });
  const union = new Set(leftTokens.concat(rightTokens)).size;
  return union > 0 && overlap / union >= 0.72;
}

function extractCity(text) {
  const raw = (text || '').trim();
  if (!raw) return '';
  for (const [urdu, en] of Object.entries(URDU_CITIES)) {
    if (raw.includes(urdu)) return en;
  }
  const lower = raw.toLowerCase();
  for (const city of CITIES) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  return '';
}

function resolveCity(bodyCity, profileCity, userText, lastBotMessage) {
  if ((bodyCity || '').trim()) return bodyCity.trim();
  const fromText = extractCity(userText);
  if (fromText) return fromText;
  if ((profileCity || '').trim()) return profileCity.trim();
  const askedForCity = lastBotMessage && lastBotMessage.includes('شہر');
  const shortReply = (userText || '').trim();
  if (askedForCity && shortReply && shortReply.length <= 40) {
    return shortReply;
  }
  return '';
}

function buildBotReply(needType, urgency, city) {
  const needLabel = NEED_URDU[needType] || needType || 'مدد';
  const urgencyLabel = URGENCY_URDU[urgency] || urgency || '';
  if (!city) {
    return (
      'میں نے آپ کی بات سمجھ لی ہے۔ ضرورت: ' +
      needLabel +
      ' (' +
      needType +
      ')، شدت: ' +
      urgencyLabel +
      ' (' +
      urgency +
      ')۔ براہ کرم بتائیں کہ آپ کس شہر یا علاقے میں مدد چاہتے ہیں؟'
    );
  }
  return (
    'ٹھیک ہے — ضرورت: ' +
    needLabel +
    ' (' +
    needType +
    ')، شدت: ' +
    urgencyLabel +
    ' (' +
    urgency +
    ')، شہر: ' +
    city +
    '۔ اگر یہ درست ہے تو "Confirm & Submit Request" دبائیں، یا فارم میں ترمیم کر کے ریلیف ٹیم کو بھیج دیں۔'
  );
}

async function loadRecentChat(userId) {
  const [rows] = await db.query(
    'SELECT * FROM (SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50) AS recent ORDER BY created_at ASC, id ASC',
    [userId]
  );
  return rows;
}

async function insertMessage(userId, sender, message, need, urgency) {
  const [result] = await db.query(
    'INSERT INTO chat_messages (user_id, sender, message, detected_need, detected_urgency) VALUES (?, ?, ?, ?, ?)',
    [userId, sender, message, need || null, urgency || null]
  );
  return {
    id: result.insertId,
    user_id: userId,
    sender: sender,
    message: message,
    detected_need: need || null,
    detected_urgency: urgency || null,
    created_at: new Date(),
  };
}

// Analyze a message with the Urdu/Roman Urdu AI
router.post('/analyze', verifyToken, allowRoles('needy', 'admin'), async (req, res) => {
  try {
    const response = await fetch(AI_SERVICE_URL + '/analyze-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: req.body.message }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: 'AI service is not running' });
  }
});

router.get('/chat', verifyToken, allowRoles('needy', 'admin'), async (req, res) => {
  try {
    const rows = await loadRecentChat(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/chat', verifyToken, allowRoles('needy', 'admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM chat_messages WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Chat cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/chat', verifyToken, allowRoles('needy', 'admin'), async (req, res) => {
  try {
    const text = (req.body.message || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'Please type a message' });
    }

    const [[profile]] = await db.query('SELECT city FROM users WHERE id = ?', [req.user.id]);
    const history = await loadRecentChat(req.user.id);
    const lastBot = [...history].reverse().find((m) => m.sender === 'bot');
    const lastNeed = lastBot && lastBot.detected_need;
    const lastUrgency = lastBot && lastBot.detected_urgency;
    const city = resolveCity(req.body.city, profile && profile.city, text, lastBot && lastBot.message);

    const userMessage = await insertMessage(req.user.id, 'user', text, null, null);

    let needType = lastNeed || 'Other';
    let urgency = lastUrgency || 'Low';
    const askedForCity = lastBot && lastBot.message && lastBot.message.includes('شہر');
    const cityFollowUp = Boolean(askedForCity && text.length <= 40 && lastNeed);

    try {
      const response = await fetch(AI_SERVICE_URL + '/analyze-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (response.ok && !cityFollowUp) {
        const data = await response.json();
        needType = data.need_type || needType;
        urgency = data.urgency || urgency;
      }
    } catch (err) {
      const reply = 'معذرت، تجزیہ سروس ابھی دستیاب نہیں۔ آپ فارم خود پُر کر کے درخواست بھیج سکتے ہیں۔';
      const botMessage = await insertMessage(req.user.id, 'bot', reply, needType, urgency);
      return res.status(200).json({
        user_message: userMessage,
        bot_message: botMessage,
        need_type: needType,
        urgency: urgency,
        city: city,
        ready_to_submit: false,
      });
    }

    const reply = buildBotReply(needType, urgency, city);
    const botMessage = await insertMessage(req.user.id, 'bot', reply, needType, urgency);
    res.json({
      user_message: userMessage,
      bot_message: botMessage,
      need_type: needType,
      urgency: urgency,
      city: city,
      ready_to_submit: Boolean(needType && urgency && city),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Needy submits a help request
router.post('/', verifyToken, allowRoles('needy'), async (req, res) => {
  try {
    const { message, need_type, urgency, city, lat, lng } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Please describe your need' });
    }
    const [recent] = await db.query(
      "SELECT id, need_type, city, message, status FROM help_requests WHERE needy_id = ? AND status IN ('Pending', 'Assigned') AND created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) ORDER BY created_at DESC",
      [req.user.id]
    );
    const sameNeed = String(need_type || 'Other').trim().toLowerCase();
    const sameCity = String(city || '').trim().toLowerCase();
    const duplicate = recent.find((row) => {
      const typeMatch = String(row.need_type || '').trim().toLowerCase() === sameNeed;
      const cityMatch = sameCity && String(row.city || '').trim().toLowerCase() === sameCity;
      return (typeMatch && cityMatch) || similarMessage(row.message, message);
    });
    if (duplicate) {
      return res.status(409).json({
        duplicate: true,
        existing_id: duplicate.id,
        message: 'A similar request is already in progress. Please wait for an update instead of sending the same request again.',
        message_ur: 'اسی طرح کی ایک درخواست پہلے سے زیرِ عمل ہے۔ براہ کرم دوبارہ نہ بھیجیں، اپ ڈیٹ کا انتظار کریں۔',
      });
    }
    const coords = resolveCoords(lat, lng, city);
    const [result] = await db.query(
      'INSERT INTO help_requests (needy_id, message, need_type, urgency, city, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, message, need_type || 'Other', urgency || 'Low', city || null, coords.lat, coords.lng]
    );
    const [[request]] = await db.query(
      'SELECT r.*, u.name AS needy_name FROM help_requests r JOIN users u ON r.needy_id = u.id WHERE r.id = ?',
      [result.insertId]
    );
    getIO().to('role:admin').emit('request:created', { action: 'created', request: request });
    res.status(201).json({ message: 'Request submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Needy sees own requests
router.get('/my', verifyToken, allowRoles('needy'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM help_requests WHERE needy_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin sees all requests
router.get('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT r.*, u.name AS needy_name, u.phone AS needy_phone FROM help_requests r JOIN users u ON r.needy_id = u.id ORDER BY r.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin changes status
router.put('/:id/status', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Assigned', 'Completed', 'Rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const [[existing]] = await db.query('SELECT * FROM help_requests WHERE id = ?', [req.params.id]);
    await db.query('UPDATE help_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    const [[request]] = await db.query(
      'SELECT r.*, u.name AS needy_name FROM help_requests r JOIN users u ON r.needy_id = u.id WHERE r.id = ?',
      [req.params.id]
    );
    const payload = { action: 'status', request: request || { ...(existing || {}), status: status } };
    getIO().to('role:admin').emit('request:updated', payload);
    if (existing && existing.needy_id) {
      getIO().to('user:' + existing.needy_id).emit('request:updated', payload);
    }
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
