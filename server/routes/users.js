const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Any user: update own profile
router.put('/me', verifyToken, async (req, res) => {
  try {
    const { name, phone, city } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    await db.query('UPDATE users SET name = ?, phone = ?, city = ? WHERE id = ?', [
      name,
      phone || null,
      city || null,
      req.user.id,
    ]);
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Any user: change own password
router.put('/me/password', verifyToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(current_password || '', rows[0].password);
    if (!match) {
      return res.status(400).json({ message: 'Current password is wrong' });
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: list all users
router.get('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, city, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: delete a user who has no records
router.delete('/:id', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const [target] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
    if (target.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (target[0].role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be deleted' });
    }
    const [used] = await db.query(
      'SELECT (SELECT COUNT(*) FROM donations WHERE donor_id = ?) + (SELECT COUNT(*) FROM help_requests WHERE needy_id = ?) + (SELECT COUNT(*) FROM tasks WHERE volunteer_id = ?) + (SELECT COUNT(*) FROM feedback WHERE user_id = ?) AS n',
      [id, id, id, id]
    );
    if (used[0].n > 0) {
      return res.status(400).json({ message: 'This user has donations, requests, tasks or feedback, so it cannot be deleted' });
    }
    await db.query('DELETE FROM volunteer_profiles WHERE user_id = ?', [id]);
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;