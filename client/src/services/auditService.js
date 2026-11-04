import api from './api';
import { MOCK_DASHBOARD } from '../utils/mockData';

export const auditService = {
  getLogs: async (params = {}) => {
    try {
      const res = await api.get('/audit-logs', { params });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[AuditService] Falling back to mock audit logs:', err.message);
    }
    return {
      success: true,
      data: MOCK_DASHBOARD.recentActivities,
      pagination: {
        page: 1,
        limit: 20,
        total: MOCK_DASHBOARD.recentActivities.length,
        totalPages: 1,
      },
    };
  },
};
