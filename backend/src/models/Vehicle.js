const mongoose = require('mongoose');
const { vehicleTypes, fuelTypes } = require('../config/constants');

const vehicleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      uppercase: true,
      trim: true,
    },
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
      default: '',
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: vehicleTypes,
    },
    fuelType: {
      type: String,
      required: [true, 'Fuel type is required'],
      enum: fuelTypes,
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: Number,
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Invalid year'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ user: 1 });
vehicleSchema.index({ registrationNumber: 1 });
vehicleSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
