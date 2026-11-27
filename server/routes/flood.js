const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');
const { resolveCoords, lookupCity, citiesMatch } = require('../utils/pakistanCities');
const { getIO } = require('../socket');

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const LIVE_QUERY = 'Pakistan flood OR Sindh flood OR "Indus river" flood OR monsoon flood';
const SEVERITIES = ['Advisory', 'Warning', 'Emergency'];

async function classifyHeadline(headline) {
  const response = await fetch(AI_SERVICE_URL + '/classify-news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headline: headline }),
  });
  if (!response.ok) throw new Error('AI classify failed');
  return response.json();
}

async function loadAlert(id) {
  const [rows] = await db.query(
    'SELECT a.*, u.name AS created_by_name FROM flood_alerts a LEFT JOIN users u ON a.created_by = u.id WHERE a.id = ?',
    [id]
  );
  return rows[0] || null;
}

async function notifyVolunteers(alert) {
  const [vols] = await db.query(
    "SELECT vp.user_id, vp.city FROM volunteer_profiles vp JOIN users u ON u.id = vp.user_id WHERE u.role = 'volunteer' AND u.is_active = 1 AND vp.city IS NOT NULL AND vp.city <> ''"
  );
  vols.forEach((vol) => {
    if (citiesMatch(vol.city, alert.district)) {
      getIO().to('user:' + vol.user_id).emit('flood:volunteer_alert', {
        action: 'district',
        alert: alert,
        district: alert.district,
      });
    }
  });
}

router.get('/alerts', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, u.name AS created_by_name
       FROM flood_alerts a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.status = 'Active' OR a.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
       ORDER BY FIELD(a.status, 'Active', 'Resolved'),
                FIELD(a.severity, 'Emergency', 'Warning', 'Advisory'),
                a.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/live-feed', async (req, res) => {
  let articles = [];
  try {
    const url =
      'https://api.gdeltproject.org/api/v2/doc/doc?query=' +
      encodeURIComponent(LIVE_QUERY) +
      '&mode=ArtList&format=json&maxrecords=20&sort=DateDesc&timespan=7d';
    const response = await fetch(url);
    const text = await response.text();
    try {
      articles = JSON.parse(text).articles || [];
    } catch (e) {
      return res.status(502).json({ message: 'Flood news source is busy. Wait 10 seconds and try again.' });
    }
  } catch (err) {
    return res.status(502).json({ message: 'Could not reach the flood news source' });
  }

  const results = [];
  let aiOk = true;
  for (const article of articles) {
    const headline = article.title || '';
    const city = lookupCity(headline);
    let category = 'Flood';
    let is_relevant = 1;
    let confidence = null;
    if (aiOk && headline) {
      try {
        const classified = await classifyHeadline(headline);
        category = classified.category || category;
        is_relevant = classified.is_relevant ? 1 : 0;
        confidence = classified.confidence;
      } catch (err) {
        aiOk = false;
      }
    }
    results.push({
      headline: headline,
      url: article.url || null,
      source: article.domain || null,
      published: article.seendate || null,
      district: city ? city.name : null,
      lat: city ? city.lat : null,
      lng: city ? city.lng : null,
      category: category,
      is_relevant: Boolean(is_relevant),
      confidence: confidence,
    });
  }
  res.json(results);
});

router.post('/alerts', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const { title, district, severity, water_level, description, lat, lng } = req.body;
    const place = (district || '').trim();
    if (!place) {
      return res.status(400).json({ message: 'District is required' });
    }
    const level = SEVERITIES.includes(severity) ? severity : 'Warning';
    const coords = resolveCoords(lat, lng, place);
    const heading = (title || '').trim() || (place + ' flood ' + level);
    const [result] = await db.query(
      'INSERT INTO flood_alerts (title, district, severity, water_level, description, lat, lng, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [heading, place, level, water_level || null, description || null, coords.lat, coords.lng, req.user.id]
    );
    const alert = await loadAlert(result.insertId);
    getIO().emit('flood:alert', { action: 'created', alert: alert });
    await notifyVolunteers(alert);
    res.status(201).json({ message: 'Flood alert issued', alert: alert });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/alerts/:id/resolve', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const [found] = await db.query('SELECT id FROM flood_alerts WHERE id = ?', [req.params.id]);
    if (found.length === 0) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    await db.query("UPDATE flood_alerts SET status = 'Resolved' WHERE id = ?", [req.params.id]);
    const alert = await loadAlert(req.params.id);
    getIO().emit('flood:alert', { action: 'resolved', alert: alert });
    res.json({ message: 'Flood alert resolved', alert: alert });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
