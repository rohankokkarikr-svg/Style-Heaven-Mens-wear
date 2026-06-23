const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Pool of VERIFIED WORKING Unsplash photo IDs (confirmed 200 in audit)
// ─────────────────────────────────────────────────────────────────────────────
const VERIFIED = {
  'T-Shirts':    [
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800',
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
    'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800',
  ],
  'Shirts': [
    'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
    'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800',
    'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800',
    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800',
    'https://images.unsplash.com/photo-1563630423918-b58f07336ac9?w=800',
    'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800',
    'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=800',
    'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=800',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
  ],
  'Pants': [
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800',
    'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=800',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
    'https://images.unsplash.com/photo-1561365452-adb940139ffa?w=800',
    'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=800',
    'https://images.unsplash.com/photo-1553754538-466add009c05?w=800',
    'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=800',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
  ],
  'Jeans': [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
    'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800',
    'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800',
    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800',
    'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=800',
    'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800',
    'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800',
  ],
  'Jackets': [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800',
    'https://images.unsplash.com/photo-1592878940526-0214b0f374f6?w=800',
    'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800',
    'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800',
    'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
  ],
  'Suits': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800',
    'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
    'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800',
    'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800',
  ],
  'Kurtas': [
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800',
    'https://images.unsplash.com/photo-1607748851687-ba9a10438621?w=800',
    'https://images.unsplash.com/photo-1611601322175-ef8ec8c85f01?w=800',
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
    'https://images.unsplash.com/photo-1609234656388-0ff363383899?w=800',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
    'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=800',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
    'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800',
    'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
  ],
  'Accessories': [
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800',
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=800',
  ],
  'caps': [
    'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800',
    'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=800',
    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Exact broken product IDs from audit — with thematically best replacement
// ─────────────────────────────────────────────────────────────────────────────
const FIXES = [
  // ── T-Shirts ──
  { id: '1387e1e1-5c71-4937-9e72-7441cc18ffd5', name: 'Printed Oversized Drop-Shoulder Tee', category: 'T-Shirts', imgIdx: 0, key: 'fix_tshirt_oversized' },
  { id: '791936fe-474c-41dc-b74f-0f184235a16b', name: 'Earth Tone Patchwork Tee',            category: 'T-Shirts', imgIdx: 1, key: 'fix_tshirt_patchwork' },

  // ── Shirts ──
  { id: '700697cf-2698-4f4c-b640-27064464b88e', name: 'Houndstooth Pattern Formal Shirt',   category: 'Shirts', imgIdx: 0, key: 'fix_shirt_houndstooth' },
  { id: 'cfb0f7bf-64e8-44c3-80a8-53aa1c8672b6', name: 'Dark Navy Slim Formal Shirt',        category: 'Shirts', imgIdx: 1, key: 'fix_shirt_dark_navy' },
  { id: 'a8597fb5-8b1f-4b03-80b7-2e17c5032112', name: 'Floral Print Casual Shirt',          category: 'Shirts', imgIdx: 2, key: 'fix_shirt_floral' },
  { id: 'a3255956-4347-4843-a9a8-864af2bb1929', name: 'Black Linen Casual Shirt',           category: 'Shirts', imgIdx: 3, key: 'fix_shirt_black_linen' },
  { id: 'f78cd142-7542-4765-a4b2-74b8c8d0d5db', name: 'Forest Green Linen Shirt',           category: 'Shirts', imgIdx: 4, key: 'fix_shirt_forest_linen' },

  // ── Pants ──
  { id: 'dc4dc58a-6f67-4316-b20a-efd5124d7d1d', name: 'Grey Slim Formal Trousers',          category: 'Pants', imgIdx: 0, key: 'fix_pants_grey_formal' },
  { id: '100b9391-1e27-4f87-8fb7-71d937c9af09', name: 'Mint Green Chino Pants',             category: 'Pants', imgIdx: 4, key: 'fix_pants_mint_chino' },
  { id: 'c51963b8-0f1a-4d45-be59-96c036aee474', name: 'Athletic Sweatpants – Black',        category: 'Pants', imgIdx: 3, key: 'fix_pants_athletic' },
  { id: '91cf5094-982b-4dbb-b9cb-a5a68a66459c', name: 'Rust Orange Slim Chinos',            category: 'Pants', imgIdx: 5, key: 'fix_pants_rust_chino' },
  { id: '3472c58a-70ee-4a2d-b658-15b62c4faf09', name: 'Pleated High-Rise Trousers – Cream', category: 'Pants', imgIdx: 6, key: 'fix_pants_pleated_cream' },

  // ── Suits ──
  { id: '8d80b2a5-b5c6-41d5-aa8d-4155581fe3d2', name: 'Midnight Blue 3-Piece Suit',         category: 'Suits', imgIdx: 0, key: 'fix_suit_midnight_blue' },
  { id: '7684537c-feea-4dac-82a1-11470d47dbf8', name: 'Burgundy Velvet Blazer Suit',        category: 'Suits', imgIdx: 1, key: 'fix_suit_burgundy_velvet' },
  { id: 'b62b8871-3408-4994-bafe-698c17c4d877', name: 'Emerald Green Velvet Blazer Suit',   category: 'Suits', imgIdx: 2, key: 'fix_suit_emerald_velvet' },

  // ── Kurtas ──
  { id: '37a09e57-b482-4f0f-bce4-bcd770bece9f', name: 'Maroon Zari Embroidered Kurta',      category: 'Kurtas', imgIdx: 0, key: 'fix_kurta_maroon_zari' },
  { id: 'ca745d41-ffe8-498c-a058-a78af0135a35', name: 'Navy Blue A-Line Kurta',             category: 'Kurtas', imgIdx: 1, key: 'fix_kurta_navy_aline' },
  { id: 'dc0b9a7d-aac7-4464-960f-8d84516aca5a', name: 'Royal Blue Embroidered Sherwani',   category: 'Kurtas', imgIdx: 2, key: 'fix_kurta_royal_sherwani' },
  { id: '405aa84e-0fdf-485c-95a7-a081099b9ec5', name: 'Teal Mughal Print Kurta',            category: 'Kurtas', imgIdx: 3, key: 'fix_kurta_teal_mughal' },
  { id: 'af232299-6554-4652-a1fd-91617253a39e', name: 'Charcoal Grey Angrakha Kurta',       category: 'Kurtas', imgIdx: 4, key: 'fix_kurta_charcoal' },
  { id: '537ae517-08bf-4807-9eca-69eb43a83d16', name: 'Dusty Pink Mirror Work Kurta',       category: 'Kurtas', imgIdx: 5, key: 'fix_kurta_dusty_pink' },
  { id: 'ca46d27f-d1cc-4c1a-8480-398e61b1bdba', name: 'Grey Striped Kurta Pajama Set',      category: 'Kurtas', imgIdx: 6, key: 'fix_kurta_grey_striped' },
  { id: 'fb9ce989-b863-4465-ade8-704ecf55988d', name: 'Yellow Chanderi Silk Kurta',         category: 'Kurtas', imgIdx: 7, key: 'fix_kurta_yellow_chanderi' },
  { id: '0007a309-d6dd-4900-b081-1af0ce68931f', name: 'Peach Floral Embroidered Kurta',     category: 'Kurtas', imgIdx: 8, key: 'fix_kurta_peach_floral' },
  { id: '962ac249-909f-4a7a-9373-5ce2dd7f9137', name: 'Terracotta Ethnic Print Kurta',      category: 'Kurtas', imgIdx: 9, key: 'fix_kurta_terracotta' },
  { id: 'a612bb56-658f-47f3-9bee-8312ee8153cb', name: 'Olive Green Pathani Kurta Set',      category: 'Kurtas', imgIdx: 10, key: 'fix_kurta_olive_pathani' },

  // ── Missing image (caps) ──
  { id: '88fb2b4b-ceb1-4fe1-8571-23f01b9548a3', name: 'Monkey cup',                         category: 'caps', imgIdx: 0, key: 'fix_caps_monkey_cup' },
];

// ─────────────────────────────────────────────────────────────────────────────
async function uploadToCloudinary(imageUrl, publicId) {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder:         'style-heaven-products',
      public_id:      publicId,
      overwrite:      true,
      transformation: [{ width: 800, height: 1000, crop: 'limit', quality: 'auto' }],
    });
    return result.secure_url;
  } catch (err) {
    console.warn(`    ⚠️  Cloudinary upload failed: ${err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function fixImages() {
  console.log('🔧 Style Heaven — Image Fix Script');
  console.log(`🩹 Fixing ${FIXES.length} broken/missing product images\n`);

  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < FIXES.length; i++) {
    const fix = FIXES[i];
    const pool = VERIFIED[fix.category] || VERIFIED['Shirts'];
    const sourceUrl = pool[fix.imgIdx % pool.length];

    console.log(`[${i + 1}/${FIXES.length}] ${fix.name}`);
    console.log(`    Category: ${fix.category}`);
    console.log(`    Source:   ${sourceUrl}`);

    // Try uploading to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(sourceUrl, fix.key);

    // Use Cloudinary URL if successful, otherwise use the verified Unsplash URL directly
    const finalUrl = cloudinaryUrl || sourceUrl;

    if (cloudinaryUrl) {
      console.log(`    ✅ Uploaded to Cloudinary`);
    } else {
      console.log(`    ⚡ Using verified Unsplash URL as fallback`);
    }

    // Update Supabase
    const { error } = await supabase
      .from('products')
      .update({ image_url: finalUrl })
      .eq('id', fix.id);

    if (error) {
      console.log(`    ❌ DB update failed: ${error.message}`);
      failed++;
    } else {
      console.log(`    💾 DB updated successfully`);
      fixed++;
    }

    console.log('');
    await sleep(400);
  }

  console.log('══════════════════════════════════════════════');
  console.log('🎉 Image Fix Complete!');
  console.log(`  ✅ Fixed:  ${fixed} products`);
  if (failed > 0) console.log(`  ❌ Failed: ${failed} products`);
  console.log('══════════════════════════════════════════════');
}

fixImages().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
