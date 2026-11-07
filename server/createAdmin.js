const bcrypt = require('bcryptjs');
const db = require('./db');

async function run() {
  const hashed = await bcrypt.hash('admin123', 10);
  await db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['Admin', 'admin@careconnect.com', hashed, 'admin']
  );
  console.log('Admin created: admin@careconnect.com / admin123');
  process.exit();
}

run();