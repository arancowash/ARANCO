const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const BusinessSettings = require('./models/BusinessSettings');
    await BusinessSettings.findOneAndUpdate(
      {},
      {},
      { upsert: true, setDefaultsOnInsert: true }
    );

    // One-time cleanup of pre-slot-only booking data.
    const Booking = require('./models/Booking');
    await Booking.updateMany(
      { status: 'PENDING_PAYMENT', bookingDate: { $gte: new Date() } },
      { $set: { status: 'CONFIRMED' } }
    );
    await Booking.updateMany(
      { status: 'PENDING_PAYMENT' },
      { $set: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: 'Legacy booking — payment system removed' } }
    );
    // strict/strictQuery must stay off: these paths no longer exist in the schemas,
    // and mongoose otherwise drops them from the filter and the $unset.
    const cleanup = await Booking.updateMany(
      {
        $or: [
          { paymentStatus: { $exists: true } },
          { promoCode: { $exists: true } },
          { discountPercent: { $exists: true } },
          { advanceAmount: { $exists: true } },
        ],
      },
      { $unset: { paymentStatus: 1, promoCode: 1, discountPercent: 1, advanceAmount: 1 } },
      { strict: false, strictQuery: false }
    );
    await Booking.updateMany(
      { finalPrice: { $in: [0, null] }, price: { $gt: 0 } },
      [{ $set: { finalPrice: '$price' } }]
    );

    const settingsCleanup = await BusinessSettings.updateMany(
      {
        $or: [
          { cancellationPolicy: { $exists: true } },
          { razorpayKeyId: { $exists: true } },
          { razorpayKeySecret: { $exists: true } },
        ],
      },
      { $unset: { cancellationPolicy: 1, razorpayKeyId: 1, razorpayKeySecret: 1 } },
      { strict: false, strictQuery: false }
    );

    if (cleanup.modifiedCount || settingsCleanup.modifiedCount) {
      console.log(`Removed payment data from ${cleanup.modifiedCount} booking(s) and ${settingsCleanup.modifiedCount} settings document(s).`);
    }

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Release slots that were booked but never claimed.
    const { releaseExpiredBookings } = require('./controllers/bookingController');
    const sweep = () => {
      releaseExpiredBookings().catch((err) =>
        console.error(`Slot release sweep failed: ${err.message}`)
      );
    };
    sweep();
    const interval = setInterval(sweep, 5 * 60 * 1000);
    if (interval.unref) interval.unref();
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

startServer();
