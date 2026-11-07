const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Volunteer: view own profile
router.get('/me', verifyToken, allowRoles('volunteer'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM volunteer_profiles WHERE user_id = ?', [req.user.id]);
    res.json(rows[0] || { skills: '', city: '', availability: 'Available' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Volunteer: save own profile
router.put('/me', verifyToken, allowRoles('volunteer'), async (req, res) => {
  try {
    const { skills, city, availability } = req.body;
    await db.query(
      'INSERT INTO volunteer_profiles (user_id, skills, city, availability) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE skills = VALUES(skills), city = VALUES(city), availability = VALUES(availability)',
      [req.user.id, skills || '', city || '', availability || 'Available']
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
      "SELECT u.id, u.name, u.phone, vp.skills, vp.city, vp.availability FROM users u LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id WHERE u.role = 'volunteer'"
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
      "SELECT u.id, u.name, vp.skills, vp.city, vp.availability FROM users u LEFT JOIN volunteer_profiles vp ON vp.user_id = u.id WHERE u.role = 'volunteer'"
    );
    const response = await fetch('http://localhost:8000/match-volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request: reqRows[0], volunteers: vols }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: 'AI service is not running' });
  }
});
module.exports = router;