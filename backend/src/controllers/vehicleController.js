const Vehicle = require('../models/Vehicle');
const { AppError } = require('../middleware/errorHandler');

const PLATE_REGEX = /^KL\d{2}[A-Z]{2}\d{4}$/;
const PLATE_FORMAT_MSG = 'Invalid registration number format. Expected KL07AB1234 (KL + 2 digits + 2 letters + 4 digits)';
const normalizePlate = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

exports.getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: { vehicles, count: vehicles.length } });
  } catch (error) {
    next(error);
  }
};

exports.addVehicle = async (req, res, next) => {
  try {
    const { registrationNumber, make, model, variant, vehicleType, fuelType, color, year } = req.body;

    const plate = normalizePlate(registrationNumber);
    if (!plate) {
      return next(new AppError('Registration number is required', 400));
    }
    if (!PLATE_REGEX.test(plate)) {
      return next(new AppError(PLATE_FORMAT_MSG, 400));
    }

    const existing = await Vehicle.findOne({
      registrationNumber: plate,
      user: req.user._id,
      isActive: true,
    });
    if (existing) {
      return next(new AppError('Vehicle with this registration number already exists', 400));
    }

    const vehicle = await Vehicle.create({
      user: req.user._id,
      registrationNumber: plate,
      make,
      model,
      variant,
      vehicleType,
      fuelType,
      color,
      year,
    });

    res.status(201).json({ success: true, data: { vehicle } });
  } catch (error) {
    next(error);
  }
};

exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (vehicle.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to access this vehicle', 403));
    }

    res.json({ success: true, data: { vehicle } });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (vehicle.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this vehicle', 403));
    }

    if (req.body.registrationNumber !== undefined) {
      const plate = normalizePlate(req.body.registrationNumber);
      if (!plate) {
        return next(new AppError('Registration number cannot be empty', 400));
      }
      if (!PLATE_REGEX.test(plate)) {
        return next(new AppError(PLATE_FORMAT_MSG, 400));
      }
      req.body.registrationNumber = plate;
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: { vehicle } });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (vehicle.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this vehicle', 403));
    }

    vehicle.isActive = false;
    await vehicle.save();

    res.json({ success: true, message: 'Vehicle removed successfully' });
  } catch (error) {
    next(error);
  }
};
