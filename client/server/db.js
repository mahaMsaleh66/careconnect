require('dotenv').config();
const mysql = require('mysql2/promise');

const useSsl =
  process.env.DB_SSL === 'true' ||
  (process.env.DB_HOST && process.env.DB_HOST.includes('layerbase'));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'careconnect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

module.exports = pool;