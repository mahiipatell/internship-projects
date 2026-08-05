import api from './api';

const userService = {
  updateProfile: (data) => api.put('/users/me', data).then((res) => res.data.data.user),
};

export default userService;
