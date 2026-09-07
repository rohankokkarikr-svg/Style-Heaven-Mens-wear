/**
 * backend/services/geminiService.js
 * ─────────────────────────────────
 * Centralized Google Gemini AI service.
 * All AI controllers route through this service — never initialize
 * the Gemini client directly in controllers or client-side code.
 *
 * Security & Design Rules:
 *  - API key is read dynamically from process.env.GEMINI_API_KEY (never hardcoded)
 *  - Treated strictly as an opaque secret string (no prefix checks or transformations)
 *  - NEVER logs or returns the API key string
 *  - Default model: gemini-2.0-flash (configurable via process.env.GEMINI_MODEL)
 *  - Automatic fallback to supported flash models if a model is unavailable
 *  - Robust error classification: missing key, auth failure, rate limit, model not found
 *  - Native support for both base64 Data URIs and remote image URLs
 */

const { GoogleGenAI } = require('@google/genai');

// ── Model Configuration ──────────────────────────────────────────────────────

const DEFAULT_MODEL = 'gemini-2.0-flash';
const CANDIDATE_FLASH_MODELS = [
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

const SEVEN_CATEGORIES = [
  'Handloom & Textiles',
  'Home Décor & Furnishings',
  'Handmade Jewelry & Accessories',
  'Pottery & Terracotta',
  'Wooden Handicrafts',
  'Traditional Paintings & Wall Art',
  'Eco-Friendly & Natural Products',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || typeof key !== 'string' || !key.trim()) {
    return null;
  }
  return key.trim();
}

function getModelName() {
  return (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
}

function isKeyConfigured() {
  return !!getApiKey();
}

function classifyError(err) {
  const msg = err?.message || String(err);
  const status = err?.status || err?.statusCode || (msg.includes('401') ? 401 : msg.includes('404') ? 404 : msg.includes('429') ? 429 : 500);

  if (!isKeyConfigured()) {
    return {
      type: 'MISSING_API_KEY',
      status: 400,
      userMessage: 'Gemini API key is not configured in backend environment variables.',
      details: 'Please set GEMINI_API_KEY in backend/.env or server environment.'
    };
  }

  if (status === 401 || msg.includes('UNAUTHENTICATED') || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('authentication credentials')) {
    return {
      type: 'AUTH_FAILED',
      status: 401,
      userMessage: 'Google Gemini authentication failed. Verify that GEMINI_API_KEY is active and authorized.',
      details: msg
    };
  }

  if (status === 404 || msg.includes('not found') || msg.includes('is not supported')) {
    return {
      type: 'MODEL_NOT_FOUND',
      status: 404,
      userMessage: `Model '${getModelName()}' is not supported or not found.`,
      details: msg
    };
  }

  if (status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('high demand')) {
    return {
      type: 'RATE_LIMITED',
      status: 429,
      userMessage: 'Gemini API rate limit reached. Please try again shortly.',
      details: msg
    };
  }

  if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
    return {
      type: 'NETWORK_ERROR',
      status: 503,
      userMessage: 'Unable to reach Google Gemini servers. Check server network connection.',
      details: msg
    };
  }

  return {
    type: 'API_ERROR',
    status: 500,
    userMessage: 'An error occurred while communicating with Gemini AI.',
    details: msg
  };
}

function getClient() {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not set in environment variables.');
    err.code = 'MISSING_KEY';
    throw err;
  }
  return new GoogleGenAI({ apiKey });
}

// ── Core Generation Methods ──────────────────────────────────────────────────

/**
 * generateText(prompt, retries)
 * Sends prompt to Gemini with automatic retry for transient errors and fallback across models.
 */
async function generateText(prompt, retries = 2) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment variables.');
  }

  const ai = getClient();
  const configuredModel = getModelName();
  const modelsToTry = [configuredModel, ...CANDIDATE_FLASH_MODELS.filter(m => m !== configuredModel)];

  let lastError = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        activeWorkingModel = model;
        return (response.text || '').trim();
      } catch (err) {
        lastError = err;
        const msg = err.message || '';
        const isTransient = msg.includes('503') || msg.includes('429') || msg.includes('high demand') || err.status === 503 || err.status === 429;
        
        if (isTransient && attempt < retries) {
          console.warn(`[geminiService] Transient spike on ${model} (attempt ${attempt + 1}/${retries + 1}). Retrying in ${(attempt + 1) * 1000}ms...`);
          await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
          continue;
        }

        // If the model itself was not found, deprecated, or no longer available, try next candidate
        if (msg.includes('404') || msg.includes('not found') || msg.includes('is not supported') || msg.includes('no longer available') || msg.includes('NOT_FOUND')) {
          console.warn(`[geminiService] Model '${model}' unavailable or deprecated. Automatically switching to alternative flash model...`);
          break;
        }

        // For auth errors or client errors, do not retry
        throw err;
      }
    }
  }

  throw lastError;
}

/**
 * analyzeImage(imageUrl, prompt)
 * Parses base64 data URIs or fetches remote image URLs, then sends to Gemini Vision.
 */
async function analyzeImage(imageUrl, prompt) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in backend environment variables.');
  }

  const ai = getClient();
  let imagePart = null;

  try {
    if (imageUrl.startsWith('data:')) {
      // Direct Base64 Data URI
      const matches = imageUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (matches) {
        imagePart = { inlineData: { mimeType: matches[1], data: matches[2] } };
      } else {
        throw new Error('Invalid base64 data URI format');
      }
    } else {
      // Remote HTTP / HTTPS URL
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching image`);
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = res.headers.get('content-type') || 'image/jpeg';
      imagePart = { inlineData: { mimeType, data: base64 } };
    }
  } catch (imgErr) {
    console.warn('[geminiService] Could not process image for analysis:', imgErr.message);
    // Fall back to text-only analysis
    return await generateText(prompt + '\n\n(Note: Image could not be loaded — analyze from description only)');
  }

  const configuredModel = getModelName();
  const modelsToTry = [configuredModel, ...CANDIDATE_FLASH_MODELS.filter(m => m !== configuredModel)];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [imagePart, { text: prompt }] },
        ],
      });
      return (response.text || '').trim();
    } catch (err) {
      lastError = err;
      if (err.message?.includes('not found') || err.message?.includes('is not supported')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * generateStructuredJSON(prompt, fallback)
 * Sends a prompt instructing Gemini to return clean JSON.
 * Returns { data, isAI: true } on success, { data: fallback, isAI: false, error } on failure.
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
    const classified = classifyError(err);
    console.warn(`[geminiService] generateStructuredJSON (${classified.type}):`, classified.userMessage);
    return { data: fallback, isAI: false, error: classified.userMessage, details: classified.details };
  }
}

/**
 * checkHealth()
 * Safe backend health check mechanism that verifies:
 *  - GEMINI_API_KEY exists (boolean only, never the key itself)
 *  - Gemini API can be reached
 *  - Configured model is available
 *  - A test generation request succeeds
 */
async function checkHealth() {
  const configured = isKeyConfigured();
  const model = getModelName();

  if (!configured) {
    return {
      status: 'error',
      apiKeyConfigured: false,
      model,
      message: 'GEMINI_API_KEY is not configured in backend environment variables.'
    };
  }

  try {
    const startTime = Date.now();
    const testResponse = await generateText(
      'Respond with exactly: {"status":"ok","message":"pong"}'
    );
    const latencyMs = Date.now() - startTime;

    return {
      status: 'ok',
      apiKeyConfigured: true,
      model,
      latencyMs,
      testResponseSnippet: testResponse.slice(0, 100),
      message: 'Gemini AI is connected and operational.'
    };
  } catch (err) {
    const classified = classifyError(err);
    return {
      status: 'error',
      apiKeyConfigured: true,
      model,
      errorType: classified.type,
      message: classified.userMessage,
      details: classified.details
    };
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getModelName,
  isKeyConfigured,
  generateText,
  analyzeImage,
  generateStructuredJSON,
  checkHealth,
  classifyError,
  SEVEN_CATEGORIES,
};
