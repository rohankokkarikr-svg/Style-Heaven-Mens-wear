const express = require('express');
const router = express.Router();
const { analyzeProduct, generateDescription } = require('../controllers/aiController');

// Public AI Studio endpoints for instant generation without auth blockers
router.post('/analyze-product', analyzeProduct);
router.post('/generate-description', generateDescription);

module.exports = router;
