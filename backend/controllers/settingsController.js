const path = require('path');
const fs = require('fs');

// Settings stored in a JSON file — no DB schema change required
const SETTINGS_FILE = path.join(__dirname, '../data/site_settings.json');

const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&auto=format&fit=crop',
    badgeText: '✦ Heritage Handlooms & Textiles',
    badgeType: 'new',
    headline: 'Authentic Indian Handicrafts',
    subtitle: 'Pure Banarasi silks, Kashmiri pashmina, and generational weaves directly from master artisans.',
    buttonText: 'Explore Handlooms',
    buttonLink: '/products?category=Handloom+%26+Textiles',
    align: 'left',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&auto=format&fit=crop',
    badgeText: '★ Artisanal Living',
    badgeType: 'sale',
    headline: 'Home Décor & Furnishings',
    subtitle: 'Handcrafted wall tapestries, brass lamps, dhurrie rugs, and royal teak carvings.',
    buttonText: 'Shop Home Décor',
    buttonLink: '/products?category=Home+D%C3%A9cor+%26+Furnishings',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600&auto=format&fit=crop',
    badgeText: '✦ Dokra & Silver Filigree',
    badgeType: 'new',
    headline: 'Handmade Jewelry & Accessories',
    subtitle: '4000-year-old lost wax brass, 925 sterling jhumkas, and royal Kundan chokers.',
    buttonText: 'Shop Jewelry',
    buttonLink: '/products?category=Handmade+Jewelry+%26+Accessories',
    align: 'left',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=1600&auto=format&fit=crop',
    badgeText: '🌿 100% Sustainable & Biodegradable',
    badgeType: 'new',
    headline: 'Eco-Friendly & Natural Products',
    subtitle: 'Golden jute rugs, seasoned Assam bamboo homeware, and zero-plastic living.',
    buttonText: 'Shop Eco-Friendly',
    buttonLink: '/products?category=Eco-Friendly+%26+Natural+Products',
    align: 'center',
  },
];

const DEFAULT_DISCOUNT_BANNER = {
  title: 'Artisan Launch Sale',
  description: 'Use this code and get upto 30% off on handmade products',
  discount: '30%',
  code: 'KALA30',
  discountPercentage: 30,
  buttonText: 'Grab the Deal',
  buttonLink: '/products',
  isActive: true,
};

const DEFAULT_SETTINGS = {
  storeName: 'KalaStyle AI',
  supportEmail: 'support@kalastyle.ai',
  supportPhone: '+91 7676558335',
  storeAddress: 'KalaStyle AI, Supporting Artisans & Handloom Crafts Across India',
  currency: 'INR (₹)',
  taxRate: '18',
  maintenanceMode: false,
  orderNotifications: true,
  instagramUrl: 'https://www.instagram.com/style_heaven_mens_wear?igsh=MXVueXV5ejc1bXVvNQ==',
  whatsappNumber: '917676558335',
  footerTagline: "Redefining men's fashion with premium quality fabrics, timeless designs, and unmatched elegance.",
  heroSlides: DEFAULT_HERO_SLIDES,
  discountBanner: DEFAULT_DISCOUNT_BANNER,
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        heroSlides: Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0 ? parsed.heroSlides : DEFAULT_HERO_SLIDES,
        discountBanner: parsed.discountBanner ? { ...DEFAULT_DISCOUNT_BANNER, ...parsed.discountBanner } : DEFAULT_DISCOUNT_BANNER,
      };
    }
  } catch (e) {
    console.warn('Could not read settings file, using defaults:', e.message);
  }
  return { ...DEFAULT_SETTINGS };
}

function writeSettings(settings) {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

/**
 * GET /api/settings — public, no auth needed
 */
exports.getSettings = (req, res) => {
  try {
    const settings = readSettings();
    // Never expose internal flags in public response
    res.json(settings);
  } catch (err) {
    console.error('getSettings error:', err);
    res.json({ ...DEFAULT_SETTINGS });
  }
};

/**
 * PUT /api/settings — admin only
 */
exports.updateSettings = (req, res) => {
  try {
    const current = readSettings();
    const updated = { ...current, ...req.body };
    writeSettings(updated);
    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
};
