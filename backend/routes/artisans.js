const express = require('express');
const router = express.Router();
const {
  getArtisans, getArtisanById, getMyProfile, updateMyProfile,
  getMyStats, getMyOrders, verifyArtisan, getAllArtisans
} = require('../controllers/artisanController');
const { updateOrderStatus, verifyPayment } = require('../controllers/orderController');
const { protect, admin, artisan, artisanOnly } = require('../middleware/auth');

// Public routes
router.get('/', getArtisans);
router.get('/admin/all', protect, admin, getAllArtisans);
router.get('/me', protect, artisan, getMyProfile);
router.get('/me/stats', protect, artisan, getMyStats);
router.get('/me/orders', protect, artisan, getMyOrders);
router.put('/me/orders/:id/status', protect, artisan, updateOrderStatus);
router.put('/orders/:id/status', protect, artisan, updateOrderStatus);
router.put('/orders/:id/verify-payment', protect, artisanOnly, verifyPayment);
router.put('/me/orders/:id/verify-payment', protect, artisanOnly, verifyPayment);
router.put('/me', protect, artisan, updateMyProfile);

router.patch('/:id/verify', protect, admin, verifyArtisan);
router.get('/:id', getArtisanById);

module.exports = router;
