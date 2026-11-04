import api from './api';

export const testService = {
  getTests: async (params = {}) => {
    const res = await api.get('/tests', { params });
    return res.data;
  },
  getTestById: async (id) => {
    const res = await api.get(`/tests/${id}`);
    return res.data;
  },
  createTest: async (testData) => {
    const res = await api.post('/tests', testData);
    return res.data;
  },
  updateTest: async (id, testData) => {
    const res = await api.put(`/tests/${id}`, testData);
    return res.data;
  },
  reviewTest: async (id, reviewData) => {
    const res = await api.patch(`/tests/${id}/review`, reviewData);
    return res.data;
  },
};
