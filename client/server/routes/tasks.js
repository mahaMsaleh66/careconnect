const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');
const { getIO } = require('../socket');

const router = express.Router();

// Admin: assign a request to a volunteer
router.post('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const { request_id, volunteer_id } = req.body;
    if (!request_id || !volunteer_id) {
      return res.status(400).json({ message: 'Select a request and a volunteer' });
    }
    const [result] = await db.query('INSERT INTO tasks (request_id, volunteer_id) VALUES (?, ?)', [request_id, volunteer_id]);
    await db.query("UPDATE help_requests SET status = 'Assigned' WHERE id = ?", [request_id]);
    const [[task]] = await db.query(
      'SELECT t.*, r.message, r.need_type, r.urgency, r.needy_id, v.name AS volunteer_name FROM tasks t JOIN help_requests r ON t.request_id = r.id JOIN users v ON t.volunteer_id = v.id WHERE t.id = ?',
      [result.insertId]
    );
    const payload = { action: 'assigned', task: task };
    getIO().to('user:' + volunteer_id).emit('task:assigned', payload);
    getIO().to('role:admin').emit('task:updated', payload);
    if (task && task.needy_id) {
      getIO().to('user:' + task.needy_id).emit('request:updated', {
        action: 'assigned',
        request: { id: request_id, status: 'Assigned', needy_id: task.needy_id },
      });
    }
    getIO().to('role:admin').emit('request:updated', {
      action: 'assigned',
      request: { id: request_id, status: 'Assigned' },
    });
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
    const [[task]] = await db.query(
      'SELECT t.*, r.message, r.need_type, r.urgency, r.needy_id, v.name AS volunteer_name FROM tasks t JOIN help_requests r ON t.request_id = r.id JOIN users v ON t.volunteer_id = v.id WHERE t.id = ?',
      [req.params.id]
    );
    const payload = { action: 'status', task: task || { ...rows[0], status: status } };
    getIO().to('role:admin').emit('task:updated', payload);
    getIO().to('user:' + req.user.id).emit('task:updated', payload);
    if (status === 'Done' && rows[0].request_id) {
      const donePayload = {
        action: 'completed',
        request: { id: rows[0].request_id, status: 'Completed', needy_id: task && task.needy_id },
      };
      getIO().to('role:admin').emit('request:updated', donePayload);
      if (task && task.needy_id) {
        getIO().to('user:' + task.needy_id).emit('request:updated', donePayload);
      }
    }
    res.json({ message: 'Task updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;