import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowRight, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useSettings, DEFAULT_HERO_SLIDES } from '../context/SettingsContext';

const textVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

export default function HeroSlider() {
  const { settings } = useSettings();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Normalize slides from settings or fallback
  const activeSlides = useMemo(() => {
    const rawList = Array.isArray(settings?.heroSlides) && settings.heroSlides.length > 0
      ? settings.heroSlides
      : DEFAULT_HERO_SLIDES;

    return rawList.map((s, idx) => ({
      id: s.id || idx + 1,
      image: s.image || '',
      headline: s.headline || '',
      subtitle: s.subtitle || '',
      buttonText: s.buttonText || 'Explore Now',
      buttonLink: s.buttonLink || '/products',
      align: s.align || 'left',
      badge: (s.badgeText || s.badge?.text) ? {
        text: s.badgeText || s.badge?.text,
        type: s.badgeType || s.badge?.type || 'new'
      } : null,
    }));
  }, [settings?.heroSlides]);

  // Keep index within bounds if activeSlides length changes
  useEffect(() => {
    if (current >= activeSlides.length) {
      setCurrent(0);
    }
  }, [activeSlides.length, current]);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % (activeSlides.length || 1));
    }, 5000);
  }, [activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length > 0 && !isPaused) {
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [activeSlides.length, isPaused, startTimer]);

  const goTo = (index) => {
    clearInterval(timerRef.current);
    setCurrent(index);
    if (!isPaused) startTimer();
  };

  const prev = () => {
    clearInterval(timerRef.current);
    setCurrent((c) => (c - 1 + activeSlides.length) % activeSlides.length);
    if (!isPaused) startTimer();
  };

  const next = () => {
    clearInterval(timerRef.current);
    setCurrent((c) => (c + 1) % activeSlides.length);
    if (!isPaused) startTimer();
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      next();
    } else if (isRightSwipe) {
      prev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (!activeSlides.length) return null;
  const slide = activeSlides[current] || activeSlides[0];

  return (
    <section
      className="relative w-full overflow-hidden bg-black select-none"
      style={{ height: 'min(92vh, 800px)', minHeight: '520px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Slide Images with Zoom Effect ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${slide.id}-${current}`}
          className="absolute inset-0"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        >
          <img
            src={slide.image}
            alt={slide.headline}
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          {/* Multi-layer dark gradient overlay for optimal readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          {/* Animated gold shimmer line at top */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Slide Content ── */}
      <div
        className={`absolute inset-0 flex items-center z-10 px-5 sm:px-10 md:px-16 lg:px-24 ${
          slide.align === 'center' ? 'justify-center text-center' : 'justify-start text-left'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slide.id}-${current}`}
            className="max-w-2xl pt-2 sm:pt-0"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Badge */}
            {slide.badge && (
              <motion.div custom={0} variants={textVariants} className="mb-3 sm:mb-5">
                <span
                  className={`inline-block px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] rounded-full border backdrop-blur-sm ${
                    slide.badge.type === 'sale'
                      ? 'border-red-400/60 bg-red-500/20 text-red-300'
                      : 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {slide.badge.text}
                </span>
              </motion.div>
            )}

            {/* Headline */}
            <motion.h1
              custom={slide.badge ? 1 : 0}
              variants={textVariants}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.15] sm:leading-[1.08] tracking-tight mb-3 sm:mb-5 drop-shadow-md"
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
            >
              {slide.headline.split(' ').map((word, i) =>
                i === slide.headline.split(' ').length - 1 ? (
                  <span key={i} className="text-gold-400">{word} </span>
                ) : (
                  <span key={i}>{word} </span>
                )
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              custom={slide.badge ? 2 : 1}
              variants={textVariants}
              className="text-gray-200 text-xs sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 max-w-lg line-clamp-3 sm:line-clamp-none drop-shadow"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {slide.subtitle}
            </motion.p>

            {/* Divider line */}
            <motion.div
              custom={slide.badge ? 2.5 : 1.5}
              variants={textVariants}
              className={`h-px w-16 sm:w-20 mb-6 sm:mb-8 ${slide.align === 'center' ? 'mx-auto' : ''}`}
              style={{ background: 'linear-gradient(90deg, #C9A84C, transparent)' }}
            />

            {/* CTA Button */}
            <motion.div custom={slide.badge ? 3 : 2} variants={textVariants}>
              <Link
                to={slide.buttonLink}
                className="group inline-flex items-center gap-2.5 px-6 py-3 sm:px-8 sm:py-4 font-semibold text-xs sm:text-sm uppercase tracking-[0.15em] rounded-full transition-all duration-300 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #E8C96B)',
                  color: '#0a0a0a',
                  boxShadow: '0 0 25px rgba(201,168,76,0.35)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 45px rgba(201,168,76,0.65)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(201,168,76,0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>{slide.buttonText}</span>
                <HiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Slide Counter (top-right) ── */}
      <div className="absolute top-4 sm:top-6 right-5 sm:right-8 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
        <span className="text-amber-400 font-bold text-sm sm:text-base font-serif">
          {String(current + 1).padStart(2, '0')}
        </span>
        <span className="text-gray-500 text-xs">/</span>
        <span className="text-gray-300 text-xs">{String(activeSlides.length).padStart(2, '0')}</span>
      </div>

      {/* ── Navigation Arrows (Desktop / Tablet only to prevent mobile text overlap) ── */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 bg-black/50 backdrop-blur-md hidden md:flex items-center justify-center text-white hover:bg-amber-500/30 hover:border-amber-400/60 transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <HiChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 bg-black/50 backdrop-blur-md hidden md:flex items-center justify-center text-white hover:bg-amber-500/30 hover:border-amber-400/60 transition-all duration-300 hover:scale-110 active:scale-95"
      >
        <HiChevronRight className="w-5 h-5" />
      </button>

      {/* ── Dot Indicators ── */}
      <div className="absolute bottom-10 sm:bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="p-1 transition-all duration-300"
          >
            <span
              className={`block rounded-full transition-all duration-500 ${
                i === current
                  ? 'w-6 sm:w-8 h-2 bg-amber-400 shadow-[0_0_10px_#C9A84C]'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          </button>
        ))}
      </div>

      {/* ── Progress Bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-20">
        <motion.div
          key={`bar-${current}`}
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #C9A84C, #E8C96B)' }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
        />
      </div>

      {/* ── Scroll-down Indicator (Desktop only to prevent mobile clutter) ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-1">
        <span className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">Scroll</span>
        <motion.div
          className="w-px h-6 bg-gradient-to-b from-amber-400 to-transparent"
          animate={{ scaleY: [1, 0.3, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Brand Watermark (bottom-left) ── */}
      <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-8 z-20 hidden sm:block">
        <div className="backdrop-blur-md bg-black/30 border border-white/10 rounded-lg px-2.5 py-1">
          <p className="text-[9px] text-gray-400 uppercase tracking-[0.25em] font-medium">KalaStyle AI</p>
        </div>
      </div>
    </section>
  );
}
