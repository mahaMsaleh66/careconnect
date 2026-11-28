const jwt = require('jsonwebtoken');
const db = require('../db');

const DEACTIVATED_MESSAGE = 'Your account has been deactivated by an administrator.';

async function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, name, role, is_active FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    if (Number(rows[0].is_active) === 0) {
      return res.status(403).json({ message: DEACTIVATED_MESSAGE });
    }
    req.user.role = rows[0].role;
    req.user.name = rows[0].name;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}

module.exports = { verifyToken, allowRoles, DEACTIVATED_MESSAGE };
