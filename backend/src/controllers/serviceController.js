const Service = require('../models/Service');
const { AppError } = require('../middleware/errorHandler');

const sanitizePricing = (vehicleCategoryPricing) => {
  if (!Array.isArray(vehicleCategoryPricing)) return vehicleCategoryPricing;
  return vehicleCategoryPricing.map((p) => {
    if (p.offerPrice != null && Number(p.offerPrice) >= Number(p.price)) {
      throw new AppError(`Offer price for ${p.vehicleType} must be less than the original price`, 400);
    }
    return p;
  });
};

exports.getServices = async (req, res, next) => {
  try {
    const query = {};
    if (!req.user || req.user.role !== 'admin') {
      query.isActive = true;
    }

    const services = await Service.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: { services, count: services.length } });
  } catch (error) {
    next(error);
  }
};

exports.getAllServicesAdmin = async (req, res, next) => {
  try {
    const services = await Service.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: { services, count: services.length } });
  } catch (error) {
    next(error);
  }
};

exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }
    res.json({ success: true, data: { service } });
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const { name, description, includedServices, image, duration, vehicleCategoryPricing } = req.body;

    const existing = await Service.findOne({ name });
    if (existing) {
      return next(new AppError('Service with this name already exists', 400));
    }

    const service = await Service.create({
      name,
      description,
      includedServices,
      image,
      duration,
      vehicleCategoryPricing: sanitizePricing(vehicleCategoryPricing),
    });

    res.status(201).json({ success: true, data: { service } });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    if (req.body.vehicleCategoryPricing) {
      req.body.vehicleCategoryPricing = sanitizePricing(req.body.vehicleCategoryPricing);
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: { service } });
  } catch (error) {
    next(error);
  }
};

exports.toggleServiceActive = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    service.isActive = !service.isActive;
    await service.save();

    res.json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    res.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
