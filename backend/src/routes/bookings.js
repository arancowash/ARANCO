const express = require('express');
const router = express.Router();
const {
  getMyBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  deleteCancelledBooking,
  markNoShow,
  verifyBookingByCode,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.get('/', getMyBookings);
router.post('/', bookingLimiter, createBooking);
router.get('/verify/:code', authorize('admin', 'staff'), verifyBookingByCode);
router.get('/:id', getBooking);
router.patch('/:id/status', authorize('admin', 'staff'), updateBookingStatus);
router.patch('/:id/no-show', authorize('admin', 'staff'), markNoShow);
router.patch('/:id/cancel', cancelBooking);
router.delete('/:id', deleteCancelledBooking);

module.exports = router;
