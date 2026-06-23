import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowRight, HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const DEFAULT_SLIDES = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336522/style-heaven-assets/hero_slide_1.png',
    badge: null,
    headline: 'Redefine Your Style',
    subtitle: 'Premium menswear collection crafted for modern gentlemen.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    align: 'left',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336524/style-heaven-assets/hero_slide_2.png',
    badge: { text: '✦ New Arrival', type: 'new' },
    headline: 'Summer Collection 2026',
    subtitle: 'Fresh arrivals with trending fashion styles.',
    buttonText: 'Explore Collection',
    buttonLink: '/products?category=shirts',
    align: 'center',
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336525/style-heaven-assets/hero_slide_3.png',
    badge: null,
    headline: 'Classic Meets Modern',
    subtitle: 'Elegant outfits for every occasion.',
    buttonText: 'View Products',
    buttonLink: '/products',
    align: 'left',
  },
  {
    id: 4,
    image: 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336527/style-heaven-assets/hero_slide_4.png',
    badge: { text: '★ Limited Edition', type: 'sale' },
    headline: 'Luxury You Can Wear',
    subtitle: 'Discover exclusive fashion with premium quality.',
    buttonText: 'Discover More',
    buttonLink: '/products',
    align: 'center',
  },
];

const textVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function HeroSlider() {
  const [activeSlides, setActiveSlides] = useState(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('heroSlides');
    if (saved) {
      let parsed = JSON.parse(saved);
      
      // Auto-migrate old local paths to Cloudinary
      const pathMap = {
        '/hero_slide_1.png': 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336522/style-heaven-assets/hero_slide_1.png',
        '/hero_slide_2.png': 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336524/style-heaven-assets/hero_slide_2.png',
        '/hero_slide_3.png': 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336525/style-heaven-assets/hero_slide_3.png',
        '/hero_slide_4.png': 'https://res.cloudinary.com/dcmmxmikz/image/upload/v1778336527/style-heaven-assets/hero_slide_4.png'
      };

      let needsUpdate = false;
      const migrated = parsed.map(s => {
        if (pathMap[s.image]) {
          needsUpdate = true;
          return { ...s, image: pathMap[s.image] };
        }
        return s;
      });

      if (needsUpdate) {
        localStorage.setItem('heroSlides', JSON.stringify(migrated));
        parsed = migrated;
      }

      // Map admin settings to slider format
      const formatted = parsed.map(s => ({
        ...s,
        badge: s.badgeText ? { text: s.badgeText, type: s.badgeType || 'new' } : null
      }));
      setActiveSlides(formatted);
    }
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 4500);
  };

  useEffect(() => {
    if (activeSlides.length > 0) {
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [activeSlides]);

  const goTo = (index) => {
    clearInterval(timerRef.current);
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
    startTimer();
  };

  const prev = () => {
    clearInterval(timerRef.current);
    setDirection(-1);
    setCurrent((c) => (c - 1 + activeSlides.length) % activeSlides.length);
    startTimer();
  };

  const next = () => {
    clearInterval(timerRef.current);
    setDirection(1);
    setCurrent((c) => (c + 1) % activeSlides.length);
    startTimer();
  };

  if (!activeSlides.length) return null;
  const slide = activeSlides[current];

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      style={{ height: 'min(100vh, 820px)', minHeight: '560px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Slide Images with Zoom Effect ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${current}`}
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
          {/* Multi-layer dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
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
        className={`absolute inset-0 flex items-center z-10 px-6 sm:px-12 md:px-20 lg:px-28 ${
          slide.align === 'center' ? 'justify-center text-center' : 'justify-start text-left'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${current}`}
            className="max-w-2xl"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Badge */}
            {slide.badge && (
              <motion.div custom={0} variants={textVariants} className="mb-5">
                <span
                  className={`inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] rounded-full border backdrop-blur-sm ${
                    slide.badge.type === 'sale'
                      ? 'border-red-400/60 bg-red-500/15 text-red-300'
                      : 'border-amber-400/60 bg-amber-500/15 text-amber-300'
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
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-5"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {slide.headline.split(' ').map((word, i) =>
                i === slide.headline.split(' ').length - 1 ? (
                  <span key={i} style={{ color: '#C9A84C' }}>{word} </span>
                ) : (
                  <span key={i}>{word} </span>
                )
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              custom={slide.badge ? 2 : 1}
              variants={textVariants}
              className="text-gray-300 text-base sm:text-lg md:text-xl leading-relaxed mb-8 max-w-lg"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {slide.subtitle}
            </motion.p>

            {/* Divider line */}
            <motion.div
              custom={slide.badge ? 2.5 : 1.5}
              variants={textVariants}
              className="h-px w-20 mb-8"
              style={{ background: 'linear-gradient(90deg, #C9A84C, transparent)' }}
            />

            {/* CTA Button */}
            <motion.div custom={slide.badge ? 3 : 2} variants={textVariants}>
              <Link
                to={slide.buttonLink}
                className="group inline-flex items-center gap-3 px-8 py-4 font-semibold text-sm uppercase tracking-[0.15em] rounded-full transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #E8C96B)',
                  color: '#0a0a0a',
                  boxShadow: '0 0 30px rgba(201,168,76,0.35)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 50px rgba(201,168,76,0.65)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(201,168,76,0.35)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {slide.buttonText}
                <HiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Slide Counter (top-right) ── */}
      <div className="absolute top-6 right-8 z-20 hidden md:flex items-center gap-2">
        <span className="text-amber-400 font-bold text-lg" style={{ fontFamily: 'serif' }}>
          {String(current + 1).padStart(2, '0')}
        </span>
        <span className="text-gray-500 text-sm">/</span>
        <span className="text-gray-400 text-sm">{String(activeSlides.length).padStart(2, '0')}</span>
      </div>

      {/* ── Navigation Arrows ── */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-amber-500/20 hover:border-amber-400/50 transition-all duration-300 hover:scale-110"
      >
        <HiChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-amber-500/20 hover:border-amber-400/50 transition-all duration-300 hover:scale-110"
      >
        <HiChevronRight className="w-5 h-5" />
      </button>

      {/* ── Dot Indicators ── */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="relative transition-all duration-400"
          >
            <span
              className={`block rounded-full transition-all duration-500 ${
                i === current
                  ? 'w-8 h-2 bg-amber-400'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/60'
              }`}
            />
          </button>
        ))}
      </div>

      {/* ── Progress Bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-20">
        <motion.div
          key={current}
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #C9A84C, #E8C96B)' }}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 4.5, ease: 'linear' }}
        />
      </div>

      {/* ── Scroll-down Indicator ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Scroll</span>
        <motion.div
          className="w-px h-8 bg-gradient-to-b from-amber-400 to-transparent"
          animate={{ scaleY: [1, 0.3, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Glassmorphism Brand Watermark (bottom-left) ── */}
      <div className="absolute bottom-8 left-6 sm:left-10 z-20 hidden sm:block">
        <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium">Style Heaven</p>
        </div>
      </div>
    </section>
  );
}
