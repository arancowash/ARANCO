const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Service = require('../models/Service');
const BusinessSettings = require('../models/BusinessSettings');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { bookingStatus } = require('../config/constants');
const { sendNotification, notifyAdmins, getNotificationForStatus } = require('../utils/notifications');

// Statuses that occupy a slot. Cancelled / no-show bookings free their slot.
const ACTIVE_STATUSES = [
  bookingStatus.CONFIRMED,
  bookingStatus.VEHICLE_RECEIVED,
  bookingStatus.WASHING,
  bookingStatus.CLEANING,
  bookingStatus.READY,
];

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const pad2 = (n) => String(n).padStart(2, '0');

// Parse "YYYY-MM-DD" as a local calendar date (avoids UTC shifting it a day).
const parseDateOnly = (value) => {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Slots are stored as "HH:MM" shop-local (IST) times.
const slotStartFor = (bookingDate, timeSlot) => {
  if (!timeSlot || !/^\d{2}:\d{2}$/.test(timeSlot)) return null;
  const start = new Date(`${dateKey(bookingDate)}T${timeSlot}:00+05:30`);
  return Number.isNaN(start.getTime()) ? null : start;
};

const getSettings = async () =>
  (await BusinessSettings.findOne()) || (await BusinessSettings.create({}));

const randomBookingCode = () => {
  let code = 'CW-';
  for (let i = 0; i < 4; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
};

const uniqueBookingCode = async () => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = randomBookingCode();
    const exists = await Booking.exists({ bookingCode: code });
    if (!exists) return code;
  }
  throw new AppError('Could not allocate a booking code, please try again', 503);
};

const populateBooking = (id) =>
  Booking.findById(id)
    .populate('vehicle', 'registrationNumber make model vehicleType color')
    .populate('service', 'name duration description')
    .populate('assignedStaff', 'employeeId')
    .populate('user', 'fullName mobile email');

// Adds a no-show strike and blocks the customer once they hit the limit.
const applyNoShowStrike = async (userId, settings) => {
  const user = await User.findById(userId);
  if (!user) return { user: null, noShowCount: 0, blockedUntil: null };

  user.noShowCount = (Number(user.noShowCount) || 0) + 1;

  const strikeLimit = Math.max(1, Number(settings.noShowStrikeLimit) || 2);
  let blockedUntil = null;

  if (user.noShowCount >= strikeLimit) {
    const blockDays = Math.max(1, Number(settings.noShowBlockDays) || 30);
    user.bookingBlockedUntil = new Date(Date.now() + blockDays * 24 * 60 * 60 * 1000);
    blockedUntil = user.bookingBlockedUntil;
  }

  await user.save();
  return { user, noShowCount: user.noShowCount, blockedUntil };
};

// Auto-release slots for customers who never showed up. This keeps prank or
// forgotten bookings from blocking the calendar.
const releaseExpiredBookings = async () => {
  const settings = await getSettings();
  const graceMs = Math.max(0, Number(settings.checkInGraceMinutes) || 0) * 60 * 1000;
  const cutoff = new Date(Date.now() - graceMs);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const expired = await Booking.find({
    status: bookingStatus.CONFIRMED,
    $or: [
      { slotStartAt: { $lte: cutoff } },
      // Legacy confirmed bookings that predate slotStartAt tracking.
      { slotStartAt: null, bookingDate: { $lt: startOfToday } },
    ],
  })
    .populate('vehicle', 'registrationNumber make model')
    .populate('service', 'name')
    .limit(50);

  for (const booking of expired) {
    // Legacy bookings are freed quietly; new bookings count as a no-show.
    const tracked = Boolean(booking.slotStartAt);
    let noShowCount = 0;
    let blockedUntil = null;

    if (tracked) {
      booking.status = bookingStatus.NO_SHOW;
      booking.noShowAt = new Date();
      booking.cancellationReason = 'Slot released — customer did not check in';
      const strike = await applyNoShowStrike(booking.user, settings);
      noShowCount = strike.noShowCount;
      blockedUntil = strike.blockedUntil;
    } else {
      booking.status = bookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      booking.cancellationReason = 'Slot released — vehicle was not checked in on time';
    }

    await booking.save();

    const body = tracked
      ? blockedUntil
        ? `Your ${booking.timeSlot} slot was released because you were not checked in. This is no-show ${noShowCount}. Booking is blocked until ${blockedUntil.toLocaleDateString('en-IN')}.`
        : `Your ${booking.timeSlot} slot was released because you were not checked in. Repeated no-shows will block your account from booking.`
      : `Your ${booking.timeSlot} slot was released because the vehicle was not checked in. Please book a new slot.`;

    await sendNotification(booking.user, tracked ? 'Booking Marked No-Show' : 'Booking Expired', body, {
      bookingId: booking._id.toString(),
      status: booking.status,
      reason: 'expired',
      noShowCount,
      blockedUntil: blockedUntil ? blockedUntil.toISOString() : null,
      vehicleReg: booking.vehicle?.registrationNumber || '',
      serviceName: booking.service?.name || '',
      date: booking.bookingDate,
      timeSlot: booking.timeSlot,
    });

    if (tracked) {
      await notifyAdmins(booking, bookingStatus.NO_SHOW, {
        bookingCode: booking.bookingCode,
        vehicleReg: booking.vehicle?.registrationNumber || '',
        serviceName: booking.service?.name || '',
        date: booking.bookingDate,
        timeSlot: booking.timeSlot,
        reason: 'expired',
      });
    }
  }

  return expired.length;
};

exports.releaseExpiredBookings = releaseExpiredBookings;

exports.getMyBookings = async (req, res, next) => {
  try {
    await releaseExpiredBookings();

    const { status, page = 1, limit = 50 } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('vehicle', 'registrationNumber make model vehicleType')
      .populate('service', 'name duration')
      .populate('assignedStaff')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'fullName email mobile')
      .populate('vehicle', 'registrationNumber make model vehicleType color')
      .populate('service', 'name description includedServices duration vehicleCategoryPricing')
      .populate('assignedStaff', 'employeeId');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'staff'
    ) {
      return next(new AppError('Not authorized to access this booking', 403));
    }

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
};

exports.verifyBookingByCode = async (req, res, next) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) {
      return next(new AppError('Booking code is required', 400));
    }

    const booking = await Booking.findOne({ bookingCode: code })
      .populate('user', 'fullName mobile email')
      .populate('vehicle', 'registrationNumber make model vehicleType')
      .populate('service', 'name duration');

    if (!booking) {
      return next(new AppError('No booking found for this code', 404));
    }

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const { vehicleId, serviceId, bookingDate, timeSlot, notes } = req.body;

    if (!vehicleId || !serviceId || !bookingDate || !timeSlot) {
      return next(new AppError('Vehicle, service, date and time slot are required', 400));
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id, isActive: true });
    if (!vehicle) {
      return next(new AppError('Vehicle not found or not authorized', 404));
    }

    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      return next(new AppError('Service not found or unavailable', 404));
    }

    const pricing = service.vehicleCategoryPricing.find((p) => p.vehicleType === vehicle.vehicleType);
    if (!pricing) {
      return next(new AppError(`No pricing configured for ${vehicle.vehicleType}`, 400));
    }

    if (req.user.bookingBlockedUntil && new Date(req.user.bookingBlockedUntil) > new Date()) {
      const until = new Date(req.user.bookingBlockedUntil).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const reason = req.user.bookingBlockReason ? ` Reason: ${req.user.bookingBlockReason}.` : '';
      return next(
        new AppError(
          `Your account is temporarily blocked from booking. You can book again after ${until}.${reason}`,
          403
        )
      );
    }

    const settings = await getSettings();
    const slotDate = parseDateOnly(bookingDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (slotDate < today) {
      return next(new AppError('Cannot book for a past date', 400));
    }

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    if (slotDate > maxDate) {
      return next(new AppError('Cannot book more than 30 days in advance', 400));
    }

    if (!/^\d{2}:\d{2}$/.test(timeSlot)) {
      return next(new AppError('Invalid time slot', 400));
    }

    const slotStartAt = slotStartFor(slotDate, timeSlot);
    if (!slotStartAt) {
      return next(new AppError('Invalid time slot', 400));
    }
    if (slotStartAt.getTime() <= Date.now()) {
      return next(new AppError('This time slot has already started. Please choose a later slot.', 400));
    }

    // Free any unclaimed slots before checking capacity / limits.
    await releaseExpiredBookings();

    // Anti-abuse: limit how many upcoming bookings one customer can hold.
    const maxActive = Math.max(1, Number(settings.maxActiveBookingsPerUser) || 1);
    const activeBookings = await Booking.find({
      user: req.user._id,
      status: { $in: ACTIVE_STATUSES },
    })
      .select('bookingCode timeSlot bookingDate')
      .sort({ bookingDate: 1 });

    if (activeBookings.length >= maxActive) {
      const current = activeBookings[0];
      const currentInfo = current?.bookingCode ? ` (${current.bookingCode})` : '';
      return next(
        new AppError(
          `You already have an active booking${currentInfo}. Please complete or cancel it before booking another slot.`,
          400
        )
      );
    }

    const existingBooking = await Booking.findOne({
      vehicle: vehicleId,
      bookingDate: slotDate,
      timeSlot,
      status: { $in: ACTIVE_STATUSES },
    });
    if (existingBooking) {
      return next(new AppError('You already have a booking for this vehicle at this time slot', 400));
    }

    const slotBookings = await Booking.countDocuments({
      bookingDate: slotDate,
      timeSlot,
      status: { $in: ACTIVE_STATUSES },
    });

    if (slotBookings >= settings.maxBookingsPerSlot) {
      return next(new AppError('This time slot is fully booked', 400));
    }

    const basePrice =
      pricing.offerPrice != null && pricing.offerPrice > 0 && pricing.offerPrice < pricing.price
        ? pricing.offerPrice
        : pricing.price;

    const bookingCode = await uniqueBookingCode();

    const booking = await Booking.create({
      user: req.user._id,
      vehicle: vehicleId,
      service: serviceId,
      bookingDate: slotDate,
      timeSlot,
      duration: service.duration,
      price: basePrice,
      finalPrice: basePrice,
      status: bookingStatus.CONFIRMED,
      slotStartAt,
      notes: notes || '',
      bookingCode,
    });

    const populatedBooking = await populateBooking(booking._id);

    const notifData = {
      bookingCode,
      customerName: populatedBooking.user?.fullName || '',
      customerPhone: populatedBooking.user?.mobile || '',
      vehicleReg: populatedBooking.vehicle?.registrationNumber || '',
      vehicleMake: populatedBooking.vehicle?.make || '',
      vehicleModel: populatedBooking.vehicle?.model || '',
      serviceName: populatedBooking.service?.name || '',
      price: basePrice,
      date: booking.bookingDate,
      timeSlot: booking.timeSlot,
    };

    await sendNotification(
      req.user._id,
      'Booking Confirmed',
      `Your slot is booked. Show code ${bookingCode} at the counter.`,
      { bookingId: booking._id.toString(), status: bookingStatus.CONFIRMED, ...notifData }
    );

    await notifyAdmins(populatedBooking, bookingStatus.CONFIRMED, notifData);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed',
      data: { booking: populatedBooking },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    const validTransitions = {
      [bookingStatus.CONFIRMED]: [bookingStatus.VEHICLE_RECEIVED, bookingStatus.CANCELLED],
      [bookingStatus.VEHICLE_RECEIVED]: [bookingStatus.WASHING, bookingStatus.CANCELLED],
      [bookingStatus.WASHING]: [bookingStatus.CLEANING],
      [bookingStatus.CLEANING]: [bookingStatus.READY],
      [bookingStatus.READY]: [bookingStatus.COMPLETED],
      [bookingStatus.COMPLETED]: [],
      [bookingStatus.CANCELLED]: [],
      [bookingStatus.NO_SHOW]: [],
    };

    if (req.user.role !== 'admin') {
      const allowedStaffStatuses = [
        bookingStatus.VEHICLE_RECEIVED,
        bookingStatus.WASHING,
        bookingStatus.CLEANING,
        bookingStatus.READY,
      ];
      if (!allowedStaffStatuses.includes(status)) {
        return next(new AppError('Staff can only update vehicle status', 403));
      }
    }

    if (booking.status === bookingStatus.COMPLETED || booking.status === bookingStatus.CANCELLED) {
      return next(new AppError('Cannot update a completed or cancelled booking', 400));
    }

    if (booking.status === bookingStatus.NO_SHOW) {
      return next(new AppError('Cannot update a no-show booking', 400));
    }

    const allowed = validTransitions[booking.status] || [];
    if (!allowed.includes(status)) {
      return next(new AppError(`Cannot change from ${booking.status} to ${status}`, 400));
    }

    booking.status = status;

    if (status === bookingStatus.VEHICLE_RECEIVED) {
      booking.checkedInAt = new Date();
    }

    if (status === bookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
    }

    await booking.save();

    const populatedForNotif = await Booking.findById(booking._id)
      .populate('vehicle', 'registrationNumber make model')
      .populate('service', 'name')
      .populate('user', 'fullName mobile');

    let extraData = {
      bookingCode: booking.bookingCode,
      customerName: populatedForNotif.user?.fullName || '',
      customerPhone: populatedForNotif.user?.mobile || '',
      vehicleReg: populatedForNotif.vehicle?.registrationNumber || '',
      vehicleMake: populatedForNotif.vehicle?.make || '',
      vehicleModel: populatedForNotif.vehicle?.model || '',
      serviceName: populatedForNotif.service?.name || '',
      date: booking.bookingDate,
      timeSlot: booking.timeSlot,
    };

    if (status === bookingStatus.CANCELLED) {
      extraData = { ...extraData, reason: req.body.reason || '' };
    }

    const notifData = getNotificationForStatus(status);
    if (notifData) {
      await sendNotification(
        booking.user,
        notifData.title,
        `${notifData.body} (${populatedForNotif.vehicle?.registrationNumber || ''})`,
        { bookingId: booking._id.toString(), status, ...extraData }
      );

      await notifyAdmins(populatedForNotif, status, extraData);
    }

    const updatedBooking = await populateBooking(booking._id);

    res.json({ success: true, data: { booking: updatedBooking } });
  } catch (error) {
    next(error);
  }
};

exports.markNoShow = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.status !== bookingStatus.CONFIRMED) {
      return next(new AppError('Only confirmed bookings can be marked as no-show', 400));
    }

    const settings = await getSettings();

    booking.status = bookingStatus.NO_SHOW;
    booking.noShowAt = new Date();
    booking.cancelledAt = new Date();
    booking.cancellationReason = 'Customer did not show up';
    await booking.save();

    const { user, noShowCount, blockedUntil } = await applyNoShowStrike(booking.user, settings);

    if (user) {
      const message = blockedUntil
        ? `You did not show up for your booking. Your account is blocked from booking until ${blockedUntil.toLocaleDateString('en-IN')}.`
        : 'You did not show up for your booking. Repeated no-shows will block your account from booking.';

      await sendNotification(user._id, 'Booking Marked No-Show', message, {
        bookingId: booking._id.toString(),
        status: bookingStatus.NO_SHOW,
        noShowCount,
        blockedUntil: blockedUntil ? blockedUntil.toISOString() : null,
      });
    }

    const populated = await populateBooking(booking._id);

    await notifyAdmins(populated, bookingStatus.NO_SHOW, {
      bookingCode: booking.bookingCode,
      customerName: populated.user?.fullName || '',
      customerPhone: populated.user?.mobile || '',
      vehicleReg: populated.vehicle?.registrationNumber || '',
      serviceName: populated.service?.name || '',
      date: booking.bookingDate,
      timeSlot: booking.timeSlot,
    });

    res.json({
      success: true,
      message: 'Booking marked as no-show',
      data: {
        booking: populated,
        noShowCount: noShowCount || 0,
        blockedUntil: blockedUntil || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCancelledBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this booking', 403));
    }

    if (booking.status !== bookingStatus.CANCELLED) {
      return next(new AppError('Only cancelled bookings can be deleted', 400));
    }

    await booking.deleteOne();

    res.json({ success: true, message: 'Booking removed' });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    if (
      booking.user.toString() !== req.user._id.toString() &&
      !['admin', 'staff'].includes(req.user.role)
    ) {
      return next(new AppError('Not authorized to cancel this booking', 403));
    }

    if (
      [bookingStatus.COMPLETED, bookingStatus.CANCELLED, bookingStatus.NO_SHOW].includes(
        booking.status
      )
    ) {
      return next(new AppError('Cannot cancel a completed, cancelled or no-show booking', 400));
    }

    // Customers may cancel only up to `minCancelHoursBeforeSlot` (default 2h)
    // before the slot starts; staff/admin are exempt for counter adjustments.
    const isCustomer = booking.user.toString() === req.user._id.toString() && req.user.role === 'customer';
    if (isCustomer) {
      const settings = await getSettings();
      const minHours = Math.max(0, Number(settings.minCancelHoursBeforeSlot) || 2);
      const slotStart = booking.slotStartAt || slotStartFor(booking.bookingDate, booking.timeSlot);
      if (slotStart && Date.now() > slotStart.getTime() - minHours * 60 * 60 * 1000) {
        return next(
          new AppError(
            `Bookings can be cancelled at least ${minHours} hours before the slot starts. Please call the shop to change your booking.`,
            400
          )
        );
      }
    }

    booking.status = bookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Cancelled by customer';

    await booking.save();

    const cancelledBooking = await Booking.findById(booking._id)
      .populate('vehicle', 'registrationNumber make model')
      .populate('service', 'name')
      .populate('user', 'fullName mobile');

    const cancelData = {
      bookingId: booking._id.toString(),
      bookingCode: booking.bookingCode,
      status: 'CANCELLED',
      customerName: cancelledBooking.user?.fullName || '',
      customerPhone: cancelledBooking.user?.mobile || '',
      vehicleReg: cancelledBooking.vehicle?.registrationNumber || '',
      vehicleMake: cancelledBooking.vehicle?.make || '',
      vehicleModel: cancelledBooking.vehicle?.model || '',
      serviceName: cancelledBooking.service?.name || '',
      date: booking.bookingDate,
      timeSlot: booking.timeSlot,
    };

    await sendNotification(
      booking.user,
      'Booking Cancelled',
      'Your booking has been cancelled.',
      cancelData
    );

    await notifyAdmins(cancelledBooking, 'CANCELLED', cancelData);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
