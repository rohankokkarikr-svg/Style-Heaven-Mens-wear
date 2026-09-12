import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { HiGlobeAlt, HiSparkles } from 'react-icons/hi';

export default function LanguageSelector({ variant = 'banner', onSelectLanguage }) {
  const { currentLang, setLanguage, supportedLanguages, isTranslating, translatingProductTitle } = useLanguage();

  const handleSelect = (langCode) => {
    setLanguage(langCode);
    if (onSelectLanguage) {
      onSelectLanguage(langCode);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="relative inline-flex items-center gap-1 bg-dark-800/90 border border-dark-600 rounded-full px-2.5 py-1 text-xs shadow-inner">
        <HiGlobeAlt className="w-3.5 h-3.5 text-gold-400 shrink-0" />
        <select
          value={currentLang}
          onChange={(e) => handleSelect(e.target.value)}
          className="bg-transparent text-gray-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
          aria-label="Select Language"
        >
          {supportedLanguages.map((l) => (
            <option key={l.code} value={l.code} className="bg-dark-900 text-white">
              {l.flag} {l.native}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-r from-dark-800/95 via-dark-850/95 to-dark-800/95 border border-gold-500/35 p-3.5 sm:p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: AI Badge & Label */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center border border-gold-500/40 shadow-sm shrink-0">
            <HiSparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                AI Regional Language Translation
              </span>
              <span className="px-1.5 py-0.2 rounded bg-gold-500/20 text-gold-400 font-bold text-[9px] uppercase tracking-wider border border-gold-500/30">
                Gemini AI
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Translate all product details, craft heritage & materials to your preferred language:
            </p>
          </div>
        </div>

        {/* Right: Language Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {supportedLanguages.map((l) => {
            const isActive = currentLang === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                disabled={isTranslating && currentLang === l.code}
                className={`group px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-dark-950 font-bold shadow-lg shadow-gold-500/25 scale-[1.02] border border-gold-400'
                    : 'bg-dark-900/80 hover:bg-dark-700/80 text-gray-300 hover:text-white border border-dark-700 hover:border-gold-500/40'
                }`}
              >
                <span className="text-sm">{l.flag}</span>
                <span>{l.native}</span>
                {l.code !== 'en' && !isActive && (
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-300">
                    ({l.name})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Translating Indicator State */}
      {isTranslating && (
        <div className="mt-3 pt-2.5 border-t border-dark-700/60 flex items-center justify-between text-xs text-gold-400 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>
              Translating "{translatingProductTitle}" to{' '}
              <strong className="text-white">
                {supportedLanguages.find((l) => l.code === currentLang)?.native}
              </strong>{' '}
              using Gemini AI...
            </span>
          </div>
          <span className="text-[10px] text-gray-400 hidden sm:inline">Preserving handcrafted cultural heritage</span>
        </div>
      )}
    </div>
  );
}
