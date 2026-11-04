const mongoose = require('mongoose');

const parameterSpecSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    unit: { type: String, required: true },
    standardMethod: { type: String, default: 'Standard AOAC / ISO Method' },
    minLimit: { type: Number, default: null }, // e.g. pH min 6.4
    maxLimit: { type: Number, default: null }, // e.g. Moisture max 14%
    textLimit: { type: String, default: null }, // e.g. "Absent / 25g" for Salmonella
    description: { type: String },
  },
  { _id: true }
);

const productSpecificationSchema = new mongoose.Schema(
  {
    productCategory: {
      type: String,
      required: true,
      index: true,
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
    version: {
      type: String,
      default: 'v2026.1',
    },
    regulatoryReference: {
      type: String,
      default: 'Codex Alimentarius / FSSAI / FDA Title 21 CFR',
    },
    parameters: [parameterSpecSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSpecificationSchema.index({ productCategory: 1, testCategory: 1 }, { unique: true });

module.exports = mongoose.model('ProductSpecification', productSpecificationSchema);
