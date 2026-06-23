import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiTruck, HiShieldCheck, HiRefresh, HiArrowRight, HiTag } from 'react-icons/hi';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import HeroSlider from '../components/HeroSlider';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discountBanner, setDiscountBanner] = useState({
    title: 'Summer Sale Live',
    description: 'Use this code and get upto 30% discount',
    discount: '30%',
    code: 'SUMMER30',
    discountPercentage: 30,
    buttonText: 'Grab the Deal',
    buttonLink: '/products',
    isActive: true
  });

  useEffect(() => {
    // Load discount banner from localStorage
    const savedBannerStr = localStorage.getItem('discountBanner');
    if (savedBannerStr) {
      let savedBanner = JSON.parse(savedBannerStr);
      // Automatically update the description if it's the old default
      if (savedBanner.description === 'Up to 30% Off on Premium Collection') {
        savedBanner.description = 'Use this code and get upto 30% discount';
        localStorage.setItem('discountBanner', JSON.stringify(savedBanner));
      }
      setDiscountBanner(savedBanner);
    }

    const fetchFeatured = async () => {
      try {
        const { data } = await productAPI.getFeatured();
        setFeatured(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Featured products fetch failed:', err);
        const errorMsg = err.response?.data?.error || err.message || 'Failed to load featured products';
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const features = [
    { icon: HiTruck, title: 'Free Shipping', desc: 'On orders over ₹2000' },
    { icon: HiShieldCheck, title: 'Secure Payment', desc: '100% secure checkout' },
    { icon: HiRefresh, title: 'Easy Returns', desc: '7 days return policy' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Features Bar */}
      <section className="bg-dark-800 border-y border-dark-600 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="flex items-center justify-center gap-4 text-center md:text-left">
                <f.icon className="w-10 h-10 text-gold-500" />
                <div>
                  <h3 className="font-semibold text-white text-lg">{f.title}</h3>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="section-title mb-4">Shop by Category</h2>
            <div className="h-1 w-20 bg-gold-500 mx-auto rounded-full" />
            <p className="text-gray-400 mt-4 text-sm">Explore our full range of premium menswear</p>
          </motion.div>

          {/* Top row — 2 large hero cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[
              { name: 'T-Shirts',  slug: 'T-Shirts',  img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop', desc: '18 styles · Casual & gym wear' },
              { name: 'Shirts',    slug: 'Shirts',    img: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop', desc: '18 styles · Formal & casual' },
            ].map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/products?category=${cat.slug}`} className="group relative h-80 overflow-hidden rounded-xl block">
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent group-hover:from-dark-900/60 transition-all duration-500 z-10" />
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute bottom-6 left-6 z-20">
                    <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-1">{cat.desc}</p>
                    <h3 className="text-3xl font-serif font-bold text-white mb-2">{cat.name}</h3>
                    <span className="text-gray-300 group-hover:text-gold-400 flex items-center gap-2 font-medium text-sm transition-colors">
                      Explore Collection <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Bottom row — 6 smaller cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Pants',        slug: 'Pants',        img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop', desc: '14 styles' },
              { name: 'Jeans',        slug: 'Jeans',        img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop', desc: '14 styles' },
              { name: 'Jackets',      slug: 'Jackets',      img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop', desc: '14 styles' },
              { name: 'Suits',        slug: 'Suits',        img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop', desc: '8 styles' },
              { name: 'Kurtas',       slug: 'Kurtas',       img: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&auto=format&fit=crop', desc: '12 styles' },
              { name: 'Accessories',  slug: 'Accessories',  img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop', desc: '14 styles' },
            ].map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
              >
                <Link to={`/products?category=${cat.slug}`} className="group relative h-52 overflow-hidden rounded-xl block">
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/85 via-dark-900/20 to-transparent group-hover:from-dark-900/60 transition-all duration-500 z-10" />
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute bottom-4 left-4 z-20">
                    <p className="text-gold-400 text-[10px] font-semibold uppercase tracking-widest mb-0.5">{cat.desc}</p>
                    <h3 className="text-base font-serif font-bold text-white mb-1">{cat.name}</h3>
                    <span className="text-gray-300 group-hover:text-gold-400 flex items-center gap-1 font-medium text-[11px] transition-colors">
                      Shop Now <HiArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="section-title mb-4">New Arrivals</h2>
              <div className="h-1 w-20 bg-gold-500 rounded-full" />
            </div>
            <Link to="/products" className="text-gold-400 hover:text-gold-300 font-medium hidden md:block">
              View All Products
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : featured.length > 0 ? (
              featured.map((p) => <ProductCard key={p.id} product={p} />)
            ) : (
               <div className="col-span-full text-center text-gray-500 py-10">
                 No products available right now.
               </div>
            )}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/products" className="btn-outline inline-block">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Dynamic Discount Banner */}
      {discountBanner.isActive && (
        <section className="bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 border-y border-dark-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gold-500/10 p-2.5 rounded-lg">
                  <HiTag className="w-6 h-6 text-gold-500" />
                </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-gold-400 font-semibold text-sm md:text-base uppercase tracking-wide">
                      {discountBanner.title}
                    </p>
                    {discountBanner.code && (
                      <div className="flex items-center gap-2 bg-gold-500/20 border border-gold-500/30 px-3 py-1 rounded-full">
                        <span className="text-gold-400 text-xs font-bold uppercase tracking-widest">
                          CODE: {discountBanner.code}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            navigator.clipboard.writeText(discountBanner.code);
                            toast.success('Code copied!');
                          }}
                          className="text-gold-500 hover:text-gold-400 transition-colors"
                          title="Copy Code"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-white text-lg md:text-2xl font-serif font-bold">
                    {discountBanner.description}
                  </p>
              </div>
              <Link
                to={discountBanner.buttonLink}
                className="shrink-0 btn-primary inline-flex items-center gap-2 text-sm md:text-base px-5 md:px-7 py-2.5 md:py-3"
              >
                {discountBanner.buttonText} <HiArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
