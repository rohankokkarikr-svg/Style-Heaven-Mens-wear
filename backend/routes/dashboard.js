const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

// Dashboard routes are admin only
router.get('/stats', protect, admin, getDashboardStats);

module.exports = router;
