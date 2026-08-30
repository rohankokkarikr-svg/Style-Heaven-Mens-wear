const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedKala() {
  console.log('🚀 Starting KalaStyle AI demo data refresh...');

  // 1. Delete all existing products
  console.log('🗑️  Deleting all existing products...');
  
  // First clear order_items and sales if any exist to maintain clean state
  try {
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (err) {
    console.log('Note on clearing dependent tables:', err.message);
  }

  const { error: delError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delError) {
    console.error('❌ Error clearing products:', delError);
    return;
  }
  console.log('✅ Cleared all products successfully.');

  // 2. Ensure or seed Artisan profiles
  console.log('👩‍🎨 Checking/creating Artisan Profiles...');
  
  // Find or create artisan users
  const artisanUsers = [
    { email: 'ramesh.kutch@kalastyle.ai', name: 'Rameshwar Vankar', role: 'artisan', store_name: 'Kutch Kala Weaves', specialization: 'Organic Kala Cotton & Ajrakh', location: 'Bhuj, Gujarat', bio: 'Fifth-generation master weaver preserving rain-fed indigenous organic Kala cotton traditions of Kutch.', profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop' },
    { email: 'shamim.lucknow@kalastyle.ai', name: 'Shamim Begum', role: 'artisan', store_name: 'Awadh Chikankari Guild', specialization: 'Lucknowi Chikankari & Mukaish', location: 'Lucknow, Uttar Pradesh', bio: 'National award-winning artisan empowering over 200 women through fine needlecraft and shadow work.', profile_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop' },
    { email: 'anand.banaras@kalastyle.ai', name: 'Anand Kumar Mishra', role: 'artisan', store_name: 'Kashi Heritage Looms', specialization: 'Pure Banarasi Katan Silk & Brocade', location: 'Varanasi, Uttar Pradesh', bio: 'Master handloom artisan weaving traditional silver and gold zari motifs on pure mulberry katan silk.', profile_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop' },
    { email: 'surya.odisha@kalastyle.ai', name: 'Surya Narayana', role: 'artisan', store_name: 'Utkal Dokra & Ikat Crafts', specialization: 'Lost-Wax Dokra Brass & Handloom Ikat', location: 'Bhubaneswar, Odisha', bio: 'Tribal metal-smith and master weaver preserving 4000-year-old lost wax casting and double-ikat techniques.', profile_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop' }
  ];

  const createdArtisanMap = {};

  for (const art of artisanUsers) {
    // Check if user exists
    let { data: existingUser } = await supabase.from('users').select('id').eq('email', art.email).maybeSingle();
    let userId = existingUser?.id;

    if (!userId) {
      const { data: newUser, error: uErr } = await supabase.from('users').insert([{
        name: art.name,
        email: art.email,
        password: '$2a$10$demoHashedPasswordDummyForDemo1234567890',
        role: 'artisan'
      }]).select().single();

      if (!uErr && newUser) {
        userId = newUser.id;
      }
    }

    if (userId) {
      // Check artisan profile
      let { data: existingProf } = await supabase.from('artisan_profiles').select('id').eq('user_id', userId).maybeSingle();
      if (!existingProf) {
        const { data: newProf, error: pErr } = await supabase.from('artisan_profiles').insert([{
          user_id: userId,
          store_name: art.store_name,
          artisan_type: 'Master Craftsman',
          specialization: art.specialization,
          location: art.location,
          bio: art.bio,
          profile_image: art.profile_image,
          verification_status: 'verified',
          preferred_language: 'Hindi / English',
          earnings_total: 84500.00
        }]).select().single();

        if (newProf) createdArtisanMap[art.store_name] = newProf.id;
      } else {
        createdArtisanMap[art.store_name] = existingProf.id;
      }
    }
  }

  console.log('✅ Artisan profiles configured:', createdArtisanMap);

  const kutchId = createdArtisanMap['Kutch Kala Weaves'] || null;
  const lucknowId = createdArtisanMap['Awadh Chikankari Guild'] || null;
  const banarasId = createdArtisanMap['Kashi Heritage Looms'] || null;
  const utkalId = createdArtisanMap['Utkal Dokra & Ikat Crafts'] || null;

  // 3. Kala Products Seed Data
  const kalaProducts = [
    // ════ SAREES ════
    {
      name: 'Kutch Kala Cotton Handwoven Indigo Saree',
      description: 'Handcrafted from 100% indigenous organic Kala cotton grown and hand-spun in Kutch, Gujarat. Naturally dyed with indigo and adorned with traditional Kutchi extra-weft geometric borders.',
      price: 4899,
      original_price: 6999,
      category: 'Sarees',
      subcategory: 'Kala Cotton Sarees',
      sizes: ['Standard (6.3m with Blouse)'],
      image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop',
      barcode: 'KALA-SAR-001',
      stock_quantity: 18,
      is_in_stock: true,
      artisan_id: kutchId,
      is_handmade: true,
      material: 'Organic Kala Cotton',
      style: 'Traditional Handloom',
      ai_generated: false,
      ai_suggested_price: 4999,
      tags: ['Kala Cotton', 'Organic', 'Handloom', 'Indigo', 'Kutch']
    },
    {
      name: 'Banarasi Katan Pure Silk Zari Saree – Crimson Royal',
      description: 'An opulent crimson Banarasi saree woven on traditional pit-looms in Varanasi. Features intricate floral jaal motifs woven with pure gold and silver kadwa zari work.',
      price: 8499,
      original_price: 12999,
      category: 'Sarees',
      subcategory: 'Banarasi Silk',
      sizes: ['Standard (6.3m with Blouse)'],
      image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop',
      barcode: 'KALA-SAR-002',
      stock_quantity: 12,
      is_in_stock: true,
      artisan_id: banarasId,
      is_handmade: true,
      material: 'Pure Mulberry Katan Silk',
      style: 'Royal Banarasi',
      ai_generated: false,
      ai_suggested_price: 8999,
      tags: ['Banarasi', 'Silk', 'Zari', 'Wedding', 'Heritage']
    },
    {
      name: 'Chanderi Handloom Tissue Silk Saree with Meenakari',
      description: 'Featherlight Chanderi saree shimmering with tissue silk and subtle Meenakari zari detailing along the pallu and border. Woven by generational weavers in Madhya Pradesh.',
      price: 5299,
      original_price: 7499,
      category: 'Sarees',
      subcategory: 'Chanderi',
      sizes: ['Standard (6.3m with Blouse)'],
      image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop',
      barcode: 'KALA-SAR-003',
      stock_quantity: 24,
      is_in_stock: true,
      artisan_id: banarasId,
      is_handmade: true,
      material: 'Chanderi Silk Cotton',
      style: 'Festive Handloom',
      ai_generated: false,
      ai_suggested_price: 5499,
      tags: ['Chanderi', 'Handloom', 'Silk', 'Festive']
    },
    {
      name: 'Ajrakh Natural Dye Block Printed Mulmul Saree',
      description: 'Authentic 14-stage resist-printed Ajrakh saree made using natural madder, indigo, and pomegranate peel dyes on butter-soft mulmul cotton fabric.',
      price: 3699,
      original_price: 5199,
      category: 'Sarees',
      subcategory: 'Block Print',
      sizes: ['Standard (6.3m with Blouse)'],
      image_url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop',
      barcode: 'KALA-SAR-004',
      stock_quantity: 30,
      is_in_stock: true,
      artisan_id: kutchId,
      is_handmade: true,
      material: 'Mulmul Cotton & Natural Dyes',
      style: 'Ajrakh Block Print',
      ai_generated: false,
      ai_suggested_price: 3799,
      tags: ['Ajrakh', 'Natural Dye', 'Hand Block Print', 'Cotton']
    },
    {
      name: 'Sambalpuri Double-Ikat Handwoven Silk Saree',
      description: 'Exquisite Bandha (double ikat) handwoven silk saree featuring traditional Shankha, Chakra, and floral motifs crafted over 45 days on pit looms in Odisha.',
      price: 7299,
      original_price: 9999,
      category: 'Sarees',
      subcategory: 'Ikat Sarees',
      sizes: ['Standard (6.3m with Blouse)'],
      image_url: 'https://images.unsplash.com/photo-1610030469858-a54817a02c89?w=900&auto=format&fit=crop',
      barcode: 'KALA-SAR-005',
      stock_quantity: 15,
      is_in_stock: true,
      artisan_id: utkalId,
      is_handmade: true,
      material: 'Handloom Tussar Silk',
      style: 'Double Ikat',
      ai_generated: false,
      ai_suggested_price: 7499,
      tags: ['Sambalpuri', 'Ikat', 'Handloom', 'Silk']
    },

    // ════ KURTAS ════
    {
      name: 'Lucknowi Chikankari Hand-Embroidered Pure Cotton Kurta',
      description: 'Timeless white Lucknowi Chikankari long kurta featuring intricate Bakhiya, Phanda, and Keel Kangan stitches. Breathable handspun cotton designed for regal elegance.',
      price: 2499,
      original_price: 3999,
      category: 'Kurtas',
      subcategory: 'Chikankari Kurtas',
      sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
      image_url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&auto=format&fit=crop',
      barcode: 'KALA-KUR-001',
      stock_quantity: 45,
      is_in_stock: true,
      artisan_id: lucknowId,
      is_handmade: true,
      material: 'Pure Handspun Cotton',
      style: 'Chikankari',
      ai_generated: false,
      ai_suggested_price: 2599,
      tags: ['Chikankari', 'Hand Embroidered', 'Lucknow', 'Kurta']
    },
    {
      name: 'Organic Kutch Kala Cotton Short Kurta – Earth Ochre',
      description: 'Handwoven short kurta crafted from 100% organic, carbon-neutral rain-fed Kala cotton. Naturally dyed with harda and iron rust for rich earthy ochre tones with wooden buttons.',
      price: 1999,
      original_price: 2999,
      category: 'Kurtas',
      subcategory: 'Kala Cotton Kurtas',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop',
      barcode: 'KALA-KUR-002',
      stock_quantity: 35,
      is_in_stock: true,
      artisan_id: kutchId,
      is_handmade: true,
      material: 'Organic Kala Cotton',
      style: 'Contemporary Ethnic',
      ai_generated: false,
      ai_suggested_price: 2199,
      tags: ['Kala Cotton', 'Organic', 'Short Kurta', 'Sustainable']
    },
    {
      name: 'Ajrakh Block-Print Modal Silk Festive Kurta Set',
      description: 'Rich jewel-toned modal silk kurta with authentic geometric Ajrakh hand-block printing. Comes paired with tailored off-white cotton churidar bottoms.',
      price: 3499,
      original_price: 4999,
      category: 'Kurtas',
      subcategory: 'Kurta Sets',
      sizes: ['M', 'L', 'XL', 'XXL'],
      image_url: 'https://images.unsplash.com/photo-1618886614638-80e3c153d31a?w=900&auto=format&fit=crop',
      barcode: 'KALA-KUR-003',
      stock_quantity: 28,
      is_in_stock: true,
      artisan_id: kutchId,
      is_handmade: true,
      material: 'Modal Silk & Pure Cotton',
      style: 'Festive Kurta Set',
      ai_generated: false,
      ai_suggested_price: 3599,
      tags: ['Ajrakh', 'Kurta Set', 'Festive', 'Modal Silk']
    },
    {
      name: 'Handspun Khadi Raw Cotton Pathani Kurta with Pintucks',
      description: 'Crisp military green Pathani kurta handcrafted in handspun khadi cotton. Features front flap pockets, shoulder epaulets, and structured pintuck detailing.',
      price: 2299,
      original_price: 3499,
      category: 'Kurtas',
      subcategory: 'Pathani Kurtas',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop',
      barcode: 'KALA-KUR-004',
      stock_quantity: 50,
      is_in_stock: true,
      artisan_id: lucknowId,
      is_handmade: true,
      material: 'Handspun Khadi Cotton',
      style: 'Pathani Style',
      ai_generated: false,
      ai_suggested_price: 2399,
      tags: ['Khadi', 'Pathani', 'Handspun', 'Men Kurta']
    },
    {
      name: 'Kashmiri Aari Embroidered Silk Blend Long Kurta',
      description: 'Regal navy blue kurta featuring hand-hooked Kashmiri Aari needlework across the yoke and cuffs. Smooth silk blend with high side slits for comfortable movement.',
      price: 3199,
      original_price: 4599,
      category: 'Kurtas',
      subcategory: 'Embroidered Kurtas',
      sizes: ['M', 'L', 'XL', 'XXL'],
      image_url: 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=900&auto=format&fit=crop',
      barcode: 'KALA-KUR-005',
      stock_quantity: 22,
      is_in_stock: true,
      artisan_id: lucknowId,
      is_handmade: true,
      material: 'Silk Cotton Blend',
      style: 'Kashmiri Aari',
      ai_generated: false,
      ai_suggested_price: 3299,
      tags: ['Kashmiri', 'Aari Work', 'Embroidery', 'Kurta']
    },

    // ════ HANDLOOM ════
    {
      name: 'Kutch Kala Handloom Textured Fabric Jacket',
      description: 'Structured open-front artisan waistcoat woven on heritage wooden looms with unbleached organic Kala cotton. Styled with coconut-shell button accents.',
      price: 2899,
      original_price: 4299,
      category: 'Handloom',
      subcategory: 'Waistcoats & Jackets',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&auto=format&fit=crop',
      barcode: 'KALA-HLM-001',
      stock_quantity: 20,
      is_in_stock: true,
      artisan_id: kutchId,
      is_handmade: true,
      material: '100% Handloom Kala Cotton',
      style: 'Handloom Tailoring',
      ai_generated: false,
      ai_suggested_price: 2999,
      tags: ['Handloom', 'Kala Cotton', 'Jacket', 'Sustainable']
    },
    {
      name: 'Ikat Handloom Pure Cotton Mandarin Collar Shirt',
      description: 'Modern relaxed-fit casual shirt woven in double-ikat geometric checks. Dyed with natural tree bark and indigo extracts for everyday sophistication.',
      price: 1899,
      original_price: 2799,
      category: 'Handloom',
      subcategory: 'Handloom Shirts',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop',
      barcode: 'KALA-HLM-002',
      stock_quantity: 40,
      is_in_stock: true,
      artisan_id: utkalId,
      is_handmade: true,
      material: 'Handloom Ikat Cotton',
      style: 'Contemporary Handloom',
      ai_generated: false,
      ai_suggested_price: 1999,
      tags: ['Handloom', 'Ikat', 'Shirt', 'Cotton']
    },
    {
      name: 'Bhagalpuri Handwoven Tussar Silk Stole',
      description: 'Golden sheen wild Tussar silk stole featuring hand-twisted tassels and subtle horizontal ribbed weave created by master handloom weavers in Bihar.',
      price: 1799,
      original_price: 2499,
      category: 'Handloom',
      subcategory: 'Stoles & Shawls',
      sizes: ['Free Size (2m x 0.7m)'],
      image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop',
      barcode: 'KALA-HLM-003',
      stock_quantity: 35,
      is_in_stock: true,
      artisan_id: banarasId,
      is_handmade: true,
      material: 'Pure Tussar Wild Silk',
      style: 'Artisan Weave',
      ai_generated: false,
      ai_suggested_price: 1899,
      tags: ['Handloom', 'Tussar Silk', 'Stole', 'Accessories']
    },
    {
      name: 'Pochampally Handwoven Cotton Casual Trousers',
      description: 'Comfortable relaxed-fit drawstring trousers tailored from breathable Pochampally handloom cotton weave with deep utility pockets.',
      price: 2199,
      original_price: 3199,
      category: 'Handloom',
      subcategory: 'Trousers',
      sizes: ['30', '32', '34', '36', '38'],
      image_url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=900&auto=format&fit=crop',
      barcode: 'KALA-HLM-004',
      stock_quantity: 30,
      is_in_stock: true,
      artisan_id: utkalId,
      is_handmade: true,
      material: 'Handloom Cotton',
      style: 'Relaxed Tailoring',
      ai_generated: false,
      ai_suggested_price: 2299,
      tags: ['Handloom', 'Trousers', 'Cotton', 'Casual']
    },

    // ════ HANDMADE & CRAFT ════
    {
      name: 'Dokra Handcrafted Brass Tribal Cuff & Button Set',
      description: 'Ancient 4,000-year-old lost-wax cast Dokra brass cuff bracelet and matching kurta buttons, handcrafted individually by tribal artisans of Odisha.',
      price: 1499,
      original_price: 2299,
      category: 'Handmade',
      subcategory: 'Dokra Metalcraft',
      sizes: ['Adjustable Free Size'],
      image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&auto=format&fit=crop',
      barcode: 'KALA-HND-001',
      stock_quantity: 25,
      is_in_stock: true,
      artisan_id: utkalId,
      is_handmade: true,
      material: 'Lost-Wax Cast Dokra Brass',
      style: 'Tribal Heritage',
      ai_generated: false,
      ai_suggested_price: 1599,
      tags: ['Dokra', 'Handmade', 'Brass', 'Tribal', 'Artisan']
    },
    {
      name: 'Handcrafted Genuine Leather Mojaris with Zardozi Work',
      description: 'Traditional royal juttis handcrafted in supple vegetable-tanned leather and embroidered with intricate gold zari wire and velvet lining.',
      price: 2799,
      original_price: 3999,
      category: 'Handmade',
      subcategory: 'Footwear',
      sizes: ['7', '8', '9', '10', '11'],
      image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=900&auto=format&fit=crop',
      barcode: 'KALA-HND-002',
      stock_quantity: 20,
      is_in_stock: true,
      artisan_id: lucknowId,
      is_handmade: true,
      material: 'Vegetable Tanned Leather & Zardozi',
      style: 'Royal Footwear',
      ai_generated: false,
      ai_suggested_price: 2899,
      tags: ['Mojaris', 'Leather', 'Zardozi', 'Handmade', 'Shoes']
    },
    {
      name: 'Kutch Hand-Embroidered Rabari Mirror-Work Jacket',
      description: 'Vibrant celebratory vest adorned with authentic Rabari mirror-work embroidery and multi-color thread stitches made by women artisans in rural Gujarat.',
      price: 3299,
      original_price: 4799,
      category: 'Handmade',
      subcategory: 'Artisan Apparel',
      sizes: ['S', 'M', 'L', 'XL'],
      image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=900&auto=format&fit=crop',
      barcode: 'KALA-HND-003',
      stock_quantity: 16,
      is_in_stock: true,
      artisan_id: kutchId,
      is_handmade: true,
      material: 'Cotton & Mirror Embellishments',
      style: 'Folk Artisan',
      ai_generated: false,
      ai_suggested_price: 3399,
      tags: ['Mirror Work', 'Kutch', 'Handmade', 'Embroidery']
    },

    // ════ MEN'S FASHION ════
    {
      name: 'Royal Heritage Raw Silk Nehru Jacket – Emerald Gold',
      description: 'Sophisticated mandarin collar Nehru jacket tailored from pure raw dupion silk. Accented with brass filigree buttons and breast pocket square slot.',
      price: 3899,
      original_price: 5499,
      category: "Men's Fashion",
      subcategory: 'Nehru Jackets',
      sizes: ['38', '40', '42', '44', '46'],
      image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop',
      barcode: 'KALA-MEN-001',
      stock_quantity: 30,
      is_in_stock: true,
      artisan_id: banarasId,
      is_handmade: true,
      material: 'Pure Raw Dupion Silk',
      style: 'Royal Bandhgala',
      ai_generated: false,
      ai_suggested_price: 3999,
      tags: ['Nehru Jacket', 'Raw Silk', 'Mens Fashion', 'Festive']
    },
    {
      name: 'Hand-Block Printed Indigo Short Sleeve Linen Shirt',
      description: 'Breezy summer shirt crafted from pure European flax linen, hand-block printed with timeless Bagru geometric motifs in natural indigo.',
      price: 2199,
      original_price: 3299,
      category: "Men's Fashion",
      subcategory: 'Linen Shirts',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop',
      barcode: 'KALA-MEN-002',
      stock_quantity: 42,
      is_in_stock: true,
      artisan_id: kutchId,
      is_handmade: true,
      material: '100% Pure Flax Linen',
      style: 'Smart Casual',
      ai_generated: false,
      ai_suggested_price: 2299,
      tags: ['Linen', 'Indigo', 'Hand Block', 'Shirt']
    },
    {
      name: 'Banarasi Brocade Silk Kurta & Churidar Set',
      description: 'Exquisite ivory and gold brocade kurta woven with delicate floral buttas, paired with tailored silk-cotton churidar pants and a contrast maroon pocket square.',
      price: 4999,
      original_price: 7499,
      category: "Men's Fashion",
      subcategory: 'Kurta Pajama Sets',
      sizes: ['38', '40', '42', '44', '46'],
      image_url: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=900&auto=format&fit=crop',
      barcode: 'KALA-MEN-003',
      stock_quantity: 18,
      is_in_stock: true,
      artisan_id: banarasId,
      is_handmade: true,
      material: 'Banarasi Brocade Silk',
      style: 'Ceremony Wear',
      ai_generated: false,
      ai_suggested_price: 5299,
      tags: ['Banarasi', 'Kurta Set', 'Wedding', 'Menswear']
    },

    // ════ WOMEN'S FASHION ════
    {
      name: 'Chanderi Handloom Floral Anarkali Kurti with Dupatta',
      description: 'Graceful flared Anarkali silhouette in handloom Chanderi silk cotton, featuring hand-embroidered gota patti work on the neckline and a matching lightweight organza dupatta.',
      price: 4499,
      original_price: 6499,
      category: "Women's Fashion",
      subcategory: 'Anarkali Sets',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop',
      barcode: 'KALA-WOM-001',
      stock_quantity: 26,
      is_in_stock: true,
      artisan_id: lucknowId,
      is_handmade: true,
      material: 'Handloom Chanderi & Organza',
      style: 'Ethnic Anarkali',
      ai_generated: false,
      ai_suggested_price: 4699,
      tags: ['Anarkali', 'Chanderi', 'Gota Patti', 'Womens Fashion']
    },
    {
      name: 'Organic Kala Cotton Hand-Block Print Flared Dress',
      description: 'Tiered bohemian midi dress handcrafted from breathable natural Kala cotton, hand-block printed with botanical motifs using mineral dye pigments.',
      price: 2799,
      original_price: 3999,
      category: "Women's Fashion",
      subcategory: 'Dresses',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=900&auto=format&fit=crop',
      barcode: 'KALA-WOM-002',
      stock_quantity: 34,
      is_in_stock: true,
      artisan_id: kutchId,
      is_handmade: true,
      material: 'Organic Kala Cotton',
      style: 'Boho Artisan Dress',
      ai_generated: false,
      ai_suggested_price: 2899,
      tags: ['Kala Cotton', 'Dress', 'Organic', 'Hand Block']
    },

    // ════ TRADITIONAL WEAR ════
    {
      name: 'Heritage Silk Sherwani with Hand-Embroidered Zari Stole',
      description: 'Masterpiece wedding sherwani in golden ivory raw silk, hand-embroidered with micro-zardozi motifs and complemented by a rich crimson Banarasi brocade stole.',
      price: 11999,
      original_price: 17999,
      category: 'Traditional Wear',
      subcategory: 'Sherwanis',
      sizes: ['38', '40', '42', '44', '46'],
      image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=900&auto=format&fit=crop',
      barcode: 'KALA-TRD-001',
      stock_quantity: 8,
      is_in_stock: true,
      artisan_id: banarasId,
      is_handmade: true,
      material: 'Pure Raw Silk & Zardozi',
      style: 'Bridal Heritage',
      ai_generated: false,
      ai_suggested_price: 12499,
      tags: ['Sherwani', 'Wedding', 'Royal', 'Traditional']
    },
    {
      name: 'Handwoven South Indian Silk Dhoti & Angavastram Set',
      description: 'Pure Mulberry silk traditional Panchakacham dhoti set with rich golden zari borders, crafted by heritage weavers for auspicious rituals and weddings.',
      price: 3699,
      original_price: 4999,
      category: 'Traditional Wear',
      subcategory: 'Dhoti Sets',
      sizes: ['Free Size (4m Dhoti + 2m Angavastram)'],
      image_url: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=900&auto=format&fit=crop',
      barcode: 'KALA-TRD-002',
      stock_quantity: 20,
      is_in_stock: true,
      artisan_id: utkalId,
      is_handmade: true,
      material: 'Pure Mulberry Silk',
      style: 'Traditional Panchakacham',
      ai_generated: false,
      ai_suggested_price: 3899,
      tags: ['Dhoti', 'Silk', 'Traditional', 'Zari']
    },

    // ════ ACCESSORIES ════
    {
      name: 'Handcrafted Handloom Silk Brocade Stole – Gold & Maroon',
      description: 'Double-sided woven silk brocade stole featuring intricate paisley motifs and hand-knotted fringe edges. Perfect companion for kurtas and suits.',
      price: 1599,
      original_price: 2299,
      category: 'Accessories',
      subcategory: 'Stoles',
      sizes: ['Free Size (2m x 0.6m)'],
      image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop',
      barcode: 'KALA-ACC-001',
      stock_quantity: 40,
      is_in_stock: true,
      artisan_id: banarasId,
      is_handmade: true,
      material: 'Mulberry Silk Brocade',
      style: 'Royal Accessory',
      ai_generated: false,
      ai_suggested_price: 1699,
      tags: ['Stole', 'Brocade', 'Silk', 'Accessories']
    },
    {
      name: 'Hand-Carved Brass Button Set for Royal Kurtas (Set of 6)',
      description: 'Set of 6 detachable handcrafted solid brass buttons with antique patina finish and intricate peacock engravings, packed in a handmade wooden box.',
      price: 899,
      original_price: 1399,
      category: 'Accessories',
      subcategory: 'Jewelry & Accents',
      sizes: ['Set of 6 Buttons'],
      image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&auto=format&fit=crop',
      barcode: 'KALA-ACC-002',
      stock_quantity: 60,
      is_in_stock: true,
      artisan_id: utkalId,
      is_handmade: true,
      material: 'Solid Brass with Antique Finish',
      style: 'Artisan Metalcraft',
      ai_generated: false,
      ai_suggested_price: 999,
      tags: ['Brass Buttons', 'Handmade', 'Kurta Buttons', 'Accessories']
    },
    {
      name: 'Handcrafted Pure Leather Cardholder & Wallet with Kantha Stitch',
      description: 'Slim bifold wallet made from vegetable-tanned grain leather, finished with delicate hand Kantha cross-stitch detailing along the spine.',
      price: 1199,
      original_price: 1799,
      category: 'Accessories',
      subcategory: 'Wallets & Bags',
      sizes: ['One Size'],
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop',
      barcode: 'KALA-ACC-003',
      stock_quantity: 35,
      is_in_stock: true,
      artisan_id: lucknowId,
      is_handmade: true,
      material: 'Grain Leather & Kantha Stitch',
      style: 'Artisan Leathercraft',
      ai_generated: false,
      ai_suggested_price: 1299,
      tags: ['Leather', 'Kantha', 'Wallet', 'Handmade']
    }
  ];

  console.log(`📦 Inserting ${kalaProducts.length} Kala demo products...`);

  const { data: inserted, error: insError } = await supabase
    .from('products')
    .insert(kalaProducts)
    .select();

  if (insError) {
    console.error('❌ Insert Error:', insError);
  } else {
    console.log(`🎉 Successfully seeded ${inserted?.length || 0} KalaStyle demo products!`);
  }

  // Check review table and seed 3 sample authentic reviews
  try {
    console.log('⭐ Adding sample customer reviews...');
    await supabase.from('reviews').insert([
      {
        product_name: 'Kutch Kala Cotton Handwoven Indigo Saree',
        customer_name: 'Ananya Deshmukh',
        rating: 5,
        review_text: 'The texture of organic Kala cotton is unmatched! Breathable, beautifully draped, and knowing it directly supports Kutch weavers makes it even more special.',
        is_approved: true
      },
      {
        product_name: 'Lucknowi Chikankari Hand-Embroidered Pure Cotton Kurta',
        customer_name: 'Vikramaditya Roy',
        rating: 5,
        review_text: 'Impeccable Chikankari needlework. The fabric is super soft and featherlight for summer festivities.',
        is_approved: true
      },
      {
        product_name: 'Dokra Handcrafted Brass Tribal Cuff & Button Set',
        customer_name: 'Siddharth Menon',
        rating: 5,
        review_text: 'True work of art. The antique brass finish gives a rich, ethnic vibe to all my kurtas.',
        is_approved: true
      }
    ]);
    console.log('✅ Sample reviews added.');
  } catch (err) {
    console.log('Note on sample reviews:', err.message);
  }

  console.log('🌟 KalaStyle AI product seed completed successfully!');
}

seedKala()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to run seed script:', err);
    process.exit(1);
  });
