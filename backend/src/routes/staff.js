const express = require('express');
const router = express.Router();
const { createStaff, updateStaff, disableStaff, getStaffBookings } = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('admin'), createStaff);
router.put('/:id', authorize('admin'), updateStaff);
router.patch('/:id/disable', authorize('admin'), disableStaff);
router.get('/my-bookings', authorize('staff'), getStaffBookings);

module.exports = router;
