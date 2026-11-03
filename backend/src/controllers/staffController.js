const User = require('../models/User');
const Staff = require('../models/Staff');
const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorHandler');
const { roles, bookingStatus } = require('../config/constants');

exports.createStaff = async (req, res, next) => {
  try {
    const { fullName, email, mobile, password, employeeId, skills, maxDailyBookings } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return next(new AppError('User with this email or mobile already exists', 400));
    }

    const existingStaff = await Staff.findOne({ employeeId });
    if (existingStaff) {
      return next(new AppError('Staff with this employee ID already exists', 400));
    }

    const user = await User.create({
      fullName,
      email,
      mobile,
      password,
      role: roles.STAFF,
    });

    const staff = await Staff.create({
      user: user._id,
      employeeId,
      skills,
      maxDailyBookings: maxDailyBookings || 10,
    });

    const populatedStaff = await Staff.findById(staff._id).populate('user', 'fullName email mobile');

    res.status(201).json({ success: true, data: { staff: populatedStaff } });
  } catch (error) {
    next(error);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return next(new AppError('Staff not found', 404));

    if (req.body.fullName || req.body.email || req.body.mobile) {
      await User.findByIdAndUpdate(staff.user, {
        ...(req.body.fullName && { fullName: req.body.fullName }),
        ...(req.body.email && { email: req.body.email }),
        ...(req.body.mobile && { mobile: req.body.mobile }),
      });
    }

    if (req.body.skills) staff.skills = req.body.skills;
    if (req.body.maxDailyBookings) staff.maxDailyBookings = req.body.maxDailyBookings;

    await staff.save();

    const updatedStaff = await Staff.findById(staff._id).populate('user', 'fullName email mobile');
    res.json({ success: true, data: { staff: updatedStaff } });
  } catch (error) {
    next(error);
  }
};

exports.disableStaff = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return next(new AppError('Staff not found', 404));

    staff.isActive = !staff.isActive;
    await staff.save();

    await User.findByIdAndUpdate(staff.user, { isActive: staff.isActive });

    res.json({
      success: true,
      message: `Staff ${staff.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

exports.getStaffBookings = async (req, res, next) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) return next(new AppError('Staff profile not found', 404));

    const bookings = await Booking.find({
      assignedStaff: staff._id,
      status: { $in: [bookingStatus.CONFIRMED, bookingStatus.VEHICLE_RECEIVED, bookingStatus.WASHING, bookingStatus.CLEANING, bookingStatus.READY] },
    })
      .populate('user', 'fullName mobile')
      .populate('vehicle', 'registrationNumber make model')
      .populate('service', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { bookings } });
  } catch (error) {
    next(error);
  }
};
