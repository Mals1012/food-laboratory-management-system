const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    productCategory: {
      type: String,
      required: [true, 'Product category is required'],
      enum: [
        'Dairy & Milk Products',
        'Bakery & Confectionery',
        'Beverages & Juices',
        'Canned & Preserved Foods',
        'Meat, Poultry & Seafood',
        'Cereals, Grains & Pulses',
        'Oils, Fats & Dressings',
        'Snacks & Savory Foods',
      ],
      index: true,
    },
    manufacturingDate: {
      type: Date,
      required: [true, 'Manufacturing date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    storageTemperature: {
      type: String,
      required: [true, 'Storage temperature is required'],
      default: '4°C ± 2°C',
    },
    storageHumidity: {
      type: String,
      default: '< 65% RH',
    },
    storageConditions: {
      type: String,
      required: [true, 'Storage conditions are required'],
      enum: [
        'Ambient (18-25°C)',
        'Refrigerated (2-8°C)',
        'Frozen (-18°C or below)',
        'Controlled Dry & Cool',
        'Aseptic Sealed',
      ],
      default: 'Ambient (18-25°C)',
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1000,
    },
    unit: {
      type: String,
      default: 'kg',
      enum: ['kg', 'L', 'units', 'cartons', 'tonnes'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Registered', 'Under Lab Testing', 'Approved', 'Quarantined', 'Rejected'],
      default: 'Registered',
      index: true,
    },
    samplingDate: {
      type: Date,
    },
    sampleLocation: {
      type: String,
      default: 'Main Processing Plant - Silo/Line 1',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalDate: {
      type: Date,
    },
    quarantineReason: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for remaining shelf life in days
batchSchema.virtual('remainingShelfLifeDays').get(function () {
  if (!this.expiryDate) return 0;
  const now = new Date();
  const diffTime = this.expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

batchSchema.set('toJSON', { virtuals: true });
batchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Batch', batchSchema);
