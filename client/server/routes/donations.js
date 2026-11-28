const path = require('path');
const express = require('express');
const multer = require('multer');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');
const { getIO } = require('../socket');

const router = express.Router();

const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME[file.mimetype] || '.jpg';
    cb(null, 'receipt-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) {
      return cb(new Error('Only JPG, PNG or WEBP images are allowed'));
    }
    cb(null, true);
  },
});

function receiptUpload(req, res, next) {
  upload.single('receipt')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Screenshot must be 5MB or smaller' });
    }
    return res.status(400).json({ message: err.message || 'Could not upload screenshot' });
  });
}

function cleanNote(raw) {
  if (raw == null) return null;
  const note = String(raw).trim();
  if (!note) return null;
  if (note.length > 255) return false;
  return note;
}

async function donationById(id) {
  const [[row]] = await db.query(
    `SELECT d.*, u.name AS donor_name, u.email AS donor_email, c.title AS crisis_title
     FROM donations d
     JOIN users u ON d.donor_id = u.id
     LEFT JOIN crises c ON d.crisis_id = c.id
     WHERE d.id = ?`,
    [id]
  );
  return row;
}

// Donor makes a donation
router.post('/', verifyToken, allowRoles('donor'), receiptUpload, async (req, res) => {
  try {
    const { amount, category, crisis_id } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Enter a valid amount' });
    }
    const note = cleanNote(req.body.note);
    if (note === false) {
      return res.status(400).json({ message: 'Note must be 255 characters or less' });
    }
    const receipt = 'CC-' + Date.now();
    const receiptImage = req.file ? '/uploads/' + req.file.filename : null;
    const [result] = await db.query(
      'INSERT INTO donations (donor_id, crisis_id, amount, category, receipt_no, note, receipt_image, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, crisis_id || null, amount, category || 'General', receipt, note, receiptImage, 'Pending']
    );
    const row = await donationById(result.insertId);
    const payload = { action: 'created', donation: row };
    getIO().to('role:admin').emit('donation:created', payload);
    getIO().to('user:' + req.user.id).emit('donation:created', payload);
    res.status(201).json({ message: 'Donation recorded', receipt_no: receipt, donation: row });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Donor sees own donations
router.get('/my', verifyToken, allowRoles('donor'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT d.*, c.title AS crisis_title FROM donations d LEFT JOIN crises c ON d.crisis_id = c.id WHERE d.donor_id = ? ORDER BY d.created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin sees all donations
router.get('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT d.*, u.name AS donor_name, u.email AS donor_email, c.title AS crisis_title FROM donations d JOIN users u ON d.donor_id = u.id LEFT JOIN crises c ON d.crisis_id = c.id ORDER BY d.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin verifies or rejects a donation
router.put('/:id/status', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const status = String(req.body.status || '').trim();
    if (status !== 'Verified' && status !== 'Rejected') {
      return res.status(400).json({ message: 'Status must be Verified or Rejected' });
    }
    const [result] = await db.query(
      'UPDATE donations SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    const row = await donationById(req.params.id);
    const payload = { action: status.toLowerCase(), donation: row };
    getIO().to('role:admin').emit('donation:updated', payload);
    getIO().to('user:' + row.donor_id).emit('donation:updated', payload);
    res.json({ message: 'Donation ' + status.toLowerCase(), donation: row });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
