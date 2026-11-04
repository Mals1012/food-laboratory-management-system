import api from './api';
import { MOCK_TESTS, MOCK_BATCHES, DEFAULT_SPEC_PARAMETERS } from '../utils/mockData';

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

    // Search filter
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.testId.toLowerCase().includes(q) ||
          (typeof t.batchId === 'string' && t.batchId.toLowerCase().includes(q)) ||
          (t.sampleDescription && t.sampleDescription.toLowerCase().includes(q)) ||
          (t.analystName && t.analystName.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (params.category && params.category !== 'All') {
      filtered = filtered.filter((t) => t.testCategory === params.category);
    }

    // Outcome filter
    if (params.outcome && params.outcome !== 'All') {
      filtered = filtered.filter((t) => t.overallOutcome === params.outcome);
    }

    // Batch ID filter
    if (params.batchId) {
      const bQ = params.batchId.toUpperCase();
      filtered = filtered.filter((t) => {
        const bId = typeof t.batchId === 'object' ? t.batchId?.batchId : t.batchId;
        return bId === bQ;
      });
    }

    return {
      success: true,
      data: filtered,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / (params.limit || 20)) || 1,
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
      // Find linked batch to fetch category
      const targetBatch = MOCK_BATCHES.find(
        (b) => b._id === testData.batchId || b.batchId === testData.batchId
      );
      const category = testData.testCategory || 'Chemical Analysis';
      const specParams =
        DEFAULT_SPEC_PARAMETERS[category] || DEFAULT_SPEC_PARAMETERS['Chemical Analysis'];

      // Clone parameters
      const defaultParams = specParams.map((p) => ({
        ...p,
        observedValue: '',
        status: 'Pending',
        remarks: '',
      }));

      const newTest = {
        _id: `t_${Date.now()}`,
        testId: `TEST-${category.substring(0, 2).toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        batchId: targetBatch ? targetBatch.batchId : testData.batchId,
        batch: targetBatch || { batchId: testData.batchId, productName: 'Food Batch' },
        testCategory: category,
        sampleDescription: testData.sampleDescription || `Routine Quality Sample - ${category}`,
        analystName: 'Sarah Jenkins',
        parameters: defaultParams,
        overallOutcome: 'In Progress',
        notes: testData.notes || '',
        createdAt: new Date().toISOString(),
      };

      MOCK_TESTS.unshift(newTest);

      // If batch is Registered, move to Under Lab Testing
      if (targetBatch && targetBatch.status === 'Registered') {
        targetBatch.status = 'Under Lab Testing';
      }

      return {
        success: true,
        message: `Test record ${newTest.testId} created successfully.`,
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
        const test = MOCK_TESTS[idx];

        if (testData.parameters) {
          test.parameters = testData.parameters;
        }
        if (testData.notes !== undefined) {
          test.notes = testData.notes;
        }

        if (testData.isSubmittingForReview) {
          test.overallOutcome = 'Submitted';
          test.analysisCompletionDate = new Date().toISOString();
        } else if (test.overallOutcome === 'Pending') {
          test.overallOutcome = 'In Progress';
        }

        MOCK_TESTS[idx] = test;

        return {
          success: true,
          message: testData.isSubmittingForReview
            ? `Test ${test.testId} submitted for QA review successfully.`
            : 'Analytical observations saved successfully.',
          data: test,
        };
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
        const test = MOCK_TESTS[idx];
        const isApproved = reviewData.decision === 'Approved';

        test.overallOutcome = isApproved ? 'Pass' : 'Fail';
        test.qaReview = {
          decision: reviewData.decision,
          comments: reviewData.comments,
          reviewedAt: new Date().toISOString(),
          reviewerName: 'Elena Rostova',
        };

        // Synchronize linked batch status
        const batchIdStr = typeof test.batchId === 'object' ? test.batchId?.batchId : test.batchId;
        const linkedBatch = MOCK_BATCHES.find((b) => b.batchId === batchIdStr);

        if (linkedBatch) {
          if (!isApproved) {
            linkedBatch.status = 'Quarantined';
            linkedBatch.quarantineReason = `Quarantined due to failed laboratory test (${test.testId} - ${test.testCategory}).`;
          } else {
            // Check if any other test failed
            const allBatchTests = MOCK_TESTS.filter((t) => {
              const bId = typeof t.batchId === 'object' ? t.batchId?.batchId : t.batchId;
              return bId === batchIdStr;
            });
            const hasFail = allBatchTests.some((t) => t.overallOutcome === 'Fail');
            if (!hasFail) {
              const allPassedOrReviewed = allBatchTests.every((t) => t.overallOutcome === 'Pass');
              if (allPassedOrReviewed) {
                linkedBatch.status = 'Approved';
              }
            }
          }
        }

        return {
          success: true,
          message: isApproved
            ? `Test ${test.testId} APPROVED! Linked batch status updated.`
            : `Test ${test.testId} REJECTED! Batch placed in Quarantine.`,
          data: test,
        };
      }
      return { success: true, message: 'Reviewed successfully.' };
    }
  },
};
