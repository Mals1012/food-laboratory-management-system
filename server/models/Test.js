const mongoose = require('mongoose');

const testParameterValueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    unit: { type: String, required: true },
    standardMethod: { type: String, default: 'AOAC / ISO Standard' },
    minLimit: { type: Number, default: null },
    maxLimit: { type: Number, default: null },
    textLimit: { type: String, default: null },
    observedValue: { type: mongoose.Schema.Types.Mixed, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Pass', 'Fail'],
      default: 'Pending',
    },
    remarks: { type: String },
  },
  { _id: true }
);

const testSchema = new mongoose.Schema(
  {
    testId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    sampleDescription: {
      type: String,
      required: true,
      trim: true,
    },
    testCategory: {
      type: String,
      required: true,
      enum: [
        'Chemical Analysis',
        'Microbiological Testing',
        'Heavy Metals and Contaminants',
      ],
      index: true,
    },
    sampleCollectionDate: {
      type: Date,
      default: Date.now,
    },
    analysisStartDate: {
      type: Date,
    },
    analysisCompletionDate: {
      type: Date,
    },
    analyst: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    analystName: {
      type: String,
      required: true,
      default: 'Lab Analyst',
    },
    parameters: [testParameterValueSchema],
    overallOutcome: {
      type: String,
      enum: ['Pending', 'In Progress', 'Submitted', 'Pass', 'Fail'],
      default: 'Pending',
      index: true,
    },
    qaReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reviewerName: {
        type: String,
      },
      reviewDate: {
        type: Date,
      },
      decision: {
        type: String,
        enum: ['Approved', 'Rejected'],
      },
      comments: {
        type: String,
      },
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Test', testSchema);
