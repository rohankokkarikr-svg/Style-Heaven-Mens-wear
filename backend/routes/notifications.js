const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All notification endpoints require authenticated user
router.get('/', protect, notificationController.getMyNotifications);
router.post('/send', protect, notificationController.sendMessage);
router.patch('/:id/read', protect, notificationController.markAsRead);
router.post('/read-all', protect, notificationController.markAllAsRead);
router.get('/recipients', protect, notificationController.getRecipients);

module.exports = router;
