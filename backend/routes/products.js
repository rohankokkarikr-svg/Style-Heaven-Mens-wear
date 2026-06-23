const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
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

// Admin routes
router.post('/upload', protect, admin, upload.single('image'), uploadDirect);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.post('/:id/image', protect, admin, upload.single('image'), uploadProductImage);

module.exports = router;
