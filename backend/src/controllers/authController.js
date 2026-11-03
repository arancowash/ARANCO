const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { roles } = require('../config/constants');

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, mobile, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return next(new AppError('User with this email or mobile already exists', 400));
    }

    const user = await User.create({
      fullName,
      email,
      mobile,
      password,
      role: roles.CUSTOMER,
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account is deactivated', 403));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, mobile, email } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (mobile) {
      const existing = await User.findOne({ mobile, _id: { $ne: req.user._id } });
      if (existing) return next(new AppError('Mobile number already in use', 400));
      updateData.mobile = mobile;
    }
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) return next(new AppError('Email already in use', 400));
      updateData.email = email;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
