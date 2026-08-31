import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowRight, HiSparkles } from 'react-icons/hi';
import { HANDICRAFT_CATEGORIES } from '../constants/handicraftsData';

export default function IndianHandicraftsSection() {
  return (
    <section className="py-20 bg-dark-900 relative overflow-hidden border-b border-dark-700">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <span>🇮🇳</span>
            <span>Heritage of India</span>
            <HiSparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
            Explore Indian Handicrafts
          </h2>
          <div className="h-1 w-24 bg-gradient-luxury mx-auto rounded-full mt-4 mb-4" />
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Discover authentic handcrafted masterpieces made with centuries of traditional craftsmanship by master artisans across India.
          </p>
        </motion.div>

        {/* 7 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {HANDICRAFT_CATEGORIES.map((cat, index) => {
            const isFeatured = index === 0; // Feature the primary Handloom category with double span on larger screens if needed
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`group relative rounded-2xl overflow-hidden border border-dark-600 bg-dark-800 hover:border-gold-500/60 transition-all duration-500 hover:shadow-gold hover:shadow-gold/20 flex flex-col justify-between ${
                  isFeatured ? 'sm:col-span-2 lg:col-span-1 xl:col-span-2' : ''
                }`}
              >
                {/* Background Image Container */}
                <div className={`relative overflow-hidden ${isFeatured ? 'h-64 sm:h-72' : 'h-56'}`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop';
                    }}
                  />
                  {/* Atmospheric Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <span className="w-10 h-10 rounded-xl bg-dark-900/85 backdrop-blur-md border border-dark-600 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-dark-900/90 backdrop-blur-md text-gold-400 border border-gold-500/30 shadow-md">
                      {cat.productCount} Products
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between -mt-8 relative z-20">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white group-hover:text-gold-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed line-clamp-2">
                      {cat.shortDesc}
                    </p>
                  </div>

                  {/* Explore Button */}
                  <div className="mt-6 pt-4 border-t border-dark-700/60 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">100% Authentic Indian Craft</span>
                    <Link
                      to={`/products?category=${encodeURIComponent(cat.slug)}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-gold-400 group-hover:text-gold-300 transition-colors"
                    >
                      <span>Explore Category</span>
                      <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
