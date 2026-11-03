const User = require('../models/User');
const Notification = require('../models/Notification');

const statusMessages = {
  CONFIRMED: { title: 'Booking Confirmed', body: 'Your booking has been confirmed.' },
  VEHICLE_RECEIVED: { title: 'Vehicle Received', body: 'Your vehicle has been received at the wash center.' },
  WASHING: { title: 'Washing in Progress', body: 'Your vehicle is being washed now.' },
  CLEANING: { title: 'Cleaning in Progress', body: 'Your vehicle is being cleaned and detailed.' },
  READY: { title: 'Ready for Pickup', body: 'Your vehicle is ready! Please pick it up.' },
  COMPLETED: { title: 'Booking Complete', body: 'Your car wash is complete. Thank you!' },
  CANCELLED: { title: 'Booking Cancelled', body: 'Your booking has been cancelled.' },
  NO_SHOW: { title: 'Booking Marked No-Show', body: 'You did not arrive for your booking.' },
};

const adminStatusMessages = {
  CONFIRMED: 'Booking confirmed by customer.',
  VEHICLE_RECEIVED: 'Vehicle received at the center.',
  WASHING: 'Washing started.',
  CLEANING: 'Cleaning started.',
  READY: 'Vehicle ready for pickup.',
  COMPLETED: 'Booking completed.',
  CANCELLED: 'Booking cancelled.',
  NO_SHOW: 'Customer did not show up.',
};

async function sendNotification(userId, title, body, data = {}) {
  try {
    await Notification.create({ user: userId, title, body, data });

    const user = await User.findById(userId).select('pushToken');
    if (!user || !user.pushToken) return;

    const payload = {
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data,
      channelId: 'default',
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Notification error:', error.message);
  }
}

async function notifyAdmins(booking, status, extraData = {}) {
  try {
    const targets = await User.find({ role: { $in: ['admin', 'staff'] } }).select('_id');
    if (targets.length === 0) {
      console.log('No admin/staff users found for notifications');
      return;
    }
    const vehicleReg = booking.vehicle?.registrationNumber || '';
    const serviceName = booking.service?.name || '';
    const body = `${adminStatusMessages[status] || status} Vehicle: ${vehicleReg} | Service: ${serviceName}`;

    for (const target of targets) {
      await Notification.create({
        user: target._id,
        title: `Booking ${status.replace(/_/g, ' ')}`,
        body,
        data: { bookingId: booking._id?.toString(), status, type: 'admin', ...extraData },
      });
    }
    console.log(`Created ${targets.length} admin/staff notification(s) for ${status}`);
  } catch (error) {
    console.error('Admin notification error:', error.message);
  }
}

function getNotificationForStatus(status) {
  return statusMessages[status] || null;
}

module.exports = { sendNotification, notifyAdmins, getNotificationForStatus };
