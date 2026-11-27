const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');

let io = null;

const noop = {
  emit() {},
  to() {
    return noop;
  },
};

function clientOrigins() {
  const raw = process.env.CLIENT_URL || 'http://localhost:5173';
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: clientOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) {
        return next(new Error('No token provided'));
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await db.query(
        'SELECT id, name, role, is_active FROM users WHERE id = ?',
        [payload.id]
      );
      if (rows.length === 0 || Number(rows[0].is_active) === 0) {
        return next(new Error('Unauthorized'));
      }
      socket.user = {
        id: rows[0].id,
        role: rows[0].role,
        name: rows[0].name,
      };
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join('role:' + socket.user.role);
    socket.join('user:' + socket.user.id);
  });

  return io;
}

function getIO() {
  return io || noop;
}

module.exports = { initSocket, getIO };
