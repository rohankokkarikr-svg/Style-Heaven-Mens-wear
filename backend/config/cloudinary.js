const cloudinary = require('cloudinary');
const multer = require('multer');

const CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || 'dcmmxmikz').trim();
const API_KEY = (process.env.CLOUDINARY_API_KEY || '149393542854794').trim();
const API_SECRET = (process.env.CLOUDINARY_API_SECRET || '_CBARObUZS9wuKFB3zi1Kuzb58k').trim();

cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true
});

// Use memoryStorage to avoid legacy multer-storage-cloudinary signature calculation issues
const storage = multer.memoryStorage();

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


