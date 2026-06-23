const path = require('path');
const fs = require('fs');

// Settings stored in a JSON file — no DB schema change required
const SETTINGS_FILE = path.join(__dirname, '../data/site_settings.json');

const DEFAULT_SETTINGS = {
  storeName: 'Style Heaven',
  supportEmail: 'support@styleheaven.com',
  supportPhone: '+91 7676558335',
  storeAddress: "Style heaven men's Wear, L. E, T College Road, near Wali Complex, Gokak, Karnataka 591307",
  currency: 'INR (₹)',
  taxRate: '18',
  maintenanceMode: false,
  orderNotifications: true,
  instagramUrl: 'https://www.instagram.com/style_heaven_mens_wear?igsh=MXVueXV5ejc1bXVvNQ==',
  whatsappNumber: '917676558335',
  footerTagline: "Redefining men's fashion with premium quality fabrics, timeless designs, and unmatched elegance.",
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
