const path = require('path');
const fs = require('fs');

// Settings stored in a JSON file — no DB schema change required
const SETTINGS_FILE = path.join(__dirname, '../data/site_settings.json');

const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336522/style-heaven-assets/hero_slide_1.png',
    badgeText: '',
    badgeType: 'new',
    headline: 'Redefine Your Style',
    subtitle: 'Premium menswear collection crafted for modern gentlemen.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    align: 'left',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336524/style-heaven-assets/hero_slide_2.png',
    badgeText: '✦ New Arrival',
    badgeType: 'new',
    headline: 'Summer Collection 2026',
    subtitle: 'Fresh arrivals with trending fashion styles.',
    buttonText: 'Explore Collection',
    buttonLink: '/products',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336525/style-heaven-assets/hero_slide_3.png',
    badgeText: '',
    badgeType: 'new',
    headline: 'Classic Meets Modern',
    subtitle: 'Elegant outfits for every occasion.',
    buttonText: 'View Products',
    buttonLink: '/products',
    align: 'left',
  },
  {
    id: 4,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336527/style-heaven-assets/hero_slide_4.png',
    badgeText: '★ Limited Edition',
    badgeType: 'sale',
    headline: 'Luxury You Can Wear',
    subtitle: 'Discover exclusive fashion with premium quality.',
    buttonText: 'Discover More',
    buttonLink: '/products',
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
