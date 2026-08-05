import api from './api';

const recurringService = {
  getRules: () => api.get('/recurring').then((res) => res.data.data.rules),
  createRule: (data) => api.post('/recurring', data).then((res) => res.data.data.rule),
  updateRule: (id, data) => api.put(`/recurring/${id}`, data).then((res) => res.data.data.rule),
  deleteRule: (id) => api.delete(`/recurring/${id}`).then((res) => res.data),
  process: () => api.post('/recurring/process').then((res) => res.data.data),
};

export default recurringService;
