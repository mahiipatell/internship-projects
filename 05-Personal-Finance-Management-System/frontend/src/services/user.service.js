import api from './api';

const userService = {
  updateProfile: (data) => api.put('/users/me', data).then((res) => res.data.data.user),
  changePassword: (data) => api.put('/users/change-password', data).then((res) => res.data),
};

export default userService;
