const mongoose = require('mongoose');
const { bookingStatus } = require('../config/constants');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
    },
    duration: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    bookingCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    // Slot start as an absolute instant, used to auto-release unclaimed slots.
    slotStartAt: {
      type: Date,
      default: null,
    },
    // What the customer will pay at the counter (offer price already applied).
    finalPrice: {
      type: Number,
      default: 0,
      min: [0, 'Final price cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(bookingStatus),
      default: bookingStatus.CONFIRMED,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    noShowAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ user: 1, bookingDate: 1 });
bookingSchema.index({ bookingDate: 1, timeSlot: 1, status: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ assignedStaff: 1 });
bookingSchema.index({ bookingCode: 1 }, { unique: true, sparse: true });
bookingSchema.index({ slotStartAt: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
