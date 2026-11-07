const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Admin: classify a headline with the AI
router.post('/classify', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/classify-news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline: req.body.headline }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: 'AI service is not running' });
  }
});

// Admin: save a classified headline
router.post('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const { headline, category, is_relevant } = req.body;
    if (!headline) {
      return res.status(400).json({ message: 'Headline is required' });
    }
    await db.query(
      'INSERT INTO news_items (headline, category, is_relevant) VALUES (?, ?, ?)',
      [headline, category || 'Irrelevant', is_relevant ? 1 : 0]
    );
    res.status(201).json({ message: 'Saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Everyone logged in: admin sees all, others see relevant only
router.get('/', verifyToken, async (req, res) => {
  try {
    const sql = req.user.role === 'admin'
      ? 'SELECT * FROM news_items ORDER BY created_at DESC'
      : 'SELECT * FROM news_items WHERE is_relevant = 1 ORDER BY created_at DESC';
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;