import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { aiAPI } from '../services/api';
import toast from 'react-hot-toast';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', label: 'English' },
  { code: 'hi', name: 'Hindi',   native: 'हिन्दी',  flag: '🇮🇳', label: 'हिन्दी (Hindi)' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ',   flag: '🇮🇳', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'mr', name: 'Marathi', native: 'मराठी',   flag: '🇮🇳', label: 'मराठी (Marathi)' },
];

const CODE_TO_NAME = {
  en: 'English',
  hi: 'Hindi',
  kn: 'Kannada',
  mr: 'Marathi',
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    try {
      return localStorage.getItem('kala_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  // In-memory product translation cache: { [productId]: { Hindi: {...}, Kannada: {...}, Marathi: {...} } }
  const cacheRef = useRef({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingProductTitle, setTranslatingProductTitle] = useState('');

  const changeLanguage = (langCode) => {
    if (!CODE_TO_NAME[langCode]) return;
    setCurrentLang(langCode);
    try {
      localStorage.setItem('kala_lang', langCode);
    } catch {
      // Ignore storage errors
    }
  };

  /**
   * translateProductDetails(product, targetLangCode)
   * Translates all product details (name, description, material, craft, bio, care, origin)
   * into target language using Google Gemini AI with automatic caching.
   */
  const translateProductDetails = useCallback(async (product, targetLangCode = currentLang) => {
    if (!product || !product.id) return null;
    if (targetLangCode === 'en') return null; // English is the original

    const langName = CODE_TO_NAME[targetLangCode];
    if (!langName) return null;

    const productId = String(product.id);

    // 1. Check in-memory cache for instant zero-latency return
    if (cacheRef.current[productId] && cacheRef.current[productId][langName]) {
      return cacheRef.current[productId][langName];
    }

    // 2. Call backend Gemini AI translation service
    setIsTranslating(true);
    setTranslatingProductTitle(product.name || 'Product');
    try {
      const payload = {
        productId: product.id,
        targetLanguage: langName,
        productData: {
          name: product.name,
          description: product.description || product.short_description || '',
          short_description: product.short_description || '',
          material: product.material || '',
          craft_technique: product.craft_technique || '',
          artisan_bio: product.artisan_profiles?.bio || product.artisan_bio || '',
          care_instructions: product.care_instructions || '',
          state_of_origin: product.state_of_origin || '',
          category: product.category || '',
        },
      };

      const res = await aiAPI.translateProduct(payload);
      const data = res?.data;

      if (data?.translations) {
        cacheRef.current[productId] = {
          ...(cacheRef.current[productId] || {}),
          ...data.translations,
        };
      }

      const translated =
        data?.translations?.[langName] ||
        data?.translation ||
        cacheRef.current[productId]?.[langName];

      if (translated) {
        return translated;
      }
      return null;
    } catch (err) {
      console.warn('[LanguageContext] Translation notice:', err.message);
      // Return safe fallback rather than null so UI doesn't crash or show error toast
      const fallback = {
        name: product.name,
        description: product.description || product.short_description || '',
        short_description: product.short_description || '',
        material: product.material || '',
        craft_technique: product.craft_technique || '',
        artisan_bio: product.artisan_profiles?.bio || product.artisan_bio || '',
        care_instructions: product.care_instructions || '',
        state_of_origin: product.state_of_origin || '',
      };
      return fallback;
    } finally {
      setIsTranslating(false);
      setTranslatingProductTitle('');
    }
  }, [currentLang]);

  const getCachedTranslation = useCallback((productId, targetLangCode = currentLang) => {
    if (!productId || targetLangCode === 'en') return null;
    const langName = CODE_TO_NAME[targetLangCode];
    if (!langName) return null;
    return cacheRef.current[String(productId)]?.[langName] || null;
  }, [currentLang]);

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        setLanguage: changeLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
        translateProductDetails,
        getCachedTranslation,
        isTranslating,
        translatingProductTitle,
        currentLangMeta: SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
