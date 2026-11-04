const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'BATCH_CREATE',
        'BATCH_UPDATE',
        'BATCH_STATUS_CHANGE',
        'TEST_CREATE',
        'TEST_UPDATE',
        'TEST_SUBMIT',
        'QA_APPROVE',
        'QA_REJECT',
        'COA_GENERATE',
        'USER_CREATE',
        'USER_UPDATE',
        'USER_STATUS_CHANGE',
        'SPEC_UPDATE',
      ],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Auth', 'Batch', 'Test', 'QA', 'COA', 'User', 'ProductSpecification'],
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // immutable
    versionKey: false,
  }
);

// Prevent updates or deletions via Mongoose middleware
auditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs are immutable and cannot be updated.');
});
auditLogSchema.pre('updateMany', function () {
  throw new Error('Audit logs are immutable and cannot be updated.');
});
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs are immutable and cannot be updated.');
});
auditLogSchema.pre('deleteOne', function () {
  throw new Error('Audit logs are immutable and cannot be deleted.');
});
auditLogSchema.pre('deleteMany', function () {
  throw new Error('Audit logs are immutable and cannot be deleted.');
});
auditLogSchema.pre('findOneAndDelete', function () {
  throw new Error('Audit logs are immutable and cannot be deleted.');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
