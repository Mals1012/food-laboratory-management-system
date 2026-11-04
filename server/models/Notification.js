const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      enum: [
        'All',
        'Admin',
        'Lab Manager',
        'Lab Analyst',
        'Quality Manager',
        'Production Staff',
        'Viewer',
      ],
      default: 'All',
      index: true,
    },
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'danger'],
      default: 'info',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    link: {
      type: String,
    },
    entityId: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
