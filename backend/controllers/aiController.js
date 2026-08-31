/**
 * backend/controllers/aiController.js
 * ─────────────────────────────────────
 * All Gemini AI logic for the KalaStyle AI platform.
 * Uses the centralized geminiService — never initializes
 * the Gemini client directly.
 *
 * Exported handlers:
 *  1. analyzeProduct       — image + description → catalog fields
 *  2. generateDescription  — simple text → professional description
 *  3. generateFullCatalog  — structured JSON product catalog
 *  4. detectCategory       — 7-category auto-detection with confidence
 *  5. translateProduct     — EN/HI/KN/MR multilingual catalog
 *  6. suggestPrice         — deterministic calc + AI range explanation
 *  7. generateArtisanStory — biography from artisan-provided info
 *  8. getAIInsights        — real Supabase stats → AI trend insights
 *  9. smartSearch          — semantic query expansion for product search
 */

const gemini = require('../services/geminiService');

const { SEVEN_CATEGORIES } = gemini;

// ════════════════════════════════════════════════════════════════════════════
// SMART FALLBACKS — Used when AI call fails or key is not configured
// ════════════════════════════════════════════════════════════════════════════

function buildMockCatalog(description = '') {
  const lower = description.toLowerCase();
  let category = 'Handmade Jewelry & Accessories';
  let material = 'Mixed Materials';
  let subcategory = 'Artisan Collection';
  let technique = 'Handcrafted';

  if (lower.includes('saree') || lower.includes('silk') || lower.includes('weav') || lower.includes('fabric') || lower.includes('textile') || lower.includes('loom')) {
    category = 'Handloom & Textiles'; material = 'Handloom Fabric'; subcategory = 'Handwoven Textiles'; technique = 'Handwoven';
  } else if (lower.includes('bamboo') || lower.includes('jute') || lower.includes('cane') || lower.includes('eco') || lower.includes('natural')) {
    category = 'Eco-Friendly & Natural Products'; material = 'Bamboo/Jute'; subcategory = 'Natural Fiber Products'; technique = 'Handcrafted';
  } else if (lower.includes('wood') || lower.includes('carv') || lower.includes('toy') || lower.includes('wooden')) {
    category = 'Wooden Handicrafts'; material = 'Natural Wood'; subcategory = 'Wooden Home Décor'; technique = 'Hand-carved';
  } else if (lower.includes('clay') || lower.includes('pot') || lower.includes('terracotta') || lower.includes('ceramic')) {
    category = 'Pottery & Terracotta'; material = 'Terracotta/Clay'; subcategory = 'Decorative Pottery'; technique = 'Pottery';
  } else if (lower.includes('paint') || lower.includes('art') || lower.includes('madhubani') || lower.includes('warli') || lower.includes('gond')) {
    category = 'Traditional Paintings & Wall Art'; material = 'Natural Colors on Canvas'; subcategory = 'Folk Art'; technique = 'Hand-painted';
  } else if (lower.includes('decor') || lower.includes('lamp') || lower.includes('cushion') || lower.includes('furnish') || lower.includes('home')) {
    category = 'Home Décor & Furnishings'; material = 'Mixed Handcrafted Materials'; subcategory = 'Decorative Items'; technique = 'Handcrafted';
  }

  const words = description.trim().split(' ').slice(0, 5).join(' ');
  const productName = words ? (words.charAt(0).toUpperCase() + words.slice(1)) : 'Authentic Indian Handicraft';

  return {
    productName,
    shortDescription: `A beautifully handcrafted ${category.toLowerCase()} made by skilled Indian artisans using traditional techniques.`,
    fullDescription: `This ${productName} is a genuine piece of Indian craftsmanship. ${description || 'Handcrafted with care using traditional methods passed down through generations.'}. Each piece is unique and reflects the rich cultural heritage of India's artisan communities. Made with high-quality ${material}, this product supports local artisans and their livelihoods.`,
    category,
    subcategory,
    materials: [material],
    craftTechnique: technique,
    suggestedTags: ['handmade', 'artisan', 'indian-handicraft', 'authentic', category.toLowerCase().split(' ')[0]],
    keyFeatures: ['100% handmade', 'Authentic Indian craft', `Made from ${material}`, 'Unique one-of-a-kind piece', 'Supports local artisans'],
    careInstructions: ['Handle with care', 'Keep away from direct sunlight', 'Store in a cool dry place', 'Clean gently with soft cloth'],
    suggestedPriceRange: { minimum: 499, maximum: 2999, currency: 'INR' },
    isAIGenerated: false,
    note: 'Smart fallback catalog — configure GEMINI_API_KEY in backend/.env for AI-generated content.',
  };
}

function validateCatalogFields(obj) {
  return {
    productName:        String(obj.productName        || obj.product_name        || 'Artisan Product'),
    shortDescription:   String(obj.shortDescription   || obj.short_description   || ''),
    fullDescription:    String(obj.fullDescription    || obj.full_description    || obj.description || ''),
    category:           String(obj.category           || 'Handmade Jewelry & Accessories'),
    subcategory:        String(obj.subcategory        || 'Artisan Collection'),
    materials:          Array.isArray(obj.materials)  ? obj.materials  : [String(obj.material || 'Handcrafted Materials')],
    craftTechnique:     String(obj.craftTechnique     || obj.craft_technique     || 'Handcrafted'),
    suggestedTags:      Array.isArray(obj.suggestedTags)     ? obj.suggestedTags     : (Array.isArray(obj.tags) ? obj.tags : ['handmade', 'artisan']),
    keyFeatures:        Array.isArray(obj.keyFeatures)       ? obj.keyFeatures       : ['Handmade', 'Authentic Indian Craft'],
    careInstructions:   Array.isArray(obj.careInstructions)  ? obj.careInstructions  : ['Handle with care'],
    suggestedPriceRange: (obj.suggestedPriceRange && typeof obj.suggestedPriceRange === 'object')
      ? { minimum: Number(obj.suggestedPriceRange.minimum || obj.suggestedPriceRange.min || 499), maximum: Number(obj.suggestedPriceRange.maximum || obj.suggestedPriceRange.max || 2999), currency: 'INR' }
      : { minimum: 499, maximum: 2999, currency: 'INR' },
    isAIGenerated: obj.isAI !== false,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. ANALYZE PRODUCT — Image + Description → Catalog Fields
// ════════════════════════════════════════════════════════════════════════════

exports.analyzeProduct = async (req, res) => {
  try {
    const { image_url, description } = req.body;

    if (!description && !image_url) {
      return res.status(400).json({ error: 'Please provide an image URL or product description.' });
    }

    const prompt = `You are an expert Indian handicrafts product listing assistant for KalaStyle AI — a marketplace connecting artisans with buyers.

Analyze this artisan product and return ONLY a valid JSON object with EXACTLY these fields (no markdown, no explanation):
{
  "productName": "concise marketable name",
  "shortDescription": "1-2 sentence attractive e-commerce description",
  "fullDescription": "3-4 sentence professional description mentioning craftsmanship, materials, cultural heritage, and usage",
  "category": "MUST be one of: ${SEVEN_CATEGORIES.join(' | ')}",
  "subcategory": "specific subcategory",
  "materials": ["material1", "material2"],
  "craftTechnique": "e.g. Handwoven, Hand-carved, Hand-painted, Pottery, Embroidered",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keyFeatures": ["feature1", "feature2", "feature3", "feature4"],
  "careInstructions": ["instruction1", "instruction2"],
  "suggestedPriceRange": { "minimum": 500, "maximum": 3000, "currency": "INR" }
}

Artisan description: "${description || 'No description provided'}"

Rules:
- category MUST exactly match one of the 7 provided options
- Respect Indian cultural heritage — avoid inventing facts
- Do not exaggerate claims or invent historical facts
- Return ONLY valid JSON`;

    let result;
    if (image_url) {
      const { data, isAI } = await gemini.generateStructuredJSON(
        prompt, // fallback prompt handled inside analyzeImage path
        buildMockCatalog(description)
      );
      // Try image analysis first
      try {
        const imageText = await gemini.analyzeImage(image_url, prompt);
        const cleaned = imageText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
        const parsed = JSON.parse(cleaned);
        result = { data: parsed, isAI: true };
      } catch {
        result = { data, isAI };
      }
    } else {
      result = await gemini.generateStructuredJSON(prompt, buildMockCatalog(description));
    }

    const catalog = validateCatalogFields({ ...result.data, isAI: result.isAI });

    // Legacy field mapping for existing AIProductStudio compatibility
    return res.json({
      ...catalog,
      product_name: catalog.productName,
      description: catalog.fullDescription,
      category: catalog.category,
      material: catalog.materials[0] || '',
      tags: catalog.suggestedTags,
      suggested_price: catalog.suggestedPriceRange.minimum + Math.round((catalog.suggestedPriceRange.maximum - catalog.suggestedPriceRange.minimum) * 0.4),
      price_range: { min: catalog.suggestedPriceRange.minimum, max: catalog.suggestedPriceRange.maximum },
      ai_notes: catalog.isAIGenerated
        ? `Generated by Gemini ${gemini.getModelName()} — AI-generated estimate.`
        : 'Smart fallback — configure GEMINI_API_KEY for AI generation.',
    });
  } catch (err) {
    console.error('[analyzeProduct] Error:', err.message);
    return res.json({ ...buildMockCatalog(req.body?.description), product_name: buildMockCatalog(req.body?.description).productName });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 2. GENERATE DESCRIPTION — Simple text → Professional description
// ════════════════════════════════════════════════════════════════════════════

exports.generateDescription = async (req, res) => {
  try {
    const { simple_text, language = 'English' } = req.body;
    if (!simple_text) return res.status(400).json({ error: 'Please provide simple_text' });

    const prompt = `Convert this simple artisan product description into a professional, attractive e-commerce description in ${language}.
Simple description: "${simple_text}"
Write 3-4 sentences highlighting: craftsmanship, material quality, cultural heritage, and customer value.
Return ONLY the description text — no markdown, no labels, no explanation.`;

    try {
      const text = await gemini.generateText(prompt);
      return res.json({ professional_description: text });
    } catch {
      return res.json({
        professional_description: `A beautifully handcrafted piece made with love and skill by Indian artisans. ${simple_text}. Each item is unique, reflecting the rich tradition of Indian craftsmanship. This product supports local artisan communities and makes an excellent gift.`,
      });
    }
  } catch (err) {
    console.error('[generateDescription] Error:', err.message);
    res.status(500).json({ error: 'Could not generate description. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 3. GENERATE FULL CATALOG — Feature 1+7: Complete structured catalog
// ════════════════════════════════════════════════════════════════════════════

exports.generateFullCatalog = async (req, res) => {
  try {
    const { description, image_url, language = 'English' } = req.body;
    if (!description && !image_url) {
      return res.status(400).json({ error: 'Please provide a product description or image.' });
    }

    const prompt = `You are an Indian handicrafts product cataloging expert for KalaStyle AI.
Generate a complete professional product catalog in ${language} for this artisan product.

Product info: "${description || 'Handcrafted Indian artisan product'}"

Return ONLY valid JSON with exactly these fields:
{
  "productName": "marketable product name",
  "shortDescription": "1-2 sentences for product card",
  "fullDescription": "4-5 sentences for product page — mention purpose, craftsmanship, materials, tradition, usage",
  "category": "MUST be exactly one of: ${SEVEN_CATEGORIES.join(' | ')}",
  "subcategory": "specific subcategory within category",
  "materials": ["primary material", "secondary material"],
  "craftTechnique": "the handmade technique used",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "keyFeatures": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "careInstructions": ["care step 1", "care step 2", "care step 3"],
  "suggestedPriceRange": { "minimum": 0, "maximum": 0, "currency": "INR" }
}

Rules: category must exactly match one of the 7 options. Do not invent historical claims. Return ONLY JSON.`;

    const fallback = buildMockCatalog(description);
    const result = image_url
      ? await (async () => {
          try {
            const text = await gemini.analyzeImage(image_url, prompt);
            const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
            return { data: JSON.parse(cleaned), isAI: true };
          } catch {
            return gemini.generateStructuredJSON(prompt, fallback);
          }
        })()
      : await gemini.generateStructuredJSON(prompt, fallback);

    const catalog = validateCatalogFields({ ...result.data, isAI: result.isAI });
    return res.json({ catalog, isAIGenerated: result.isAI });
  } catch (err) {
    console.error('[generateFullCatalog] Error:', err.message);
    res.status(500).json({ error: 'Could not generate catalog. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 4. DETECT CATEGORY — Image + description → 7-category with confidence
// ════════════════════════════════════════════════════════════════════════════

exports.detectCategory = async (req, res) => {
  try {
    const { description, image_url } = req.body;
    if (!description && !image_url) {
      return res.status(400).json({ error: 'Provide a description or image URL.' });
    }

    const prompt = `You are a category classifier for Indian handicrafts.

Classify this product into exactly ONE of these 7 categories:
${SEVEN_CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Product description: "${description || 'No description provided'}"

Return ONLY valid JSON:
{
  "category": "exact category name from the list above",
  "subcategory": "specific subcategory",
  "confidence": "high | medium | low",
  "reason": "one sentence explaining why this category was chosen",
  "alternativeCategory": "second best category if confidence is low or medium"
}`;

    let result;
    if (image_url) {
      try {
        const text = await gemini.analyzeImage(image_url, prompt);
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
        result = { data: JSON.parse(cleaned), isAI: true };
      } catch {
        result = await gemini.generateStructuredJSON(prompt, null);
      }
    } else {
      result = await gemini.generateStructuredJSON(prompt, null);
    }

    if (!result.data) {
      // Deterministic fallback
      const lower = (description || '').toLowerCase();
      let category = 'Handmade Jewelry & Accessories';
      if (lower.includes('saree') || lower.includes('weav') || lower.includes('fabric')) category = 'Handloom & Textiles';
      else if (lower.includes('wood') || lower.includes('carv')) category = 'Wooden Handicrafts';
      else if (lower.includes('clay') || lower.includes('pot') || lower.includes('terracotta')) category = 'Pottery & Terracotta';
      else if (lower.includes('bamboo') || lower.includes('jute') || lower.includes('eco')) category = 'Eco-Friendly & Natural Products';
      else if (lower.includes('paint') || lower.includes('art') || lower.includes('madhubani')) category = 'Traditional Paintings & Wall Art';
      else if (lower.includes('decor') || lower.includes('home') || lower.includes('lamp')) category = 'Home Décor & Furnishings';
      result = { data: { category, subcategory: 'General', confidence: 'low', reason: 'Keyword-based fallback detection.', alternativeCategory: '' }, isAI: false };
    }

    // Ensure category is one of the 7
    if (!SEVEN_CATEGORIES.includes(result.data.category)) {
      result.data.category = SEVEN_CATEGORIES[0];
      result.data.confidence = 'low';
    }

    return res.json({ ...result.data, isAIGenerated: result.isAI });
  } catch (err) {
    console.error('[detectCategory] Error:', err.message);
    res.status(500).json({ error: 'Category detection failed. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 5. TRANSLATE PRODUCT — EN/HI/KN/MR multilingual catalog
// ════════════════════════════════════════════════════════════════════════════

exports.translateProduct = async (req, res) => {
  try {
    const { productName, description, targetLanguages = ['Hindi', 'Kannada', 'Marathi'] } = req.body;
    if (!productName && !description) {
      return res.status(400).json({ error: 'Provide productName or description to translate.' });
    }

    const langList = targetLanguages.join(', ');
    const prompt = `You are a multilingual Indian handicrafts product listing assistant.

Translate and adapt this product listing for Indian artisan markets.
Product Name: "${productName}"
Description: "${description}"

Return ONLY valid JSON with keys for each requested language:
{
  "English": { "productName": "...", "description": "..." },
  "Hindi":   { "productName": "...", "description": "..." },
  "Kannada": { "productName": "...", "description": "..." },
  "Marathi": { "productName": "...", "description": "..." }
}

Only include these languages: ${langList}
Translations must be natural and culturally appropriate — not literal machine translations.
Return ONLY valid JSON.`;

    const fallbackTranslations = {
      English: { productName, description },
      Hindi:   { productName: `${productName} (हिंदी अनुवाद उपलब्ध नहीं)`, description: description },
      Kannada: { productName: `${productName} (ಕನ್ನಡ ಅನುವಾದ ಲಭ್ಯವಿಲ್ಲ)`, description: description },
      Marathi: { productName: `${productName} (मराठी अनुवाद उपलब्ध नाही)`, description: description },
    };

    const result = await gemini.generateStructuredJSON(prompt, fallbackTranslations);
    return res.json({ translations: result.data, isAIGenerated: result.isAI });
  } catch (err) {
    console.error('[translateProduct] Error:', err.message);
    res.status(500).json({ error: 'Translation failed. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 6. SUGGEST PRICE — Deterministic calc + AI range explanation
// ════════════════════════════════════════════════════════════════════════════

exports.suggestPrice = async (req, res) => {
  try {
    const {
      rawMaterialCost = 0,
      laborCost       = 0,
      additionalExpenses = 0,
      desiredMarginPercent = 30,
      category = '',
      description = '',
    } = req.body;

    // ── Deterministic calculation (primary) ─────────────────────────────
    const baseCost = Number(rawMaterialCost) + Number(laborCost) + Number(additionalExpenses);
    const margin   = Math.max(0, Math.min(500, Number(desiredMarginPercent)));
    const suggestedPrice = Math.round(baseCost * (1 + margin / 100));

    const breakdown = {
      rawMaterialCost:    Number(rawMaterialCost),
      laborCost:          Number(laborCost),
      additionalExpenses: Number(additionalExpenses),
      baseCost,
      marginPercent:      margin,
      marginAmount:       Math.round(baseCost * margin / 100),
      suggestedPrice,
    };

    // ── AI range explanation (supplemental only) ─────────────────────────
    let aiRange = null;
    let aiExplanation = '';

    if (baseCost > 0) {
      const prompt = `You are a pricing advisor for Indian handicrafts artisans.

An artisan has the following costs for a "${category || 'handcrafted'}" product:
- Raw materials: ₹${rawMaterialCost}
- Labor: ₹${laborCost}
- Additional expenses: ₹${additionalExpenses}
- Base cost: ₹${baseCost}
- Their calculated selling price with ${margin}% margin: ₹${suggestedPrice}

Product: "${description || category || 'handcrafted artisan product'}"

Based ONLY on the artisan's actual costs (do not invent market prices), provide:
1. A suggested price range that ensures the artisan earns fairly
2. A brief explanation (2-3 sentences) of why this range is appropriate
3. Any pricing tips relevant to this type of handicraft

Return ONLY valid JSON:
{
  "recommendedRange": { "minimum": 0, "maximum": 0 },
  "explanation": "2-3 sentences",
  "tips": ["tip 1", "tip 2"]
}

Important: Base the range on the actual cost of ₹${baseCost}. Do not invent market data.`;

      const result = await gemini.generateStructuredJSON(prompt, null);
      if (result.data && result.data.recommendedRange) {
        aiRange       = result.data.recommendedRange;
        aiExplanation = result.data.explanation || '';
        breakdown.aiTips = result.data.tips || [];
      }
    }

    return res.json({
      breakdown,
      aiRange: aiRange || { minimum: Math.round(suggestedPrice * 0.9), maximum: Math.round(suggestedPrice * 1.3) },
      aiExplanation: aiExplanation || 'Price calculated from your actual costs with the specified profit margin.',
      disclaimer: 'AI-generated estimate — final pricing decision belongs to the artisan.',
    });
  } catch (err) {
    console.error('[suggestPrice] Error:', err.message);
    res.status(500).json({ error: 'Price suggestion failed. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 7. GENERATE ARTISAN STORY — Biography from artisan-provided info only
// ════════════════════════════════════════════════════════════════════════════

exports.generateArtisanStory = async (req, res) => {
  try {
    const { name, location, craft, yearsExperience, familyHistory, personalNote } = req.body;
    if (!name || !craft) {
      return res.status(400).json({ error: 'Please provide artisan name and craft specialization.' });
    }

    const prompt = `You are a respectful storyteller for KalaStyle AI — a platform supporting Indian artisans.

Write a professional, authentic artisan biography using ONLY the information provided below.
Do NOT invent any details, historical facts, awards, or claims not mentioned.
Do NOT exaggerate. Use warm, respectful language.

Artisan Information:
- Name: ${name}
- Location: ${location || 'India'}
- Craft Specialization: ${craft}
- Years of Experience: ${yearsExperience || 'several years'}
- Family Craft History: ${familyHistory || 'Not provided'}
- Personal Note: ${personalNote || 'Not provided'}

Write a 3-4 paragraph artisan story that:
1. Introduces the artisan warmly
2. Describes their craft and techniques
3. Mentions their connection to tradition (only if family history provided)
4. Explains what makes their work special

Return ONLY the story text — no JSON, no labels, no markdown headers.
Only include information explicitly provided above.`;

    try {
      const story = await gemini.generateText(prompt);
      return res.json({ story, isAIGenerated: true });
    } catch {
      const fallback = `${name} is a skilled artisan from ${location || 'India'} specializing in ${craft}. With ${yearsExperience ? yearsExperience + ' years' : 'years'} of experience, they create authentic handcrafted products that reflect India's rich cultural heritage. ${familyHistory ? familyHistory + '.' : ''} Each piece is made with dedication to preserving traditional craftsmanship while creating meaningful products for modern customers.`;
      return res.json({ story: fallback, isAIGenerated: false });
    }
  } catch (err) {
    console.error('[generateArtisanStory] Error:', err.message);
    res.status(500).json({ error: 'Story generation failed. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 8. GET AI INSIGHTS — Real Supabase stats → AI trend analysis
// ════════════════════════════════════════════════════════════════════════════

exports.getAIInsights = async (req, res) => {
  try {
    const { stats } = req.body; // Passed from frontend after fetching from artisanAPI.getMyStats()

    if (!stats || typeof stats !== 'object') {
      return res.status(400).json({ error: 'Please provide artisan stats object.' });
    }

    const { totalProducts = 0, totalOrders = 0, totalRevenue = 0, recentOrders = [] } = stats;

    // Minimum data threshold — don't send to AI if insufficient
    const hasEnoughData = totalProducts >= 1 || totalOrders >= 1;

    if (!hasEnoughData) {
      return res.json({
        insights: ['Not enough data yet to generate insights. Add your first products and start selling to see AI-powered business insights here.'],
        isAIGenerated: false,
      });
    }

    // Summarize real data — never send personal identifiable info
    const dataSummary = {
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrderCount: recentOrders.length,
      categories: [...new Set(recentOrders.map(o => o.products?.category).filter(Boolean))],
    };

    const prompt = `You are a business insights assistant for KalaStyle AI — an Indian artisan marketplace.

Using ONLY the real data below, provide 3-5 specific, actionable insights for the artisan.
Do NOT invent statistics, market data, or external comparisons.
If data is limited, acknowledge it honestly.

Artisan's Real Platform Data:
- Total products listed: ${dataSummary.totalProducts}
- Total orders received: ${dataSummary.totalOrders}
- Total revenue earned: ₹${dataSummary.totalRevenue}
- Recent orders count: ${dataSummary.recentOrderCount}
- Product categories with orders: ${dataSummary.categories.join(', ') || 'none yet'}

Provide insights as a JSON array of strings — each insight is one clear, actionable sentence.
Example format:
["Insight 1 based on real data.", "Insight 2.", "Tip 3."]

Return ONLY a valid JSON array. Do not invent numbers or external market data.`;

    const result = await gemini.generateStructuredJSON(prompt, [
      'You have ' + totalProducts + ' products listed. Add more products to increase your visibility.',
      totalOrders > 0 ? `You have received ${totalOrders} orders. Keep fulfilling them on time to build your reputation.` : 'You haven\'t received orders yet. Complete your profile and add high-quality product photos to attract buyers.',
    ]);

    const insights = Array.isArray(result.data) ? result.data : [String(result.data)];

    return res.json({ insights, isAIGenerated: result.isAI });
  } catch (err) {
    console.error('[getAIInsights] Error:', err.message);
    res.status(500).json({ error: 'Could not generate insights. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// 9. SMART SEARCH — Semantic query expansion for product discovery
// ════════════════════════════════════════════════════════════════════════════

exports.smartSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a search query.' });
    }

    const prompt = `You are a search assistant for an Indian handicrafts marketplace.

Expand this search query to find the most relevant handcrafted products.
Query: "${query}"

Return ONLY valid JSON:
{
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "categories": ["matching category from: ${SEVEN_CATEGORIES.join(', ')}"],
  "materials": ["material1", "material2"],
  "intent": "brief description of what the user is looking for"
}

Rules:
- keywords: 4-6 relevant search terms covering synonyms and related products
- categories: only from the provided list, only if genuinely relevant
- materials: common materials for these products
- Return ONLY valid JSON`;

    const fallback = {
      keywords: query.trim().split(/\s+/).slice(0, 5),
      categories: [],
      materials: [],
      intent: query,
    };

    const result = await gemini.generateStructuredJSON(prompt, fallback);
    return res.json({ expansion: result.data, isAIGenerated: result.isAI });
  } catch (err) {
    console.error('[smartSearch] Error:', err.message);
    res.status(500).json({ error: 'Smart search failed. Please try again.' });
  }
};
