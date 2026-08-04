import api from './api';

const categoryService = {
  getCategories: (type) =>
    api.get('/categories', { params: type ? { type } : {} }).then((res) => res.data.data.categories),
  createCategory: (data) => api.post('/categories', data).then((res) => res.data.data.category),
  deleteCategory: (id) => api.delete(`/categories/${id}`).then((res) => res.data),
};

export default categoryService;
