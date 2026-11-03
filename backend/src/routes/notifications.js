const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markOneAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getNotifications);
router.patch('/read', markAsRead);
router.patch('/:id/read', markOneAsRead);

module.exports = router;
