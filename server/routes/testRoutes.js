const express = require('express');
const router = express.Router();
const {
  getTests,
  getTestById,
  createTest,
  updateTest,
  reviewTest,
} = require('../controllers/testController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getTests);
router.get('/:id', getTestById);

// Create test: Admin, Lab Manager, Lab Analyst
router.post(
  '/',
  authorize('Admin', 'Lab Manager', 'Lab Analyst'),
  createTest
);

// Update parameter values & submit for QA
router.put(
  '/:id',
  authorize('Admin', 'Lab Manager', 'Lab Analyst'),
  updateTest
);

// QA Review (Approve or Reject outcome): Admin, Quality Manager
router.patch(
  '/:id/review',
  authorize('Admin', 'Quality Manager'),
  reviewTest
);

module.exports = router;
