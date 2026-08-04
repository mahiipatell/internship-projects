import api from './api';

const budgetService = {
  getBudget: () => api.get('/budget').then((res) => res.data.data),
  enableBudget: (data) => api.post('/budget', data).then((res) => res.data.data),
  updateIncome: (data) => api.put('/budget', data).then((res) => res.data.data),
  addAllocation: (data) => api.post('/budget/allocations', data).then((res) => res.data.data),
  updateAllocation: (id, data) =>
    api.put(`/budget/allocations/${id}`, data).then((res) => res.data.data),
  deleteAllocation: (id) =>
    api.delete(`/budget/allocations/${id}`).then((res) => res.data.data),
  disableBudget: () => api.post('/budget/disable').then((res) => res.data),
  resetBudget: () => api.post('/budget/reset').then((res) => res.data),
};

export default budgetService;
