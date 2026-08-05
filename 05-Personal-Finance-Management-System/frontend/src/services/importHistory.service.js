import api from './api';

const importHistoryService = {
  getHistory: (params) => api.get('/import-history', { params }).then((res) => res.data.data.records),
  getRecord: (id) => api.get(`/import-history/${id}`).then((res) => res.data.data.record),
  createRecord: (data) => api.post('/import-history', data).then((res) => res.data.data.record),
  deleteRecord: (id) => api.delete(`/import-history/${id}`).then((res) => res.data),
};

export default importHistoryService;
