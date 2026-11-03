const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { roles } = require('../config/constants');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found or inactive' });
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this action' });
    }
    next();
  };
};

const isOwnerOrAdmin = (req, res, next) => {
  if (req.user.role === roles.ADMIN) return next();
  if (req.params.id && req.params.id.toString() === req.user._id.toString()) return next();
  return res.status(403).json({ success: false, message: 'Not authorized to access this resource' });
};

module.exports = { protect, authorize, isOwnerOrAdmin };
