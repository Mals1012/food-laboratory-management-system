import api from './api';

export const coaService = {
  getCOAByBatch: async (batchId) => {
    const res = await api.get(`/coa/${batchId}`);
    return res.data;
  },
  generateCOA: async (batchId, payload = {}) => {
    const res = await api.post(`/coa/${batchId}/generate`, payload);
    return res.data;
  },
};
