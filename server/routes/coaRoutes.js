const express = require('express');
const router = express.Router();
const { getCOAByBatch, generateCOA } = require('../controllers/coaController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// View COA
router.get('/:batchId', getCOAByBatch);

// Generate / Issue COA: Admin, Quality Manager
router.post(
  '/:batchId/generate',
  authorize('Admin', 'Quality Manager'),
  generateCOA
);

module.exports = router;
