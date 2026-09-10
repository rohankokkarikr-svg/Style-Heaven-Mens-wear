const express = require('express');
const router = express.Router();
const { protect, admin, artisan, artisanOnly, artisanOrAdmin } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  cancelOrder,
  updateOrderDetails,
  getAllOrders,
  updateOrderStatus,
  payOrder,
  verifyPayment,
  getOrderById
} = require('../controllers/orderController');

// User routes
router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/edit', protect, updateOrderDetails);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/pay', protect, payOrder);

// Admin & Artisan routes
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, artisanOrAdmin, updateOrderStatus);
router.put('/:id/verify-payment', protect, artisanOnly, verifyPayment);

module.exports = router;
