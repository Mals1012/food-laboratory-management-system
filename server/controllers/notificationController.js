const Notification = require('../models/Notification');

// @route   GET /api/notifications
// @desc    Get user's notifications & unread count
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    const query = {
      $or: [
        { recipientRole: 'All' },
        { recipientRole: userRole },
        { recipientUser: userId },
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const formatted = notifications.map((n) => {
      const isRead = n.readBy && n.readBy.some((id) => id.toString() === userId.toString());
      return {
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        entityId: n.entityId,
        createdAt: n.createdAt,
        isRead,
      };
    });

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      data: formatted,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/notifications/:id/read
// @desc    Mark single notification as read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/notifications/mark-all-read
// @desc    Mark all user's notifications as read
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [
          { recipientRole: 'All' },
          { recipientRole: userRole },
          { recipientUser: userId },
        ],
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
