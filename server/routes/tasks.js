const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Admin: assign a request to a volunteer
router.post('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const { request_id, volunteer_id } = req.body;
    if (!request_id || !volunteer_id) {
      return res.status(400).json({ message: 'Select a request and a volunteer' });
    }
    await db.query('INSERT INTO tasks (request_id, volunteer_id) VALUES (?, ?)', [request_id, volunteer_id]);
    await db.query("UPDATE help_requests SET status = 'Assigned' WHERE id = ?", [request_id]);
    res.status(201).json({ message: 'Task assigned' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: all tasks
router.get('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT t.*, r.message, r.need_type, r.urgency, v.name AS volunteer_name FROM tasks t JOIN help_requests r ON t.request_id = r.id JOIN users v ON t.volunteer_id = v.id ORDER BY t.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Volunteer: own tasks
router.get('/my', verifyToken, allowRoles('volunteer'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT t.*, r.message, r.need_type, r.urgency, r.city, n.name AS needy_name, n.phone AS needy_phone FROM tasks t JOIN help_requests r ON t.request_id = r.id JOIN users n ON r.needy_id = n.id WHERE t.volunteer_id = ? ORDER BY t.created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Volunteer: update own task status
router.put('/:id/status', verifyToken, allowRoles('volunteer'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Assigned', 'In Progress', 'Done'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const [rows] = await db.query('SELECT * FROM tasks WHERE id = ? AND volunteer_id = ?', [req.params.id, req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
    if (status === 'Done') {
      await db.query("UPDATE help_requests SET status = 'Completed' WHERE id = ?", [rows[0].request_id]);
    }
    res.json({ message: 'Task updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;