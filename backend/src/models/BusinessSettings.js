const mongoose = require('mongoose');

const businessSettingsSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      default: 'QuickWash Car Care',
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    openingTime: {
      type: String,
      default: '09:00',
    },
    closingTime: {
      type: String,
      default: '19:00',
    },
    slotDuration: {
      type: Number,
      default: 60,
      min: [15, 'Minimum slot duration is 15 minutes'],
    },
    maxBookingsPerSlot: {
      type: Number,
      default: 3,
      min: [1, 'At least 1 booking per slot required'],
    },
    // Anti-abuse: how many upcoming bookings one customer may hold at once.
    maxActiveBookingsPerUser: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 active booking per customer'],
    },
    // A CONFIRMED booking is released back to the pool if the customer
    // has not checked in within this many minutes after the slot starts.
    checkInGraceMinutes: {
      type: Number,
      default: 15,
      min: [0, 'Grace period cannot be negative'],
    },
    // Strikes (admin-marked no-shows) before the customer is blocked.
    noShowStrikeLimit: {
      type: Number,
      default: 2,
      min: [1, 'At least 1 strike required'],
    },
    // How long a customer is blocked after reaching the strike limit.
    noShowBlockDays: {
      type: Number,
      default: 30,
      min: [1, 'Block period must be at least 1 day'],
    },
    // Customers can cancel their own bookings only this many hours before the slot starts.
    minCancelHoursBeforeSlot: {
      type: Number,
      default: 2,
      min: [0, 'Cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BusinessSettings', businessSettingsSchema);
