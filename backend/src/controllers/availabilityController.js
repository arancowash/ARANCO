const Booking = require('../models/Booking');
const BusinessSettings = require('../models/BusinessSettings');
const { bookingStatus } = require('../config/constants');
const { releaseExpiredBookings } = require('./bookingController');

const ACTIVE_STATUSES = [
  bookingStatus.CONFIRMED,
  bookingStatus.VEHICLE_RECEIVED,
  bookingStatus.WASHING,
  bookingStatus.CLEANING,
  bookingStatus.READY,
];

function generateTimeSlots(openingTime, closingTime, slotDuration) {
  const slots = [];
  const [openH, openM] = openingTime.split(':').map(Number);
  const [closeH, closeM] = closingTime.split(':').map(Number);

  let currentMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;

  while (currentMinutes + slotDuration <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push(slot);
    currentMinutes += slotDuration;
  }

  return slots;
}

exports.getAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required (YYYY-MM-DD)' });
    }

    const settings = await BusinessSettings.findOne() || await BusinessSettings.create({});

    // Free slots that were never claimed before counting capacity.
    await releaseExpiredBookings();

    const allSlots = generateTimeSlots(settings.openingTime, settings.closingTime, settings.slotDuration);

    const slotDate = (() => {
      const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    })();

    const nextDay = new Date(slotDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await Booking.find({
      bookingDate: { $gte: slotDate, $lt: nextDay },
      status: { $in: ACTIVE_STATUSES },
    });

    const slotCounts = {};
    bookings.forEach((b) => {
      slotCounts[b.timeSlot] = (slotCounts[b.timeSlot] || 0) + 1;
    });

    const now = Date.now();
    const availability = allSlots.map((slot) => {
      const booked = slotCounts[slot] || 0;
      const startsAt = new Date(`${date}T${slot}:00+05:30`);
      const isPast = !Number.isNaN(startsAt.getTime()) && startsAt.getTime() <= now;
      return {
        time: slot,
        available: booked < settings.maxBookingsPerSlot && !isPast,
        remaining: Math.max(0, settings.maxBookingsPerSlot - booked),
        total: settings.maxBookingsPerSlot,
        past: isPast,
      };
    });

    res.json({
      success: true,
      data: {
        date,
        slots: availability,
        settings: {
          openingTime: settings.openingTime,
          closingTime: settings.closingTime,
          slotDuration: settings.slotDuration,
          maxBookingsPerSlot: settings.maxBookingsPerSlot,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
