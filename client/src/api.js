import axios from 'axios';

function resolveApiBase() {
  const raw = String(import.meta.env.VITE_API_URL || '').trim();
  if (raw) return raw.replace(/\/$/, '');
  return '/api';
}

export function apiOrigin() {
  const api = resolveApiBase();
  if (/^https?:\/\//i.test(api)) {
    return api.replace(/\/api$/i, '');
  }
  const socket = String(import.meta.env.VITE_SOCKET_URL || '').trim();
  if (socket) return socket.replace(/\/$/, '');
  return '';
}

export function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  const origin = apiOrigin();
  if (!origin) return path;
  return origin + (path.startsWith('/') ? path : '/' + path);
}

const api = axios.create({ baseURL: resolveApiBase() });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message;
    if (
      error.response?.status === 403 &&
      message === 'Your account has been deactivated by an administrator.'
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
