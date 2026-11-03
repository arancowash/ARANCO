const express = require('express');
const router = express.Router();
const { getServices, getService, createService, updateService, deleteService, toggleServiceActive } = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getServices);
router.get('/:id', getService);
router.post('/', protect, authorize('admin'), createService);
router.put('/:id', protect, authorize('admin'), updateService);
router.patch('/:id/disable', protect, authorize('admin'), toggleServiceActive);
router.delete('/:id', protect, authorize('admin'), deleteService);

module.exports = router;
