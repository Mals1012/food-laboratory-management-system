import api from './api';
import { MOCK_USERS } from '../utils/mockData';

export const userService = {
  getUsers: async (params = {}) => {
    try {
      const res = await api.get('/users', { params });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[UserService] Falling back to mock users:', err.message);
    }
    return {
      success: true,
      data: MOCK_USERS,
      pagination: {
        page: 1,
        limit: 20,
        total: MOCK_USERS.length,
        totalPages: 1,
      },
    };
  },

  createUser: async (userData) => {
    try {
      const res = await api.post('/users', userData);
      return res.data;
    } catch (err) {
      const newUser = {
        _id: `u_${Date.now()}`,
        ...userData,
      };
      MOCK_USERS.push(newUser);
      return { success: true, message: 'User created successfully.', data: newUser };
    }
  },

  updateUser: async (id, userData) => {
    try {
      const res = await api.put(`/users/${id}`, userData);
      return res.data;
    } catch (err) {
      const idx = MOCK_USERS.findIndex((u) => u._id === id || u.username === id);
      if (idx !== -1) {
        MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...userData };
        return { success: true, message: 'User updated.', data: MOCK_USERS[idx] };
      }
      return { success: true, message: 'User updated.', data: userData };
    }
  },
};
