const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Staff = require('../models/Staff');
const Service = require('../models/Service');
const BusinessSettings = require('../models/BusinessSettings');
const { AppError } = require('../middleware/errorHandler');
const { bookingStatus } = require('../config/constants');
const { releaseExpiredBookings } = require('./bookingController');
const { sendNotification } = require('../utils/notifications');

exports.getDashboard = async (req, res, next) => {
  try {
    await releaseExpiredBookings();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeStatuses = [
      bookingStatus.CONFIRMED,
      bookingStatus.VEHICLE_RECEIVED,
      bookingStatus.WASHING,
      bookingStatus.CLEANING,
      bookingStatus.READY,
    ];

    const [
      todayBookings,
      pendingBookings,
      completedToday,
      noShowsToday,
      totalCustomers,
      recentBookings,
    ] = await Promise.all([
      Booking.countDocuments({ bookingDate: { $gte: today, $lt: tomorrow } }),
      Booking.countDocuments({ status: { $in: activeStatuses } }),
      Booking.countDocuments({ status: bookingStatus.COMPLETED, bookingDate: { $gte: today, $lt: tomorrow } }),
      Booking.countDocuments({ status: bookingStatus.NO_SHOW, bookingDate: { $gte: today, $lt: tomorrow } }),
      User.countDocuments({ role: 'customer' }),
      Booking.find()
        .populate('user', 'fullName mobile')
        .populate('vehicle', 'registrationNumber make model')
        .populate('service', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      success: true,
      data: {
        todayBookings,
        pendingBookings,
        completedToday,
        noShowsToday,
        totalCustomers,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: 'customer' };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const [vehicleCount, bookingCount, completedCount] = await Promise.all([
          Vehicle.countDocuments({ user: customer._id, isActive: true }),
          Booking.countDocuments({ user: customer._id }),
          Booking.countDocuments({ user: customer._id, status: bookingStatus.COMPLETED }),
        ]);
        return {
          ...customer.toJSON(),
          vehicleCount,
          bookingCount,
          completedCount,
        };
      })
    );

    res.json({
      success: true,
      data: {
        customers: customersWithStats,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllBookings = async (req, res, next) => {
  try {
    await releaseExpiredBookings();

    const { status, date, serviceId, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status === 'ACTIVE') {
      query.status = { $in: ['CONFIRMED', 'IN_PROGRESS', 'VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'] };
    } else if (status) {
      query.status = status;
    }
    if (serviceId) query.service = serviceId;
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const d = new Date(year, month - 1, day, 0, 0, 0, 0);
      const nextD = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
      query.bookingDate = { $gte: d, $lt: nextD };
    }

    if (search) {
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.$or = [
        { user: { $in: users.map((u) => u._id) } },
        { bookingCode: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('user', 'fullName mobile email')
      .populate('vehicle', 'registrationNumber make model vehicleType')
      .populate('service', 'name')
      .populate('assignedStaff', 'employeeId')
      .sort({ bookingDate: 1, timeSlot: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        bookings,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookingCountsByDate = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return next(new AppError('from and to dates are required (YYYY-MM-DD)', 400));
    }

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);

    const rows = await Booking.aggregate([
      {
        $match: {
          bookingDate: { $gte: start, $lt: end },
          status: { $nin: [bookingStatus.CANCELLED] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {};
    rows.forEach((r) => { counts[r._id] = r.count; });

    res.json({ success: true, data: { counts } });
  } catch (error) {
    next(error);
  }
};

exports.getStaff = async (req, res, next) => {
  try {
    const staff = await Staff.find({ isActive: true })
      .populate('user', 'fullName email mobile')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { staff } });
  } catch (error) {
    next(error);
  }
};

exports.assignStaff = async (req, res, next) => {
  try {
    const { bookingId, staffId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new AppError('Booking not found', 404));

    const staff = await Staff.findById(staffId);
    if (!staff || !staff.isActive) return next(new AppError('Staff not found or inactive', 404));

    booking.assignedStaff = staffId;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'fullName mobile')
      .populate('vehicle', 'registrationNumber make model')
      .populate('service', 'name')
      .populate('assignedStaff', 'employeeId');

    res.json({ success: true, data: { booking: updatedBooking } });
  } catch (error) {
    next(error);
  }
};

exports.updateBusinessSettings = async (req, res, next) => {
  try {
    const allowedFields = [
      'businessName',
      'maxBookingsPerSlot',
      'maxActiveBookingsPerUser',
      'checkInGraceMinutes',
      'noShowStrikeLimit',
      'noShowBlockDays',
      'minCancelHoursBeforeSlot',
      'slotDuration',
      'openingTime',
      'closingTime',
      'email',
      'phone',
      'address',
    ];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = new BusinessSettings(updates);
    } else {
      Object.assign(settings, updates);
    }
    await settings.save();

    res.json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
};

exports.getBusinessSettings = async (req, res, next) => {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({});
    }
    res.json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
};

exports.getVehiclesWithBookings = async (req, res, next) => {
  try {
    const activeStatuses = ['CONFIRMED', 'IN_PROGRESS', 'VEHICLE_RECEIVED', 'WASHING', 'CLEANING', 'READY'];
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('user', 'fullName mobile email')
      .sort({ createdAt: -1 });

    const vehicleIds = vehicles.map(v => v._id);
    const activeBookings = await Booking.find({
      vehicle: { $in: vehicleIds },
      status: { $in: activeStatuses },
    })
      .populate('service', 'name duration')
      .populate('assignedStaff', 'employeeId');

    const bookingsByVehicle = {};
    activeBookings.forEach(b => {
      const vid = b.vehicle.toString();
      if (!bookingsByVehicle[vid]) bookingsByVehicle[vid] = [];
      bookingsByVehicle[vid].push(b);
    });

    const result = vehicles.map(v => ({
      ...v.toObject(),
      activeBookings: bookingsByVehicle[v._id.toString()] || [],
    }));

    result.sort((a, b) => {
      if (a.activeBookings.length > 0 && b.activeBookings.length === 0) return -1;
      if (a.activeBookings.length === 0 && b.activeBookings.length > 0) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ success: true, data: { vehicles: result } });
  } catch (error) {
    next(error);
  }
};

// Manual kill switch: block a customer from booking for N days, with a reason.
exports.blockCustomer = async (req, res, next) => {
  try {
    const { days, reason } = req.body;
    const blockDays = Math.max(1, Number(days) || 30);

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) return next(new AppError('Customer not found', 404));

    customer.bookingBlockedUntil = new Date(Date.now() + blockDays * 24 * 60 * 60 * 1000);
    customer.bookingBlockReason = String(reason || '').trim().slice(0, 200);
    await customer.save();

    await sendNotification(
      customer._id,
      'Account Blocked from Booking',
      `The shop has blocked your account from booking for ${blockDays} days${customer.bookingBlockReason ? `: ${customer.bookingBlockReason}` : ''}. Please contact the shop directly.`,
      { blockedUntil: customer.bookingBlockedUntil.toISOString() }
    );

    res.json({
      success: true,
      message: `Customer blocked for ${blockDays} days`,
      data: { blockedUntil: customer.bookingBlockedUntil },
    });
  } catch (error) {
    next(error);
  }
};

exports.unblockCustomer = async (req, res, next) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) return next(new AppError('Customer not found', 404));

    customer.bookingBlockedUntil = null;
    customer.bookingBlockReason = '';
    customer.noShowCount = 0;
    await customer.save();

    await sendNotification(
      customer._id,
      'Account Unblocked',
      'Your account can book slots again. Thank you!',
      {}
    );

    res.json({ success: true, message: 'Customer unblocked and strikes cleared' });
  } catch (error) {
    next(error);
  }
};
