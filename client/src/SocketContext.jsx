import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

function resolveSocketUrl() {
  const socket = String(import.meta.env.VITE_SOCKET_URL || '').trim();
  if (socket) return socket.replace(/\/$/, '');
  const api = String(import.meta.env.VITE_API_URL || '').trim();
  if (/^https?:\/\//i.test(api)) {
    return api.replace(/\/api\/?$/i, '').replace(/\/$/, '');
  }
  return 'http://localhost:5000';
}

function describeEvent(event, payload) {
  const crisis = payload && payload.crisis;
  const request = payload && payload.request;
  const task = payload && payload.task;
  const donation = payload && payload.donation;

  if (event === 'crisis:updated') {
    const title = (crisis && crisis.title) || 'A crisis';
    if (payload && payload.action === 'resolved') {
      return { title: 'Crisis resolved', body: title };
    }
    return { title: 'New crisis', body: title };
  }
  if (event === 'request:created') {
    return {
      title: 'New help request',
      body: ((request && request.need_type) || 'Help') + (request && request.city ? ' · ' + request.city : ''),
    };
  }
  if (event === 'request:updated') {
    return {
      title: 'Request updated',
      body: 'Status: ' + ((request && request.status) || 'updated'),
    };
  }
  if (event === 'task:assigned') {
    return {
      title: 'Task assigned',
      body: (task && task.need_type ? task.need_type + ' · ' : '') + 'A volunteer was assigned',
    };
  }
  if (event === 'task:updated') {
    return {
      title: 'Task updated',
      body: 'Status: ' + ((task && task.status) || 'updated'),
    };
  }
  if (event === 'donation:created') {
    const amount = donation && donation.amount != null ? 'PKR ' + donation.amount : 'A donation';
    return { title: 'Donation recorded', body: amount };
  }
  if (event === 'donation:updated') {
    const status = (donation && donation.status) || (payload && payload.action) || 'updated';
    const amount = donation && donation.amount != null ? 'PKR ' + donation.amount : 'Donation';
    return { title: 'Donation ' + status, body: amount };
  }
  const alert = payload && payload.alert;
  if (event === 'flood:alert') {
    const place = (alert && alert.district) || 'Sindh';
    if (payload && payload.action === 'resolved') {
      return { title: 'Flood alert resolved', body: place };
    }
    return {
      title: 'Flood alert: ' + ((alert && alert.severity) || 'Warning'),
      body: place + (alert && alert.title ? ' · ' + alert.title : ''),
    };
  }
  if (event === 'flood:volunteer_alert') {
    return {
      title: 'Flood alert in your area',
      body: ((alert && alert.district) || payload.district || 'Your district') + ' needs volunteers',
    };
  }
  return { title: 'Live update', body: event };
}

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const timers = useRef([]);

  useEffect(() => {
    if (!user || !token) {
      setSocket((current) => {
        if (current) current.disconnect();
        return null;
      });
      return undefined;
    }

    const next = io(resolveSocketUrl(), {
      auth: { token: token },
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    });
    setSocket(next);

    return () => {
      next.disconnect();
      setSocket(null);
    };
  }, [user, token]);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const events = [
      'crisis:updated',
      'request:created',
      'request:updated',
      'task:assigned',
      'task:updated',
      'donation:created',
      'donation:updated',
      'flood:alert',
      'flood:volunteer_alert',
    ];

    const onEvent = (event) => (payload) => {
      const copy = describeEvent(event, payload || {});
      const item = {
        id: Date.now() + '-' + Math.random().toString(16).slice(2),
        event: event,
        title: copy.title,
        body: copy.body,
        payload: payload || {},
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [item, ...prev].slice(0, 40));
      setToasts((prev) => [...prev, item]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== item.id));
      }, 4500);
      timers.current.push(timer);
    };

    const handlers = events.map((event) => {
      const handler = onEvent(event);
      socket.on(event, handler);
      return { event, handler };
    });

    return () => {
      handlers.forEach(({ event, handler }) => socket.off(event, handler));
    };
  }, [socket]);

  const value = useMemo(() => {
    const unread = notifications.filter((item) => !item.read).length;
    return {
      socket,
      notifications,
      unread,
      markAllRead: () => {
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      },
      clearAll: () => {
        setNotifications([]);
        setToasts([]);
      },
      dismissToast: (id) => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      },
    };
  }, [socket, notifications]);

  return (
    <SocketContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <button
            type="button"
            className="live-toast"
            key={toast.id}
            onClick={() => value.dismissToast(toast.id)}
          >
            <strong>{toast.title}</strong>
            <span>{toast.body}</span>
          </button>
        ))}
      </div>
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext) || {
    socket: null,
    notifications: [],
    unread: 0,
    markAllRead: () => {},
    clearAll: () => {},
  };
}

export function useLiveReload(events, reload) {
  const { socket } = useSocket();
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const key = Array.isArray(events) ? events.join('|') : String(events || '');

  useEffect(() => {
    if (!socket || !key) return undefined;
    const list = Array.isArray(events) ? events : [events];
    const wrapped = () => {
      if (typeof reloadRef.current === 'function') reloadRef.current();
    };
    list.forEach((event) => socket.on(event, wrapped));
    return () => list.forEach((event) => socket.off(event, wrapped));
  }, [socket, key]);
}
