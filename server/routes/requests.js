const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Analyze a message with the Urdu/Roman Urdu AI
router.post('/analyze', verifyToken, allowRoles('needy', 'admin'), async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/analyze-request', {
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

// Needy submits a help request
router.post('/', verifyToken, allowRoles('needy'), async (req, res) => {
  try {
    const { message, need_type, urgency, city } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Please describe your need' });
    }
    await db.query(
      'INSERT INTO help_requests (needy_id, message, need_type, urgency, city) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, message, need_type || 'Other', urgency || 'Low', city || null]
    );
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
    await db.query('UPDATE help_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;