const express = require('express');
const router = express.Router();
const { getMyVehicles, addVehicle, getVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMyVehicles);
router.post('/', addVehicle);
router.get('/:id', getVehicle);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;
