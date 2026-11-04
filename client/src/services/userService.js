import api from './api';

export const userService = {
  getUsers: async (params = {}) => {
    const res = await api.get('/users', { params });
    return res.data;
  },
  createUser: async (userData) => {
    const res = await api.post('/users', userData);
    return res.data;
  },
  updateUser: async (id, userData) => {
    const res = await api.put(`/users/${id}`, userData);
    return res.data;
  },
};
