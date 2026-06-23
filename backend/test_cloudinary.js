require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testConnection() {
  console.log('Testing Cloudinary Connection...');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary Connection Successful:', result);
  } catch (error) {
    console.error('Cloudinary Connection Failed:');
    console.error(error);
  }
}

testConnection();
