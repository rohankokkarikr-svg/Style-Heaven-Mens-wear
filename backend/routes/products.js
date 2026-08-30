const express = require('express');
const router = express.Router();
const { protect, admin, artisan } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadDirect
} = require('../controllers/productController');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);

const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Cloudinary Multer Upload Error:', err);
      return res.status(400).json({ error: err.message || 'Cloudinary upload failed. Please try a different image.' });
    }
    next();
  });
};

// Product upload routes (Public so onboarding artisans can upload QR code & profile photo before login)
router.post('/upload', uploadMiddleware, uploadDirect);

// Admin + Artisan routes
router.post('/', protect, artisan, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, artisan, deleteProduct);
router.post('/:id/image', protect, artisan, uploadMiddleware, uploadProductImage);

module.exports = router;
