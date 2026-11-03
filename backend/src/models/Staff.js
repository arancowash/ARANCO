const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    maxDailyBookings: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

staffSchema.index({ user: 1 });
staffSchema.index({ isActive: 1 });

module.exports = mongoose.model('Staff', staffSchema);
