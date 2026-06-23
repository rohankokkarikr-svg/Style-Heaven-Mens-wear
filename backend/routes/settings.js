const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/auth');

// Public: anyone can read site settings (footer, contact, store name etc.)
router.get('/', getSettings);

// Admin only: update settings
router.put('/', protect, admin, updateSettings);

module.exports = router;
