import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext();

function readStoredUser() {
  try {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (!token || !saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const token = localStorage.getItem('token');
      const cached = readStoredUser();

      if (!token || !cached) {
        if (!cancelled) {
          setToken('');
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setUser(cached);

      try {
        const res = await api.get('/auth/me');
        if (cancelled) return;
        const fresh = {
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        };
        localStorage.setItem('user', JSON.stringify(fresh));
        setUser(fresh);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken('');
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = (nextToken, userData) => {
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(nextToken);
    setUser(userData);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
