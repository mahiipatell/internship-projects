import axios from 'axios';
import { auth } from '../config/firebase';

/**
 * Single shared Axios instance for the whole app. Every service module
 * imports this instead of creating its own axios client, so base URL,
 * auth headers, and error handling stay consistent everywhere.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach a fresh Firebase ID token to every outgoing request. getIdToken()
// returns the cached token and silently refreshes it in the background
// when it's close to expiring, so this stays cheap to call on every request.
api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
