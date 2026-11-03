const mongoose = require('mongoose');
const { vehicleTypes } = require('../config/constants');

const vehicleCategoryPricingSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      required: true,
      enum: vehicleTypes,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    offerPrice: {
      type: Number,
      default: null,
      min: [0, 'Offer price cannot be negative'],
    },
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    includedServices: [
      {
        type: String,
        trim: true,
      },
    ],
    image: {
      type: String,
      default: null,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
    },
    vehicleCategoryPricing: [vehicleCategoryPricingSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);
