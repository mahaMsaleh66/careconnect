const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Donor makes a donation
router.post('/', verifyToken, allowRoles('donor'), async (req, res) => {
  try {
    const { amount, category, crisis_id } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Enter a valid amount' });
    }
    const receipt = 'CC-' + Date.now();
    await db.query(
      'INSERT INTO donations (donor_id, crisis_id, amount, category, receipt_no) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, crisis_id || null, amount, category || 'General', receipt]
    );
    res.status(201).json({ message: 'Donation recorded', receipt_no: receipt });
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
      'SELECT d.*, u.name AS donor_name, c.title AS crisis_title FROM donations d JOIN users u ON d.donor_id = u.id LEFT JOIN crises c ON d.crisis_id = c.id ORDER BY d.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;