const express = require('express');
const router = express.Router();
const {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  getBatchTraceability,
  getExpiringBatches,
} = require('../controllers/batchController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// List and search
router.get('/', getBatches);
router.get('/expiring', getExpiringBatches);
router.get('/:id', getBatchById);
router.get('/:id/traceability', getBatchTraceability);

// Create batch: Admin, Lab Manager, Production Staff
router.post(
  '/',
  authorize('Admin', 'Lab Manager', 'Production Staff'),
  createBatch
);

// Update batch
router.put(
  '/:id',
  authorize('Admin', 'Lab Manager', 'Quality Manager', 'Production Staff'),
  updateBatch
);

module.exports = router;
