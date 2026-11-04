import api from './api';
import { MOCK_TESTS } from '../utils/mockData';

export const testService = {
  getTests: async (params = {}) => {
    try {
      const res = await api.get('/tests', { params });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[TestService] Falling back to mock test records:', err.message);
    }
    let filtered = [...MOCK_TESTS];
    if (params.outcome === 'Submitted') {
      filtered = filtered.filter((t) => t.overallOutcome === 'Submitted');
    }
    return {
      success: true,
      data: filtered,
      pagination: {
        page: 1,
        limit: 20,
        total: filtered.length,
        totalPages: 1,
      },
    };
  },

  getTestById: async (id) => {
    try {
      const res = await api.get(`/tests/${id}`);
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[TestService] Falling back to mock test detail:', err.message);
    }
    const test = MOCK_TESTS.find((t) => t._id === id || t.testId === id) || MOCK_TESTS[0];
    return {
      success: true,
      data: test,
    };
  },

  createTest: async (testData) => {
    try {
      const res = await api.post('/tests', testData);
      return res.data;
    } catch (err) {
      const newTest = {
        _id: `t_${Date.now()}`,
        testId: `TEST-CH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        overallOutcome: 'In Progress',
        createdAt: new Date().toISOString(),
        ...testData,
      };
      MOCK_TESTS.unshift(newTest);
      return {
        success: true,
        message: `Test ${newTest.testId} created successfully.`,
        data: newTest,
      };
    }
  },

  updateTest: async (id, testData) => {
    try {
      const res = await api.put(`/tests/${id}`, testData);
      return res.data;
    } catch (err) {
      const idx = MOCK_TESTS.findIndex((t) => t._id === id || t.testId === id);
      if (idx !== -1) {
        MOCK_TESTS[idx] = { ...MOCK_TESTS[idx], ...testData };
        return { success: true, message: 'Test updated.', data: MOCK_TESTS[idx] };
      }
      return { success: true, message: 'Test updated.', data: testData };
    }
  },

  reviewTest: async (id, reviewData) => {
    try {
      const res = await api.patch(`/tests/${id}/review`, reviewData);
      return res.data;
    } catch (err) {
      const idx = MOCK_TESTS.findIndex((t) => t._id === id || t.testId === id);
      if (idx !== -1) {
        MOCK_TESTS[idx].overallOutcome = reviewData.decision === 'Approved' ? 'Pass' : 'Fail';
        MOCK_TESTS[idx].qaReview = {
          decision: reviewData.decision,
          comments: reviewData.comments,
          reviewedAt: new Date().toISOString(),
          reviewerName: 'Elena Rostova',
        };
        return { success: true, message: `Test outcome marked as ${reviewData.decision}.`, data: MOCK_TESTS[idx] };
      }
      return { success: true, message: 'Reviewed successfully.' };
    }
  },
};
