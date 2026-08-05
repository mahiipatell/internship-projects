import api from './api';

// Signup/login/password-reset now happen via Firebase directly (see
// core/authLogic.js) — this service only talks to the one backend auth
// endpoint left: fetching the synced Postgres profile for the signed-in
// Firebase user.
const authService = {
  getMe: () => api.get('/auth/me').then((res) => res.data.data.user),
};

export default authService;
