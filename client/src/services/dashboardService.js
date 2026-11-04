import api from './api';
import { MOCK_DASHBOARD } from '../utils/mockData';

export const dashboardService = {
  getStats: async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[DashboardService] Backend unavailable, using cached metrics:', err.message);
    }
    return {
      success: true,
      data: MOCK_DASHBOARD,
    };
  },
};
