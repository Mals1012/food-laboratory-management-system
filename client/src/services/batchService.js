import api from './api';

export const batchService = {
  getBatches: async (params = {}) => {
    const res = await api.get('/batches', { params });
    return res.data;
  },
  getBatchById: async (id) => {
    const res = await api.get(`/batches/${id}`);
    return res.data;
  },
  createBatch: async (batchData) => {
    const res = await api.post('/batches', batchData);
    return res.data;
  },
  updateBatch: async (id, batchData) => {
    const res = await api.put(`/batches/${id}`, batchData);
    return res.data;
  },
  getTraceability: async (id) => {
    const res = await api.get(`/batches/${id}/traceability`);
    return res.data;
  },
  getExpiringBatches: async () => {
    const res = await api.get('/batches/expiring');
    return res.data;
  },
};
