const cloudinary = require('cloudinary');
const CloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kalastyle-artisan-marketplace',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'jfif', 'gif', 'svg']
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

module.exports = { cloudinary: cloudinary.v2, upload };
