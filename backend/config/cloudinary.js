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
    resource_type: 'auto'
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const isImageMime = file.mimetype && (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream');
    const isImageExt = /\.(jpe?g|png|webp|gif|svg|heic|heif|avif)$/i.test(file.originalname || '');
    if (isImageMime || isImageExt) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, HEIC, etc.) are allowed'), false);
    }
  }
});

module.exports = { cloudinary: cloudinary.v2, upload };

