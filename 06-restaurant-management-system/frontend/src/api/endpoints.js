import api from './axios';

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
};

export const categoryApi = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const menuApi = {
  list: (params) => api.get('/menu-items', { params }),
  create: (data) => api.post('/menu-items', data),
  update: (id, data) => api.put(`/menu-items/${id}`, data),
  remove: (id) => api.delete(`/menu-items/${id}`),
};

export const tableApi = {
  list: (params) => api.get('/tables', { params }),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  remove: (id) => api.delete(`/tables/${id}`),
};

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateItems: (id, items) => api.put(`/orders/${id}/items`, { items }),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  remove: (id) => api.delete(`/orders/${id}`),
};

export const billingApi = {
  list: (params) => api.get('/bills', { params }),
  get: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  recordPayment: (id, data) => api.put(`/bills/${id}/payment`, data),
};

export const invoiceApi = {
  generate: (billId) => api.post(`/invoices/bill/${billId}`),
  // The download route requires a Bearer token, which a plain browser
  // navigation (e.g. window.open) cannot attach. Fetch as a blob through
  // the authenticated axios instance instead, then save it client-side.
  download: (invoiceNumber) =>
    api.get(`/invoices/download/${invoiceNumber}`, { responseType: 'blob' }),
};

export const reportApi = {
  sales: (params) => api.get('/reports/sales', { params }),
  bestSellers: (params) => api.get('/reports/best-sellers', { params }),
  revenue: (params) => api.get('/reports/revenue', { params }),
};

export const userApi = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  // Admin resetting another user's password (admin-only route).
  changePassword: (id, newPassword) => api.put(`/users/${id}/password`, { newPassword }),
  // Any authenticated user changing their OWN password.
  changeOwnPassword: (newPassword) => api.put('/users/me/password', { newPassword }),
  remove: (id) => api.delete(`/users/${id}`),
};
