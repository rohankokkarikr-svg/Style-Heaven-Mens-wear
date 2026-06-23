require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const imagesToUpload = [
  '../frontend/public/hero_slide_1.png',
  '../frontend/public/hero_slide_2.png',
  '../frontend/public/hero_slide_3.png',
  '../frontend/public/hero_slide_4.png',
  '../frontend/public/review_rahul.png',
  '../frontend/public/review_arjun.png',
  '../frontend/public/review_vikram.png',
  '../frontend/public/review_karan.png',
  '../frontend/public/logo.png'
];

async function migrateImages() {
  const results = {};
  console.log('🚀 Starting image migration to Cloudinary...');

  for (const relPath of imagesToUpload) {
    const absPath = path.resolve(__dirname, relPath);
    if (fs.existsSync(absPath)) {
      try {
        const fileName = path.basename(absPath, path.extname(absPath));
        console.log(`Uploading ${fileName}...`);
        
        const result = await cloudinary.uploader.upload(absPath, {
          public_id: fileName,
          folder: 'style-heaven-assets',
          use_filename: true,
          unique_filename: false,
        });
        
        results[path.basename(absPath)] = result.secure_url;
        console.log(`✅ Uploaded: ${result.secure_url}`);
      } catch (error) {
        console.error(`❌ Failed to upload ${relPath}:`, error.message);
      }
    } else {
      console.warn(`⚠️ File not found: ${absPath}`);
    }
  }

  console.log('\n✨ Migration Complete! Copy these URLs:');
  console.log(JSON.stringify(results, null, 2));
  
  // Save results to a file for reference
  fs.writeFileSync(path.join(__dirname, 'cloudinary_migration.json'), JSON.stringify(results, null, 2));
}

migrateImages();
