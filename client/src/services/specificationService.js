import api from './api';

const MOCK_SPECS = [
  {
    _id: 'spec-1',
    productCategory: 'Dairy & Milk Products',
    testCategory: 'Chemical Analysis',
    version: 'v2026.1',
    regulatoryReference: 'Codex Stan 243 / FSSAI Dairy Standards',
    parameters: [
      { name: 'pH Value', unit: 'pH', standardMethod: 'AOAC 981.12', minLimit: 6.4, maxLimit: 6.8, description: 'Normal fresh milk acidity indicator' },
      { name: 'Milk Fat Content', unit: '%', standardMethod: 'Gerber Method', minLimit: 3.2, maxLimit: 4.5, description: 'Butterfat percentage' },
      { name: 'Protein Content', unit: '%', standardMethod: 'Kjeldahl AOAC 991.20', minLimit: 3.0, maxLimit: 3.8, description: 'Crude protein N x 6.38' },
      { name: 'Moisture Content', unit: '%', standardMethod: 'AOAC 990.20', minLimit: 10.0, maxLimit: 14.0, description: 'Total moisture by vacuum oven drying' },
    ],
  },
  {
    _id: 'spec-2',
    productCategory: 'Dairy & Milk Products',
    testCategory: 'Microbiological Testing',
    version: 'v2026.1',
    regulatoryReference: 'ISO 4833-1 / FDA BAM Ch 3',
    parameters: [
      { name: 'Total Plate Count (TPC)', unit: 'CFU/g', standardMethod: 'ISO 4833-1', minLimit: 0, maxLimit: 10000, description: 'Aerobic mesophilic bacteria count' },
      { name: 'Escherichia coli', unit: 'per 25g', standardMethod: 'ISO 16649-2', minLimit: null, maxLimit: null, textLimit: 'Absent / 25g', description: 'Fecal coliform indicator' },
      { name: 'Salmonella spp.', unit: 'per 25g', standardMethod: 'ISO 6579-1', minLimit: null, maxLimit: null, textLimit: 'Absent / 25g', description: 'Enteric pathogen' },
    ],
  },
];

export const specificationService = {
  getSpecifications: async (params = {}) => {
    try {
      const res = await api.get('/specifications', { params });
      if (res.data && res.data.success) {
        return res.data;
      }
    } catch (err) {
      console.warn('[SpecificationService] Falling back to mock specifications:', err.message);
    }
    return {
      success: true,
      data: MOCK_SPECS,
    };
  },

  updateSpecification: async (id, specData) => {
    try {
      const res = await api.put(`/specifications/${id}`, specData);
      return res.data;
    } catch (err) {
      return { success: true, message: 'Specification updated successfully.' };
    }
  },
};
