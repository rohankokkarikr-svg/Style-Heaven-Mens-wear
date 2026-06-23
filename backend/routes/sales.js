const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { recordScanSale } = require('../controllers/salesController');

// All sales routes are admin only
router.post('/scan', protect, admin, recordScanSale);

module.exports = router;
