import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Central axios instance. Sends the httpOnly auth cookie automatically
// (withCredentials) and also attaches a Bearer token from localStorage as a
// fallback for environments where third-party cookies are restricted.
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mrs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses so components can read `error.message` safely.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    if (error.response?.status === 401) {
      localStorage.removeItem('mrs_token');
      localStorage.removeItem('mrs_user');
    }

    return Promise.reject({ ...error, message });
  }
);

export const TMDB_IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

// Helper to build a full TMDB image URL from a path, or a placeholder if none.
export function tmdbImage(path, size = 'w500') {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export default api;
