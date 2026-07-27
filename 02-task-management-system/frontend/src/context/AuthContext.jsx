import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { const d = await res.json(); setUser(d.user); }
        else logout();
      } catch { logout(); }
      finally { setLoading(false); }
    };
    verify();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData); setToken(authToken);
    localStorage.setItem('token', authToken);
  };
  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('token');
  };
  const updateUser = (u) => setUser(u);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
