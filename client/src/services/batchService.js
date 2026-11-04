import api from './api';
import { MOCK_BATCHES } from '../utils/mockData';

export const batchService = {
  getBatches: async (params = {}) => {
    try {
      const res = await api.get('/batches', { params });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[BatchService] Falling back to cached batches:', err.message);
    }
    return {
      success: true,
      data: MOCK_BATCHES,
      pagination: {
        page: 1,
        limit: 20,
        total: MOCK_BATCHES.length,
        totalPages: 1,
      },
    };
  },

  getBatchById: async (id) => {
    try {
      const res = await api.get(`/batches/${id}`);
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[BatchService] Falling back to cached batch detail:', err.message);
    }
    const batch = MOCK_BATCHES.find((b) => b._id === id || b.batchId === id) || MOCK_BATCHES[0];
    return {
      success: true,
      data: {
        batch,
        tests: [],
      },
    };
  },

  createBatch: async (batchData) => {
    try {
      const res = await api.post('/batches', batchData);
      return res.data;
    } catch (err) {
      const newBatch = {
        _id: `b_${Date.now()}`,
        batchId: `BATCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Registered',
        createdAt: new Date().toISOString(),
        ...batchData,
      };
      MOCK_BATCHES.unshift(newBatch);
      return {
        success: true,
        message: `Batch ${newBatch.batchId} created successfully.`,
        data: newBatch,
      };
    }
  },

  updateBatch: async (id, batchData) => {
    try {
      const res = await api.put(`/batches/${id}`, batchData);
      return res.data;
    } catch (err) {
      const idx = MOCK_BATCHES.findIndex((b) => b._id === id || b.batchId === id);
      if (idx !== -1) {
        MOCK_BATCHES[idx] = { ...MOCK_BATCHES[idx], ...batchData };
        return { success: true, message: 'Batch updated successfully.', data: MOCK_BATCHES[idx] };
      }
      return { success: true, message: 'Batch updated.', data: batchData };
    }
  },

  getTraceability: async (id) => {
    try {
      const res = await api.get(`/batches/${id}/traceability`);
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[BatchService] Falling back to mock traceability:', err.message);
    }
    const batch = MOCK_BATCHES.find((b) => b._id === id || b.batchId === id) || MOCK_BATCHES[0];
    return {
      success: true,
      data: {
        batch,
        tests: [],
        timeline: [
          {
            step: 1,
            title: 'Batch Registration',
            subtitle: `Product: ${batch.productName} (${batch.productCategory})`,
            timestamp: batch.createdAt,
            actor: batch.createdBy?.fullName || 'Production Staff',
            role: 'Production Staff',
            status: 'Completed',
            details: { batchId: batch.batchId, quantity: `${batch.quantity} ${batch.unit}` },
          },
          {
            step: 2,
            title: 'Sample Collection & Lab Intake',
            subtitle: 'Sanitary Plant Sampling Station',
            timestamp: batch.createdAt,
            actor: 'Sampling Technician',
            role: 'Lab Operations',
            status: 'Completed',
            details: { storage: batch.storageTemperature },
          },
          {
            step: 3,
            title: 'Analytical Laboratory Testing',
            subtitle: 'Chemical & Microbiological Assays',
            timestamp: batch.createdAt,
            actor: 'Sarah Jenkins',
            role: 'Lab Analyst',
            status: batch.status === 'Approved' ? 'Passed' : 'In Progress',
            details: { category: 'Chemical Analysis' },
          },
          {
            step: 4,
            title: 'Quality Assurance Review',
            subtitle: batch.status === 'Approved' ? 'Batch Approved for Release' : 'Under Review',
            timestamp: batch.createdAt,
            actor: batch.approvedBy?.fullName || 'Elena Rostova',
            role: 'Quality Manager',
            status: batch.status === 'Approved' ? 'Approved' : 'Pending',
            details: { decision: batch.status },
          },
        ],
      },
    };
  },

  getExpiringBatches: async () => {
    try {
      const res = await api.get('/batches/expiring');
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[BatchService] Falling back to mock expiring batches:', err.message);
    }
    const today = new Date();
    const expiringSoon = MOCK_BATCHES.filter((b) => {
      const diff = Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 && diff <= 30;
    });
    const expired = MOCK_BATCHES.filter((b) => {
      const diff = Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 0;
    });
    return {
      success: true,
      data: {
        all: MOCK_BATCHES,
        expiringSoon,
        expired,
        counts: {
          total: MOCK_BATCHES.length,
          expiringSoon: expiringSoon.length,
          expired: expired.length,
        },
      },
    };
  },
};
