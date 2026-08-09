const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
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

// Admin routes
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/verify-payment', protect, admin, verifyPayment);

module.exports = router;
