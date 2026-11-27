const express = require('express');
const db = require('../db');
const { verifyToken, allowRoles } = require('../middleware/auth');

const router = express.Router();
const METHODS = ['JazzCash', 'Easypaisa', 'Bank'];

function trim(value, max) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, max);
}

function parseActive(raw) {
  if (raw === undefined) return undefined;
  if (raw === true || raw === 1 || raw === '1') return 1;
  if (raw === false || raw === 0 || raw === '0') return 0;
  return null;
}

function readFields(body, partial) {
  const method = body.method;
  const account_title = trim(body.account_title, 120);
  const account_number = trim(body.account_number, 80);
  const bank_name = trim(body.bank_name, 120);
  const instructions = trim(body.instructions, 255);
  const is_active = parseActive(body.is_active);

  if (!partial) {
    if (!METHODS.includes(method)) {
      return { error: 'Method must be JazzCash, Easypaisa or Bank' };
    }
    if (!account_title || !account_number) {
      return { error: 'Account title and account number are required' };
    }
    if (is_active === null) {
      return { error: 'is_active must be 0 or 1' };
    }
  } else {
    if (method !== undefined && !METHODS.includes(method)) {
      return { error: 'Method must be JazzCash, Easypaisa or Bank' };
    }
    if (body.account_title !== undefined && !account_title) {
      return { error: 'Account title is required' };
    }
    if (body.account_number !== undefined && !account_number) {
      return { error: 'Account number is required' };
    }
    if (body.is_active !== undefined && is_active === null) {
      return { error: 'is_active must be 0 or 1' };
    }
  }

  return {
    method,
    account_title,
    account_number,
    bank_name,
    instructions,
    is_active: is_active === undefined ? 1 : is_active,
  };
}

router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const [rows] = await db.query(
        'SELECT * FROM payment_accounts ORDER BY is_active DESC, id DESC'
      );
      return res.json(rows);
    }
    const [rows] = await db.query(
      'SELECT * FROM payment_accounts WHERE is_active = 1 ORDER BY FIELD(method, "JazzCash", "Easypaisa", "Bank"), id DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const fields = readFields(req.body, false);
    if (fields.error) {
      return res.status(400).json({ message: fields.error });
    }
    const [result] = await db.query(
      'INSERT INTO payment_accounts (method, account_title, account_number, bank_name, instructions, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [
        fields.method,
        fields.account_title,
        fields.account_number,
        fields.bank_name,
        fields.instructions,
        fields.is_active,
      ]
    );
    const [[row]] = await db.query('SELECT * FROM payment_accounts WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Account saved', account: row });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.query('SELECT * FROM payment_accounts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    const fields = readFields(req.body, true);
    if (fields.error) {
      return res.status(400).json({ message: fields.error });
    }
    const next = existing[0];
    const method = req.body.method !== undefined ? fields.method : next.method;
    const account_title = req.body.account_title !== undefined ? fields.account_title : next.account_title;
    const account_number = req.body.account_number !== undefined ? fields.account_number : next.account_number;
    const bank_name = req.body.bank_name !== undefined ? fields.bank_name : next.bank_name;
    const instructions = req.body.instructions !== undefined ? fields.instructions : next.instructions;
    const is_active = req.body.is_active !== undefined ? fields.is_active : next.is_active;
    await db.query(
      'UPDATE payment_accounts SET method = ?, account_title = ?, account_number = ?, bank_name = ?, instructions = ?, is_active = ? WHERE id = ?',
      [method, account_title, account_number, bank_name, instructions, is_active, id]
    );
    const [[row]] = await db.query('SELECT * FROM payment_accounts WHERE id = ?', [id]);
    res.json({ message: 'Account updated', account: row });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', verifyToken, allowRoles('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.query('SELECT id FROM payment_accounts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }
    await db.query('DELETE FROM payment_accounts WHERE id = ?', [id]);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
