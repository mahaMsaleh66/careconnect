const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');
const { resolveCoords } = require('../utils/pakistanCities');
const { getIO } = require('../socket');

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const PREDICT_TYPE_MAP = { Pandemic: 'Medical' };

// List all crises (any logged-in user)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM crises ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a crisis (admin only)
router.post('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const { title, type, location, affected_people, description, severity, lat, lng } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const coords = resolveCoords(lat, lng, location);
    const [result] = await db.query(
      'INSERT INTO crises (title, type, location, affected_people, description, severity, created_by, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, type || null, location || null, affected_people || 0, description || null, severity || 'Low', req.user.id, coords.lat, coords.lng]
    );
    const [[crisis]] = await db.query('SELECT * FROM crises WHERE id = ?', [result.insertId]);
    getIO().emit('crisis:updated', { action: 'created', crisis: crisis });
    res.status(201).json({ message: 'Crisis created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a crisis as resolved (admin only)
router.put('/:id/resolve', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    await db.query("UPDATE crises SET status = 'Resolved' WHERE id = ?", [req.params.id]);
    const [[crisis]] = await db.query('SELECT * FROM crises WHERE id = ?', [req.params.id]);
    getIO().emit('crisis:updated', { action: 'resolved', crisis: crisis });
    res.json({ message: 'Crisis resolved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Admin: ask the AI service to predict severity
router.post('/predict', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const payload = { ...req.body };
    if (PREDICT_TYPE_MAP[payload.type]) {
      payload.type = PREDICT_TYPE_MAP[payload.type];
    }
    const response = await fetch(AI_SERVICE_URL + '/predict-severity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: 'AI service is not running' });
  }
});
module.exports = router;