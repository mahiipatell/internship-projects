import api from './api';

const savingsGoalService = {
  getGoals: () => api.get('/savings-goals').then((res) => res.data.data.goals),
  createGoal: (data) => api.post('/savings-goals', data).then((res) => res.data.data.goal),
  updateGoal: (id, data) => api.put(`/savings-goals/${id}`, data).then((res) => res.data.data.goal),
  contribute: (id, amount) =>
    api.post(`/savings-goals/${id}/contribute`, { amount }).then((res) => res.data.data.goal),
  deleteGoal: (id) => api.delete(`/savings-goals/${id}`).then((res) => res.data),
};

export default savingsGoalService;
