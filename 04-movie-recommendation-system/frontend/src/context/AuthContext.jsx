import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check for an existing session (cookie or stored token).
  useEffect(() => {
    const bootstrap = async () => {
      const storedUser = localStorage.getItem('mrs_user');
      const storedToken = localStorage.getItem('mrs_token');
      if (!storedToken && !storedUser) {
        setLoading(false);
        return;
      }
      try {
        const { user: freshUser } = await authService.getMe();
        setUser(freshUser);
        localStorage.setItem('mrs_user', JSON.stringify(freshUser));
      } catch (err) {
        localStorage.removeItem('mrs_token');
        localStorage.removeItem('mrs_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const persistSession = (data) => {
    setUser(data.user);
    localStorage.setItem('mrs_token', data.token);
    localStorage.setItem('mrs_user', JSON.stringify(data.user));
  };

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    persistSession(data);
    return data.user;
  }, []);

  const login = useCallback(async (payload) => {
    const data = await authService.login(payload);
    persistSession(data);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('mrs_token');
      localStorage.removeItem('mrs_user');
    }
  }, []);

  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem('mrs_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, register, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
