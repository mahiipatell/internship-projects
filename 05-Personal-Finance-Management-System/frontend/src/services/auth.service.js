import api from './api';

const authService = {
  signup: (data) => api.post('/auth/signup', data).then((res) => res.data.data),
  login: (data) => api.post('/auth/login', data).then((res) => res.data.data),
  getMe: () => api.get('/auth/me').then((res) => res.data.data.user),
};

export default authService;
