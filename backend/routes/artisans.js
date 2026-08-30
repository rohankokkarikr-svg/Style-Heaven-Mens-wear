const express = require('express');
const router = express.Router();
const {
  getArtisans, getArtisanById, getMyProfile, updateMyProfile,
  getMyStats, verifyArtisan, getAllArtisans
} = require('../controllers/artisanController');
const { protect, admin, artisan } = require('../middleware/auth');

// Public routes
router.get('/', getArtisans);
router.get('/admin/all', protect, admin, getAllArtisans);
router.get('/me', protect, artisan, getMyProfile);
router.get('/me/stats', protect, artisan, getMyStats);
router.put('/me', protect, artisan, updateMyProfile);
router.patch('/:id/verify', protect, admin, verifyArtisan);
router.get('/:id', getArtisanById);

module.exports = router;
