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

// Admin + Artisan routes
router.post('/upload', protect, artisan, upload.single('image'), uploadDirect);
router.post('/', protect, artisan, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, artisan, deleteProduct);
router.post('/:id/image', protect, artisan, upload.single('image'), uploadProductImage);

module.exports = router;
