const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const role = req.user.role;
    const id = req.user.id;
    let stats = [];

    if (role === 'admin') {
      const [[u]] = await db.query('SELECT COUNT(*) AS c FROM users');
      const [[c]] = await db.query("SELECT COUNT(*) AS c FROM crises WHERE status = 'Active'");
      const [[r]] = await db.query("SELECT COUNT(*) AS c FROM help_requests WHERE status = 'Pending'");
      const [[d]] = await db.query('SELECT COALESCE(SUM(amount), 0) AS c FROM donations');
      stats = [
        { label: 'Total Users', value: u.c },
        { label: 'Active Crises', value: c.c },
        { label: 'Pending Requests', value: r.c },
        { label: 'Total Donated (PKR)', value: Number(d.c).toLocaleString() },
      ];
    } else if (role === 'donor') {
      const [[d]] = await db.query(
        'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS n FROM donations WHERE donor_id = ?',
        [id]
      );
      stats = [
        { label: 'My Total Donated (PKR)', value: Number(d.total).toLocaleString() },
        { label: 'Donations Made', value: d.n },
      ];
    } else if (role === 'volunteer') {
      const [[o]] = await db.query("SELECT COUNT(*) AS c FROM tasks WHERE volunteer_id = ? AND status <> 'Done'", [id]);
      const [[dn]] = await db.query("SELECT COUNT(*) AS c FROM tasks WHERE volunteer_id = ? AND status = 'Done'", [id]);
      stats = [
        { label: 'Open Tasks', value: o.c },
        { label: 'Completed Tasks', value: dn.c },
      ];
    } else if (role === 'needy') {
      const [[t]] = await db.query('SELECT COUNT(*) AS c FROM help_requests WHERE needy_id = ?', [id]);
      const [[p]] = await db.query("SELECT COUNT(*) AS c FROM help_requests WHERE needy_id = ? AND status = 'Pending'", [id]);
      const [[cp]] = await db.query("SELECT COUNT(*) AS c FROM help_requests WHERE needy_id = ? AND status = 'Completed'", [id]);
      stats = [
        { label: 'My Requests', value: t.c },
        { label: 'Pending', value: p.c },
        { label: 'Completed', value: cp.c },
      ];
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/transparency', verifyToken, async (req, res) => {
  try {
    const [[totals]] = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_amount, COUNT(*) AS donation_count FROM donations'
    );
    const [byCategory] = await db.query(
      'SELECT category, COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS n FROM donations GROUP BY category ORDER BY amount DESC'
    );
    const [[reqOpen]] = await db.query(
      "SELECT COUNT(*) AS c FROM help_requests WHERE status IN ('Pending', 'Assigned')"
    );
    const [[reqDone]] = await db.query(
      "SELECT COUNT(*) AS c FROM help_requests WHERE status IN ('Completed', 'Rejected')"
    );
    const [[taskActive]] = await db.query(
      "SELECT COUNT(*) AS c FROM tasks WHERE status IN ('Assigned', 'In Progress')"
    );
    const [[taskDone]] = await db.query("SELECT COUNT(*) AS c FROM tasks WHERE status = 'Done'");
    res.json({
      total_amount: Number(totals.total_amount) || 0,
      donation_count: totals.donation_count || 0,
      by_category: byCategory,
      requests: { open: reqOpen.c, resolved: reqDone.c },
      tasks: { active: taskActive.c, done: taskDone.c },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;