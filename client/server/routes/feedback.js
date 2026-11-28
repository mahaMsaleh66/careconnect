const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Donor, volunteer or needy: send feedback
router.post('/', verifyToken, allowRoles('donor', 'volunteer', 'needy'), async (req, res) => {
  try {
    const { message, rating } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Please write your feedback' });
    }
    await db.query(
      'INSERT INTO feedback (user_id, message, rating) VALUES (?, ?, ?)',
      [req.user.id, message, rating || 5]
    );
    res.status(201).json({ message: 'Feedback sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Own feedback
router.get('/my', verifyToken, allowRoles('donor', 'volunteer', 'needy'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: all feedback
router.get('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT f.*, u.name AS user_name, u.role AS user_role FROM feedback f JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;