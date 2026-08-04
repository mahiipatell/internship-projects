import api from './api';

const transactionService = {
  getTransactions: (params) => api.get('/transactions', { params }).then((res) => res.data.data),
  getTransaction: (id) => api.get(`/transactions/${id}`).then((res) => res.data.data.transaction),
  createTransaction: (data) =>
    api.post('/transactions', data).then((res) => res.data.data.transaction),
  updateTransaction: (id, data) =>
    api.put(`/transactions/${id}`, data).then((res) => res.data.data.transaction),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`).then((res) => res.data),
  getSummary: (params) => api.get('/transactions/summary', { params }).then((res) => res.data.data),
  getMonthlyAnalytics: (months) =>
    api
      .get('/transactions/analytics/monthly', { params: { months } })
      .then((res) => res.data.data.monthly),
  getCategoryBreakdown: (params) =>
    api
      .get('/transactions/analytics/category-breakdown', { params })
      .then((res) => res.data.data.breakdown),
  checkDuplicates: (transactions) =>
    api
      .post('/transactions/import/check-duplicates', { transactions })
      .then((res) => res.data.data.results),
  bulkImport: (transactions) =>
    api.post('/transactions/import/bulk', { transactions }).then((res) => res.data.data),
};

export default transactionService;
