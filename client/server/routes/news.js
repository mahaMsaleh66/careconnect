const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const LIVE_QUERY =
  'Pakistan (flood OR earthquake OR famine OR hunger OR dengue OR "food shortage" OR fire OR drought OR "relief camp")';

async function classify(headline) {
  const response = await fetch(AI_SERVICE_URL + '/classify-news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headline: headline }),
  });
  return response.json();
}

// Admin: classify one pasted headline
router.post('/classify', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const data = await classify(req.body.headline);
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: 'AI service is not running' });
  }
});

// Admin: fetch live headlines from GDELT and classify each one
router.get('/live', verifyToken, allowRoles('admin'), async (req, res) => {
  let articles = [];
  try {
    const url =
      'https://api.gdeltproject.org/api/v2/doc/doc?query=' +
      encodeURIComponent(LIVE_QUERY) +
      '&mode=ArtList&format=json&maxrecords=25&sort=DateDesc&timespan=3d';
    const response = await fetch(url);
    const text = await response.text();
    try {
      articles = JSON.parse(text).articles || [];
    } catch (e) {
      return res.status(502).json({ message: 'News source is busy. Wait 10 seconds and try again.' });
    }
  } catch (err) {
    return res.status(502).json({ message: 'Could not reach the news source' });
  }

  try {
    const results = [];
    for (const a of articles) {
      const c = await classify(a.title);
      results.push({
        headline: a.title,
        url: a.url,
        source: a.domain,
        category: c.category,
        is_relevant: c.is_relevant,
        confidence: c.confidence,
      });
    }
    res.json(results);
  } catch (err) {
    res.status(503).json({ message: 'AI service is not running' });
  }
});

// Admin: save a headline to the feed
router.post('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const { headline, category, is_relevant, url, source } = req.body;
    if (!headline) {
      return res.status(400).json({ message: 'Headline is required' });
    }
    const [dup] = await db.query('SELECT id FROM news_items WHERE headline = ?', [headline]);
    if (dup.length > 0) {
      return res.json({ message: 'Already saved' });
    }
    await db.query(
      'INSERT INTO news_items (headline, category, is_relevant, url, source) VALUES (?, ?, ?, ?, ?)',
      [headline, category || 'Irrelevant', is_relevant ? 1 : 0, url || null, source || null]
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