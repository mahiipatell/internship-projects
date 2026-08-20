import axios from 'axios';

// Use 127.0.0.1 (IPv4 loopback) not "localhost": browsers resolve
// "localhost" to IPv6 (::1) first, which is refused when the Node
// backend listens on IPv4 — that yields ERR_CONNECTION_REFUSED in the
// browser even though curl/PowerShell (IPv4) succeed.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

const api = axios.create({ baseURL });

// Attach the JWT (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralize 401 handling: clear session and bounce to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
