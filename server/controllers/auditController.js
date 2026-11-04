const AuditLog = require('../models/AuditLog');

// @route   GET /api/audit-logs
// @desc    Get audit trail with search, filters (username, action, entity, date range), pagination
// @access  Private (Admin, Lab Manager, Quality Manager)
const getAuditLogs = async (req, res, next) => {
  try {
    const {
      search,
      username,
      action,
      entityType,
      startDate,
      endDate,
      sortBy = 'timestamp',
      order = 'desc',
      page = 1,
      limit = 25,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { entityId: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    if (username && username !== 'All') {
      query.username = username.toLowerCase();
    }

    if (action && action !== 'All') {
      query.action = action;
    }

    if (entityType && entityType !== 'All') {
      query.entityType = entityType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
