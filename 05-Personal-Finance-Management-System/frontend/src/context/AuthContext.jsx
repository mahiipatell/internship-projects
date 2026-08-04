import { createContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .getMe()
      .then((me) => setUser(me))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, token } = await authService.login(credentials);
    localStorage.setItem('token', token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const signup = useCallback(async (details) => {
    const { user: newUser, token } = await authService.signup(details);
    localStorage.setItem('token', token);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
