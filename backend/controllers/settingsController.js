const path = require('path');
const fs = require('fs');

// Settings stored in a JSON file — no DB schema change required
const SETTINGS_FILE = path.join(__dirname, '../data/site_settings.json');

const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1789048652/kalastyle-artisan-marketplace/wesedw9fpem0032yfsmk.jpg',
    badgeText: '✦ Heritage Handlooms',
    badgeType: 'new',
    headline: 'Pure Handloom & Heritage Silks',
    subtitle: 'Authentic Banarasi, Kanchipuram, and Pashmina handwoven by master generational weavers across India.',
    buttonText: 'Explore Handlooms',
    buttonLink: '/products?category=Handloom+%26+Textiles',
    align: 'left',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1789047566/kalastyle-artisan-marketplace/xtzypfezplersfalej58.jpg',
    badgeText: '★ 22K Gold Heritage',
    badgeType: 'sale',
    headline: 'Traditional Indian Art & Paintings',
    subtitle: 'Royal Tanjore gold foil art, Madhubani folk paintings, and Pattachitra scrolls straight from artisan guilds.',
    buttonText: 'Discover Art',
    buttonLink: '/products?category=Traditional+Paintings+%26+Wall+Art',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1789047399/kalastyle-artisan-marketplace/m4z3g3pnrgfwpaixwlbg.jpg',
    badgeText: '✦ Hand-Carved Teak',
    badgeType: 'new',
    headline: 'Artisanal Wooden Handicrafts',
    subtitle: 'Intricate Saharanpur woodcrafts, ornate jharokha mirrors, and vibrant Channapatna organic toy craft.',
    buttonText: 'Shop Wooden Crafts',
    buttonLink: '/products?category=Wooden+Handicrafts',
    align: 'left',
  },
  {
    id: 4,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1789048918/kalastyle-artisan-marketplace/jkjs1hgqonmbq9h3eizd.jpg',
    badgeText: '★ 100% Handmade',
    badgeType: 'sale',
    headline: 'Timeless Indian Home Décor',
    subtitle: 'Hand-knotted rugs, brass hanging lamps, and natural river clay terracotta pottery for elegant spaces.',
    buttonText: 'Explore Home Décor',
    buttonLink: '/products?category=Home+D%C3%A9cor+%26+Furnishings',
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
  footerTagline: "Empowering India's generational artisans, master handloom weavers, and traditional craftsmen with AI-driven direct commerce.",
  heroSlides: DEFAULT_HERO_SLIDES,
  discountBanner: DEFAULT_DISCOUNT_BANNER,
};

const supabase = require('../config/supabase');
const { safeQuery } = require('../config/supabase');

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
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {
    console.warn('Could not write local settings file:', e.message);
  }
}

/**
 * GET /api/settings — public, no auth needed
 */
exports.getSettings = async (req, res) => {
  try {
    const local = readSettings();

    // Query Supabase platform_settings for persistent cloud data
    const { data: supaData } = await safeQuery(() =>
      supabase.from('platform_settings').select('*').eq('id', 'main').single()
    );

    const merged = {
      ...DEFAULT_SETTINGS,
      ...local,
      ...(supaData || {}),
      storeName: supaData?.storeName || supaData?.platform_name || local.storeName || DEFAULT_SETTINGS.storeName,
      platform_name: supaData?.platform_name || supaData?.storeName || local.platform_name || DEFAULT_SETTINGS.storeName,
      supportEmail: supaData?.supportEmail || supaData?.contact_email || local.supportEmail || DEFAULT_SETTINGS.supportEmail,
      contact_email: supaData?.contact_email || supaData?.supportEmail || local.contact_email || DEFAULT_SETTINGS.supportEmail,
      supportPhone: supaData?.supportPhone || supaData?.contact_phone || local.supportPhone || DEFAULT_SETTINGS.supportPhone,
      contact_phone: supaData?.contact_phone || supaData?.supportPhone || local.contact_phone || DEFAULT_SETTINGS.supportPhone,
      taxRate: supaData?.taxRate !== undefined ? String(supaData.taxRate) : (supaData?.tax_rate !== undefined ? String(supaData.tax_rate) : local.taxRate),
      tax_rate: supaData?.tax_rate !== undefined ? Number(supaData.tax_rate) : (supaData?.taxRate !== undefined ? Number(supaData.taxRate) : Number(local.taxRate)),
      maintenanceMode: supaData?.maintenanceMode !== undefined ? supaData.maintenanceMode : (supaData?.maintenance_mode !== undefined ? supaData.maintenance_mode : local.maintenanceMode),
      maintenance_mode: supaData?.maintenance_mode !== undefined ? supaData.maintenance_mode : (supaData?.maintenanceMode !== undefined ? supaData.maintenanceMode : local.maintenanceMode),
      heroSlides: (Array.isArray(supaData?.hero_slides) && supaData.hero_slides.length > 0)
        ? supaData.hero_slides
        : ((Array.isArray(supaData?.heroSlides) && supaData.heroSlides.length > 0)
            ? supaData.heroSlides
            : local.heroSlides),
      discountBanner: supaData?.discount_banner || supaData?.discountBanner || local.discountBanner || DEFAULT_DISCOUNT_BANNER,
    };

    res.json(merged);
  } catch (err) {
    console.error('getSettings error:', err);
    res.json(readSettings());
  }
};

/**
 * PUT /api/settings — admin only
 */
exports.updateSettings = async (req, res) => {
  try {
    const current = readSettings();
    const updates = req.body;

    const normalizedUpdates = {
      ...updates,
      ...(updates.platform_name ? { platform_name: updates.platform_name, storeName: updates.platform_name } : {}),
      ...(updates.storeName ? { storeName: updates.storeName, platform_name: updates.storeName } : {}),
      ...(updates.contact_email ? { contact_email: updates.contact_email, supportEmail: updates.contact_email } : {}),
      ...(updates.supportEmail ? { supportEmail: updates.supportEmail, contact_email: updates.supportEmail } : {}),
      ...(updates.contact_phone ? { contact_phone: updates.contact_phone, supportPhone: updates.contact_phone } : {}),
      ...(updates.supportPhone ? { supportPhone: updates.supportPhone, contact_phone: updates.supportPhone } : {}),
      ...(updates.tax_rate !== undefined ? { tax_rate: updates.tax_rate, taxRate: String(updates.tax_rate) } : {}),
      ...(updates.taxRate !== undefined ? { taxRate: updates.taxRate, tax_rate: Number(updates.taxRate) || 0 } : {}),
      ...(updates.maintenance_mode !== undefined ? { maintenance_mode: updates.maintenance_mode, maintenanceMode: updates.maintenance_mode } : {}),
      ...(updates.maintenanceMode !== undefined ? { maintenanceMode: updates.maintenanceMode, maintenance_mode: updates.maintenanceMode } : {}),
      ...(updates.heroSlides ? { heroSlides: updates.heroSlides, hero_slides: updates.heroSlides } : {}),
      ...(updates.hero_slides ? { hero_slides: updates.hero_slides, heroSlides: updates.hero_slides } : {}),
      ...(updates.discountBanner ? { discountBanner: updates.discountBanner, discount_banner: updates.discountBanner } : {}),
      ...(updates.discount_banner ? { discount_banner: updates.discount_banner, discountBanner: updates.discount_banner } : {}),
    };

    const updated = { ...current, ...normalizedUpdates };
    writeSettings(updated);

    // Also persist to Supabase platform_settings
    try {
      await supabase
        .from('platform_settings')
        .upsert([{ id: 'main', ...normalizedUpdates, updated_at: new Date().toISOString() }]);
    } catch (e) {
      console.warn('Failed to upsert to Supabase platform_settings:', e.message);
    }

    // Broadcast live to all devices (desktop, phone, tablet)
    const { broadcastSync } = require('../utils/realtime');
    broadcastSync('SETTINGS_UPDATED', updated);

    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
};
