const express = require('express');
const router = express.Router();
const { analyzeProduct, generateDescription } = require('../controllers/aiController');
const { protect, artisan } = require('../middleware/auth');

router.post('/analyze-product', protect, artisan, analyzeProduct);
router.post('/generate-description', protect, artisan, generateDescription);

module.exports = router;
