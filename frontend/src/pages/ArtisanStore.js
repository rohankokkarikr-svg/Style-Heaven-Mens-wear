import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { artisanAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import Footer from '../components/Footer';
import { HiLocationMarker, HiArrowLeft } from 'react-icons/hi';

export default function ArtisanStore() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    artisanAPI.getById(id).then(({ data }) => { setData(data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <div className="shimmer h-48 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">{[1,2,3,4].map(i => <ProductCardSkeleton key={i} />)}</div>
    </div>
  );

  if (!data?.profile) return (
    <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4">
      <div className="text-6xl">🎨</div>
      <h2 className="text-xl font-semibold text-white">Artisan not found</h2>
      <Link to="/products" className="btn-outline">Browse Products</Link>
    </div>
  );

  const { profile, products } = data;

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 border-b border-dark-600 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Link to="/products" className="inline-flex items-center gap-2 text-gray-400 hover:text-gold-400 text-sm mb-8 transition-colors"><HiArrowLeft className="w-4 h-4" /> Back to Products</Link>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-luxury flex items-center justify-center text-dark-900 font-bold text-4xl md:text-5xl ring-4 ring-gold-500/40 shrink-0">
              {(profile.store_name || 'A')[0].toUpperCase()}
            </div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">{profile.store_name}</h1>
                {profile.verification_status === 'verified' && (
                  <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">✓ Verified Artisan</span>
                )}
              </div>
              {profile.specialization && <p className="text-gold-400 text-lg mt-1">🧵 {profile.specialization}</p>}
              {profile.location && <p className="text-gray-400 mt-1 flex items-center justify-center sm:justify-start gap-1"><HiLocationMarker className="w-4 h-4 text-gold-500" />{profile.location}</p>}
              {profile.artisan_type && <p className="text-gray-500 text-sm mt-1">{profile.artisan_type}</p>}
              {profile.bio && <p className="text-gray-300 mt-4 max-w-2xl leading-relaxed text-sm md:text-base">{profile.bio}</p>}
              <div className="flex items-center justify-center sm:justify-start gap-6 mt-4 text-sm text-gray-400">
                <div className="text-center"><p className="text-xl font-bold text-white">{products.length}</p><p>Products</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl font-serif font-bold text-white mb-8">
          Products by {profile.store_name}
          <div className="h-1 w-16 bg-gold-500 rounded-full mt-2" />
        </h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <p>No products listed yet. Check back soon!</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
