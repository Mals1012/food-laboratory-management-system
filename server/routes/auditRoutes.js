const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// View audit logs: Admin, Lab Manager, Quality Manager
router.get(
  '/',
  authorize('Admin', 'Lab Manager', 'Quality Manager'),
  getAuditLogs
);

module.exports = router;
