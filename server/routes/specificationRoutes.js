const express = require('express');
const router = express.Router();
const {
  getSpecifications,
  updateSpecification,
} = require('../controllers/specificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getSpecifications);
router.put(
  '/:id',
  authorize('Admin', 'Quality Manager'),
  updateSpecification
);

module.exports = router;
