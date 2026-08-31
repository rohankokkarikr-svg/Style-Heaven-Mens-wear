const express = require('express');
const router = express.Router();
const {
  analyzeProduct,
  generateDescription,
  generateFullCatalog,
  detectCategory,
  translateProduct,
  suggestPrice,
  generateArtisanStory,
  getAIInsights,
  smartSearch,
} = require('../controllers/aiController');

// All AI endpoints — called server-side only, key never exposed to client
router.post('/analyze-product',    analyzeProduct);
router.post('/generate-description', generateDescription);
router.post('/full-catalog',       generateFullCatalog);
router.post('/detect-category',    detectCategory);
router.post('/translate',          translateProduct);
router.post('/suggest-price',      suggestPrice);
router.post('/artisan-story',      generateArtisanStory);
router.post('/insights',           getAIInsights);
router.post('/smart-search',       smartSearch);

module.exports = router;
