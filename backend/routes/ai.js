const express = require('express');
const router = express.Router();
const { analyzeProduct, generateDescription } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/analyze-product', protect, analyzeProduct);
router.post('/generate-description', protect, generateDescription);

module.exports = router;
