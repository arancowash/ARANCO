const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getCustomers,
  getAllBookings,
  getBookingCountsByDate,
  getStaff,
  assignStaff,
  updateBusinessSettings,
  getBusinessSettings,
  getVehiclesWithBookings,
  blockCustomer,
  unblockCustomer,
} = require('../controllers/adminController');
const { getAllServicesAdmin } = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/bookings', authorize('admin', 'staff'), getAllBookings);
router.get('/bookings/count-by-date', authorize('admin', 'staff'), getBookingCountsByDate);
router.get('/vehicles', authorize('admin', 'staff'), getVehiclesWithBookings);

router.use(authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/customers', getCustomers);
router.post('/customers/:id/block', blockCustomer);
router.post('/customers/:id/unblock', unblockCustomer);
router.get('/staff', getStaff);
router.post('/assign-staff', assignStaff);
router.put('/settings', updateBusinessSettings);
router.get('/settings', getBusinessSettings);
router.get('/services', getAllServicesAdmin);

module.exports = router;
