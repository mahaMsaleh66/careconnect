require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const { initSocket } = require('./socket');

const app = express();
const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crises', require('./routes/crises'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/news', require('./routes/news'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payment-accounts', require('./routes/paymentAccounts'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/translate', require('./routes/translate'));
app.use('/api/flood', require('./routes/flood'));
app.get('/', (req, res) => {
  res.send('CareConnect API is running');
});

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) AS users FROM users');
    res.json({ connected: true, rows: rows });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

const PORT = Number(process.env.PORT) || 5000;
const httpServer = http.createServer(app);
initSocket(httpServer);
httpServer.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));
