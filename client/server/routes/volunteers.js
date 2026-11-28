const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');
const { resolveCoords } = require('../utils/pakistanCities');

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const SKILLS_MAX = 255;

function normalizeSkills(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  const seen = new Set();
  const skills = [];
  for (const item of list) {
    const skill = String(item || '').replace(/\s+/g, ' ').trim();
    if (!skill) continue;
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    skills.push(skill);
  }
  const kept = [];
  for (const skill of skills) {
    const next = kept.length ? kept.join(', ') + ', ' + skill : skill;
    if (next.length > SKILLS_MAX) break;
    kept.push(skill);
  }
  return kept.join(', ');
}

// Volunteer: view own profile
router.get('/me', verifyToken, allowRoles('volunteer'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM volunteer_profiles WHERE user_id = ?', [req.user.id]);
    res.json(rows[0] || { skills: '', city: '', availability: 'Available', lat: null, lng: null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Volunteer: save own profile
router.put('/me', verifyToken, allowRoles('volunteer'), async (req, res) => {
  try {
    const { availability, lat, lng } = req.body;
    const skills = normalizeSkills(req.body.skills);
    const city = String(req.body.city || '').slice(0, 100);
    const coords = resolveCoords(lat, lng, city);
    await db.query(
      'INSERT INTO volunteer_profiles (user_id, skills, city, availability, lat, lng) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE skills = VALUES(skills), city = VALUES(city), availability = VALUES(availability), lat = VALUES(lat), lng = VALUES(lng)',
      [req.user.id, skills, city || '', availability || 'Available', coords.lat, coords.lng]
    );
    res.json({ message: 'Profile saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: list all volunteers
router.get('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT u.id, u.name, u.phone, vp.skills, vp.city, vp.availability, vp.lat, vp.lng FROM users u LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id WHERE u.role = 'volunteer'"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Admin: AI ranking of volunteers for one request
router.post('/match', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const [reqRows] = await db.query('SELECT * FROM help_requests WHERE id = ?', [req.body.request_id]);
    if (reqRows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    const [vols] = await db.query(
      "SELECT u.id, u.name, vp.skills, vp.city, vp.availability, vp.lat, vp.lng, (SELECT COUNT(*) FROM tasks t WHERE t.volunteer_id = u.id AND t.status <> 'Done') AS active_tasks FROM users u LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id WHERE u.role = 'volunteer'"
    );
    const response = await fetch(AI_SERVICE_URL + '/match-volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request: reqRows[0], volunteers: vols }),
    });
    const data = await response.json();
    const requestRow = reqRows[0];
    const reqCity = String(requestRow.city || '').trim().toLowerCase();
    const need = String(requestRow.need_type || '').toLowerCase();
    const ranked = (Array.isArray(data) ? data : []).map((row) => {
      const vol = vols.find((item) => Number(item.id) === Number(row.id)) || row;
      const cityMatch = Boolean(reqCity && String(vol.city || '').trim().toLowerCase() === reqCity);
      const skillText = String(vol.skills || '').toLowerCase();
      const skillMatch = Boolean(
        skillText && (need ? skillText.includes(need) || Number(row.score) >= 40 : Number(row.score) >= 40)
      );
      const ready = (vol.availability || 'Available') === 'Available';
      const activeTasks = Number(vol.active_tasks || row.active_tasks || 0);
      const reasons = [];
      if (cityMatch) reasons.push('City match');
      if (skillMatch) reasons.push('Skill match');
      if (ready && activeTasks === 0) reasons.push('Ready');
      else if (ready) reasons.push('Available');
      else reasons.push('Busy');
      return {
        ...row,
        name: vol.name || row.name,
        skills: vol.skills || row.skills || '',
        city: vol.city || row.city || '',
        availability: vol.availability || row.availability || 'Available',
        score: Number(row.score) || 0,
        active_tasks: activeTasks,
        reasons: reasons,
      };
    });
    res.json(ranked);
  } catch (err) {
    res.status(503).json({ message: 'AI service is not running' });
  }
});
module.exports = router;