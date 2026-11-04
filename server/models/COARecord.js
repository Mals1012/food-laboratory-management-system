const mongoose = require('mongoose');

const coaRecordSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
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
    productName: {
      type: String,
      required: true,
    },
    productCategory: {
      type: String,
      required: true,
    },
    manufacturingDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
    },
    storageConditions: {
      type: String,
    },
    sampleInfo: {
      sampleId: String,
      collectionDate: Date,
      sampleLocation: String,
    },
    testResults: {
      chemical: [
        {
          parameter: String,
          unit: String,
          method: String,
          specification: String,
          observed: mongoose.Schema.Types.Mixed,
          result: String,
        },
      ],
      microbiological: [
        {
          parameter: String,
          unit: String,
          method: String,
          specification: String,
          observed: mongoose.Schema.Types.Mixed,
          result: String,
        },
      ],
      heavyMetals: [
        {
          parameter: String,
          unit: String,
          method: String,
          specification: String,
          observed: mongoose.Schema.Types.Mixed,
          result: String,
        },
      ],
    },
    overallVerdict: {
      type: String,
      default: 'CONFORMS TO FSSAI / CODEX REGULATORY QUALITY SPECIFICATIONS - APPROVED FOR RELEASE',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    issuedByName: {
      type: String,
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    accreditationStandard: {
      type: String,
      default: 'ISO/IEC 17025:2017 Testing Laboratory Accreditation',
    },
    status: {
      type: String,
      enum: ['Issued', 'Revoked'],
      default: 'Issued',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('COARecord', coaRecordSchema);
