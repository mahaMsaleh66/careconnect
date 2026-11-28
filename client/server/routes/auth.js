const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');
const { verifyToken, DEACTIVATED_MESSAGE } = require('../middleware/auth');

const router = express.Router();
const PUBLIC_ROLES = ['donor', 'volunteer', 'needy'];

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function asPassword(value) {
  if (value == null) return '';
  return typeof value === 'string' ? value : String(value);
}

function asHash(value) {
  if (value == null) return '';
  if (Buffer.isBuffer(value)) return value.toString('utf8').trim();
  return String(value).trim();
}

async function findUserByEmail(email) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

function signUser(user) {
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
  return {
    token: token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

async function createVolunteerProfile(userId, city) {
  await db.query('INSERT INTO volunteer_profiles (user_id, city) VALUES (?, ?)', [userId, city || null]);
}

async function verifyGoogleCredential(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error('Google Sign-In is not configured');
    err.status = 503;
    throw err;
  }
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    const err = new Error('Google token did not include an email address');
    err.status = 400;
    throw err;
  }
  return {
    google_id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
  };
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const name = String((req.body && req.body.name) || '').trim();
    const email = normalizeEmail(req.body && req.body.email);
    const password = asPassword(req.body && req.body.password);
    const phone = req.body && req.body.phone;
    const city = req.body && req.body.city;
    const role = req.body && req.body.role;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    if (!PUBLIC_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, city, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, phone || null, city || null, role]
    );

    if (role === 'volunteer') {
      await createVolunteerProfile(result.insertId, city);
    }

    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    const password = asPassword(req.body && req.body.password);

    if (!email || !password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(400).json({
        message: 'This account uses Google Sign-In. Please continue with Google.',
      });
    }

    const match = await bcrypt.compare(password, asHash(user.password));
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (Number(user.is_active) === 0) {
      return res.status(403).json({ message: DEACTIVATED_MESSAGE });
    }

    res.json(signUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GOOGLE SIGN-IN
router.post('/google', async (req, res) => {
  try {
    const credential = req.body && req.body.credential;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const profile = await verifyGoogleCredential(credential);
    profile.email = normalizeEmail(profile.email);
    const role = PUBLIC_ROLES.includes(req.body && req.body.role) ? req.body.role : null;

    const [byGoogle] = await db.query('SELECT * FROM users WHERE google_id = ?', [profile.google_id]);
    let user = byGoogle[0];

    if (!user) {
      user = await findUserByEmail(profile.email);
      if (user && !user.google_id) {
        await db.query('UPDATE users SET google_id = ? WHERE id = ?', [profile.google_id, user.id]);
        user.google_id = profile.google_id;
      }
    }

    if (user) {
      if (Number(user.is_active) === 0) {
        return res.status(403).json({ message: DEACTIVATED_MESSAGE });
      }
      return res.json(signUser(user));
    }

    if (!role) {
      return res.json({
        needsRole: true,
        email: profile.email,
        name: profile.name,
      });
    }

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, google_id, is_active) VALUES (?, ?, NULL, ?, ?, 1)',
      [profile.name, profile.email, role, profile.google_id]
    );
    if (role === 'volunteer') {
      await createVolunteerProfile(result.insertId, null);
    }
    const [[created]] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json(signUser(created));
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    if (err.message && /Token used too late|Invalid token signature|Wrong recipient/i.test(err.message)) {
      return res.status(401).json({ message: 'Google Sign-In failed. Please try again.' });
    }
    res.status(500).json({ message: err.message });
  }
});

// WHO AM I (protected)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, phone, city, role, is_active, password, google_id FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    if (Number(rows[0].is_active) === 0) {
      return res.status(403).json({ message: DEACTIVATED_MESSAGE });
    }
    const row = rows[0];
    res.json({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      city: row.city,
      role: row.role,
      is_active: row.is_active,
      has_password: Boolean(row.password),
      google_id: row.google_id ? true : false,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
