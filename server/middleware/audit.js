const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  username,
  userRole,
  userId,
  action,
  entityType,
  entityId,
  description,
  ipAddress = '127.0.0.1',
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      username: username || 'System',
      userRole: userRole || 'System',
      userId: userId || null,
      action,
      entityType,
      entityId: String(entityId),
      description,
      ipAddress,
      metadata,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[Audit Logger Error]', err.message);
  }
};

module.exports = { logAudit };
