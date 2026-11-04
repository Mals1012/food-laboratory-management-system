import api from './api';

export const specificationService = {
  getSpecifications: async (params = {}) => {
    const res = await api.get('/specifications', { params });
    return res.data;
  },
  updateSpecification: async (id, specData) => {
    const res = await api.put(`/specifications/${id}`, specData);
    return res.data;
  },
};
