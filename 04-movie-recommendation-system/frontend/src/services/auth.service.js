import api from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  getMe: () => api.get('/auth/me').then((r) => r.data),
};

export const userService = {
  updateProfile: (payload) => api.patch('/users/me', payload).then((r) => r.data),
  changePassword: (payload) => api.patch('/users/me/password', payload).then((r) => r.data),
  deleteAccount: () => api.delete('/users/me').then((r) => r.data),
  getFavoriteGenres: () => api.get('/users/me/genres').then((r) => r.data),
  setFavoriteGenres: (genres) => api.put('/users/me/genres', { genres }).then((r) => r.data),
  getStats: () => api.get('/users/me/stats').then((r) => r.data),
};
