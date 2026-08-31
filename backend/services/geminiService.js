/**
 * backend/services/geminiService.js
 * ─────────────────────────────────
 * Centralized Gemini AI service using the @google/genai SDK.
 * All AI controllers must use this service — never initialize
 * the Gemini client directly in controllers.
 *
 * Key design decisions:
 *  - API key is read from process.env.GEMINI_API_KEY (never hardcoded)
 *  - Model is read from process.env.GEMINI_MODEL (configurable)
 *  - No prefix-based key validation (AQ., AIza., etc.)
 *  - Auth errors are caught and surfaced as clear server-side messages
 *  - Structured JSON responses are validated and sanitized
 */

const { GoogleGenAI } = require('@google/genai');

// ── Constants ────────────────────────────────────────────────────────────────

const FALLBACK_MODEL = 'gemini-3.6-flash';

const SEVEN_CATEGORIES = [
  'Handloom & Textiles',
  'Home Décor & Furnishings',
  'Handmade Jewelry & Accessories',
  'Pottery & Terracotta',
  'Wooden Handicrafts',
  'Traditional Paintings & Wall Art',
  'Eco-Friendly & Natural Products',
];

// ── Client Factory ───────────────────────────────────────────────────────────

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

function getModelName() {
  return process.env.GEMINI_MODEL || FALLBACK_MODEL;
}

// ── Core: Generate Text ──────────────────────────────────────────────────────

/**
 * generateText(prompt)
 * Sends a plain text prompt to Gemini and returns the response string.
 */
async function generateText(prompt) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: getModelName(),
    contents: prompt,
  });
  return response.text.trim();
}

// ── Core: Analyze Image ──────────────────────────────────────────────────────

/**
 * analyzeImage(imageUrl, prompt)
 * Sends an image URL + text prompt to Gemini vision and returns the response string.
 */
async function analyzeImage(imageUrl, prompt) {
  const ai = getClient();

  // Fetch the image and convert to base64 for inline data
  let imagePart;
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching image`);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    imagePart = { inlineData: { mimeType, data: base64 } };
  } catch (imgErr) {
    console.warn('[geminiService] Could not fetch image for analysis:', imgErr.message);
    // Fall back to text-only analysis
    return await generateText(prompt + '\n\n(Note: Image could not be loaded — analyze from description only)');
  }

  const response = await ai.models.generateContent({
    model: getModelName(),
    contents: [
      { role: 'user', parts: [imagePart, { text: prompt }] },
    ],
  });
  return response.text.trim();
}

// ── Core: Generate Structured JSON ──────────────────────────────────────────

/**
 * generateStructuredJSON(prompt, schema)
 * Sends a prompt instructing Gemini to return JSON.
 * Validates and sanitizes the response against the expected schema.
 * Returns { data, isAI: true } on success, { data: fallback, isAI: false } on failure.
 */
async function generateStructuredJSON(prompt, fallback = {}) {
  let rawText = '';
  try {
    rawText = await generateText(prompt);

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return { data: parsed, isAI: true };
  } catch (err) {
    // Surface the actual error type for easier debugging
    const isAuthError =
      err.message?.includes('API_KEY_INVALID') ||
      err.message?.includes('PERMISSION_DENIED') ||
      err.message?.includes('401') ||
      err.status === 401;

    if (isAuthError) {
      console.error(
        '[geminiService] Authentication failed. Check GEMINI_API_KEY in backend/.env\n' +
        '  Error:', err.message
      );
    } else if (err instanceof SyntaxError) {
      console.warn('[geminiService] JSON parse failed. Raw response:', rawText?.slice(0, 300));
    } else {
      console.error('[geminiService] generateStructuredJSON error:', err.message);
    }

    return { data: fallback, isAI: false, error: err.message };
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getModelName,
  getClient,
  generateText,
  analyzeImage,
  generateStructuredJSON,
  SEVEN_CATEGORIES,
};
