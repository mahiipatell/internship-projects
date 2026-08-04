import axios from 'axios';

/**
 * Single shared Axios instance for the whole app. Every service module
 * (auth.service.js, transaction.service.js, etc. — added in later phases)
 * imports this instead of creating its own axios client, so base URL,
 * auth headers, and error handling stay consistent everywhere.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT (once auth exists in Phase 2) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized 401 handling: if the token is invalid/expired, clear it and
// send the user back to login. This is filled in fully in Phase 2.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
