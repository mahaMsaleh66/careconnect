const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const [users] = await db.query('SELECT role, COUNT(*) AS count FROM users GROUP BY role');
    const [crises] = await db.query('SELECT severity, COUNT(*) AS count FROM crises GROUP BY severity');
    const [requests] = await db.query('SELECT status, COUNT(*) AS count FROM help_requests GROUP BY status');
    const [tasks] = await db.query('SELECT status, COUNT(*) AS count FROM tasks GROUP BY status');
    const [byCategory] = await db.query('SELECT category, SUM(amount) AS total FROM donations GROUP BY category');
    const [donationTotal] = await db.query('SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM donations');
    const [active] = await db.query("SELECT COUNT(*) AS count FROM crises WHERE status = 'Active'");

    res.json({
      users: users,
      crises: crises,
      requests: requests,
      tasks: tasks,
      donationsByCategory: byCategory.map((d) => ({ category: d.category, total: Number(d.total) })),
      donationTotal: Number(donationTotal[0].total),
      donationCount: donationTotal[0].count,
      activeCrises: active[0].count,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;