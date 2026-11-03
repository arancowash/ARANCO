const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

router.post('/push-token', protect, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Push token is required' });
    }
    await User.findByIdAndUpdate(req.user._id, { pushToken: token });
    res.json({ success: true, message: 'Push token saved' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
