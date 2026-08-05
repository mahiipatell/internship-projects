import api from './api';

const accountService = {
  getAccounts: () => api.get('/accounts').then((res) => res.data.data.accounts),
  createAccount: (data) => api.post('/accounts', data).then((res) => res.data.data.account),
  updateAccount: (id, data) => api.put(`/accounts/${id}`, data).then((res) => res.data.data.account),
  deleteAccount: (id) => api.delete(`/accounts/${id}`).then((res) => res.data),
};

export default accountService;
