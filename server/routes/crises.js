const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

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
    const { title, type, location, affected_people, description, severity } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    await db.query(
      'INSERT INTO crises (title, type, location, affected_people, description, severity, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, type || null, location || null, affected_people || 0, description || null, severity || 'Low', req.user.id]
    );
    res.status(201).json({ message: 'Crisis created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a crisis as resolved (admin only)
router.put('/:id/resolve', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    await db.query("UPDATE crises SET status = 'Resolved' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Crisis resolved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Admin: ask the AI service to predict severity
router.post('/predict', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const response = await fetch('http://localhost:8000/predict-severity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: 'AI service is not running' });
  }
});
module.exports = router;