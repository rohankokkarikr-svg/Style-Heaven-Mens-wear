import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { productAPI } from '../services/api';
import { HANDICRAFT_CATEGORIES, HANDICRAFT_PRODUCTS } from '../constants/handicraftsData';
import {
  HiFilter,
  HiX,
  HiSearch,
  HiStar,
  HiSparkles,
  HiRefresh,
  HiChevronRight
} from 'react-icons/hi';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';

  // Local Filter States
  const [sort, setSort] = useState('popular');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [internalSearch, setInternalSearch] = useState(searchQuery);

  // Sync internal search when URL changes
  useEffect(() => {
    setInternalSearch(searchQuery);
  }, [searchQuery]);

  // Fetch from API with reliable fallback to full authentic handicrafts data
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeCategory && activeCategory !== 'all') params.category = activeCategory;
        if (searchQuery) params.search = searchQuery;

        const { data } = await productAPI.getAll(params);
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          // Use client handicraft dataset
          setProducts(HANDICRAFT_PRODUCTS);
        }
      } catch (err) {
        console.warn('Backend products fetch notice, using handicraft catalog:', err.message);
        setProducts(HANDICRAFT_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeCategory, searchQuery]);

  // Find active category details for Banner
  const currentCategoryInfo = useMemo(() => {
    return (
      HANDICRAFT_CATEGORIES.find(
        (c) =>
          c.slug.toLowerCase() === activeCategory.toLowerCase() ||
          c.name.toLowerCase() === activeCategory.toLowerCase()
      ) || null
    );
  }, [activeCategory]);

  // Comprehensive Filtering & Sorting Logic
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    // 1. Category Filter
    if (activeCategory && activeCategory !== 'all') {
      list = list.filter(
        (p) =>
          (p.category || '').toLowerCase() === activeCategory.toLowerCase() ||
          (p.subcategory || '').toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // 2. Search Query (Name, Category, Material, Craft technique, Artisan name, State of Origin)
    const term = (searchQuery || internalSearch || '').trim().toLowerCase();
    if (term) {
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const sub = (p.subcategory || '').toLowerCase();
        const mat = (p.material || '').toLowerCase();
        const craft = (p.craft_technique || '').toLowerCase();
        const art = (p.artisan_name || p.artisan_profiles?.store_name || '').toLowerCase();
        const state = (p.state_of_origin || p.artisan_location || '').toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';

        return (
          name.includes(term) ||
          cat.includes(term) ||
          sub.includes(term) ||
          mat.includes(term) ||
          craft.includes(term) ||
          art.includes(term) ||
          state.includes(term) ||
          tags.includes(term)
        );
      });
    }

    // 3. Price Range Filter
    if (selectedPriceRange !== 'all') {
      if (selectedPriceRange === '0-500') list = list.filter((p) => p.price <= 500);
      else if (selectedPriceRange === '500-1000') list = list.filter((p) => p.price > 500 && p.price <= 1000);
      else if (selectedPriceRange === '1000-5000') list = list.filter((p) => p.price > 1000 && p.price <= 5000);
      else if (selectedPriceRange === '5000-10000') list = list.filter((p) => p.price > 5000 && p.price <= 10000);
      else if (selectedPriceRange === '10000+') list = list.filter((p) => p.price > 10000);
    }

    // 4. Rating Filter
    if (selectedRating > 0) {
      list = list.filter((p) => (p.rating || 4.8) >= selectedRating);
    }

    // 5. Material Filter
    if (selectedMaterial !== 'all') {
      list = list.filter((p) =>
        (p.material || '').toLowerCase().includes(selectedMaterial.toLowerCase())
      );
    }

    // 6. Availability Filter
    if (selectedAvailability === 'in_stock') {
      list = list.filter((p) => p.is_in_stock !== false && (p.stock_quantity === undefined || p.stock_quantity > 0));
    } else if (selectedAvailability === 'out_of_stock') {
      list = list.filter((p) => p.is_in_stock === false || p.stock_quantity <= 0);
    }

    // 7. Discount Filter
    if (selectedDiscount > 0) {
      list = list.filter((p) => {
        const disc =
          p.discount_percentage ||
          (p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0);
        return disc >= selectedDiscount;
      });
    }

    // 8. Sorting
    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sort === 'discount') {
      list.sort((a, b) => (b.discount_percentage || 0) - (a.discount_percentage || 0));
    } else if (sort === 'popular') {
      list.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    } else {
      // newest
      list.sort((a, b) => (b.id > a.id ? 1 : -1));
    }

    return list;
  }, [
    products,
    activeCategory,
    searchQuery,
    internalSearch,
    selectedPriceRange,
    selectedRating,
    selectedMaterial,
    selectedAvailability,
    selectedDiscount,
    sort
  ]);

  const handleCategorySelect = (slug) => {
    if (slug === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?category=${encodeURIComponent(slug)}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (internalSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(internalSearch.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const clearAllFilters = () => {
    setSelectedPriceRange('all');
    setSelectedRating(0);
    setSelectedMaterial('all');
    setSelectedAvailability('all');
    setSelectedDiscount(0);
    setInternalSearch('');
    navigate('/products');
  };

  const materialsList = ['Cotton', 'Silk', 'Wood', 'Clay', 'Bamboo', 'Jute', 'Brass', 'Silver', 'Wool', 'Ceramic'];

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      {/* Breadcrumb Navigation */}
      <div className="bg-dark-950/60 border-b border-dark-700/60 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-xs text-gray-400">
            <Link to="/" className="hover:text-gold-400 transition-colors">Home</Link>
            <HiChevronRight className="w-3.5 h-3.5 text-gray-600" />
            <Link to="/products" className="hover:text-gold-400 transition-colors">Categories</Link>
            {activeCategory && activeCategory !== 'all' && (
              <>
                <HiChevronRight className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-gold-400 font-medium">
                  {currentCategoryInfo ? currentCategoryInfo.name : activeCategory}
                </span>
              </>
            )}
            {searchQuery && (
              <>
                <HiChevronRight className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-gray-200">Search: "{searchQuery}"</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Category Hero Banner */}
      <div className="relative bg-dark-800 border-b border-dark-700 overflow-hidden">
        {currentCategoryInfo ? (
          <div className="relative h-64 sm:h-80 overflow-hidden flex items-center">
            <img
              src={currentCategoryInfo.bannerImage || currentCategoryInfo.image}
              alt={currentCategoryInfo.name}
              className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-transparent" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
              <div className="max-w-2xl">
                <span className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-2 block">
                  Indian Handicraft Collection
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
                  {currentCategoryInfo.name}
                </h1>
                <p className="text-gray-300 text-sm sm:text-base mt-2.5 leading-relaxed">
                  {currentCategoryInfo.shortDesc}
                </p>
                <div className="flex items-center gap-3 mt-4 text-xs font-semibold text-gold-400">
                  <span className="px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30">
                    {filteredAndSortedProducts.length} Artisanal Products Available
                  </span>
                  <span>•</span>
                  <span>100% Certified Authentic</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 bg-gradient-to-b from-dark-950 to-dark-900 border-b border-dark-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                    Explore Indian Handicrafts
                  </h1>
                  <p className="text-gray-400 text-sm mt-2">
                    Browse handloom textiles, home décor, brass jewelry, pottery, and folk art.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        {/* Results count & Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-800 p-4 rounded-2xl border border-dark-700 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              Showing <span className="text-gold-400">{filteredAndSortedProducts.length}</span> Products
            </span>
            {(activeCategory !== 'all' || searchQuery || selectedPriceRange !== 'all' || selectedMaterial !== 'all') && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium underline"
              >
                <HiRefresh className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setFilterOpen(true)}
              className="lg:hidden btn-outline flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 text-xs"
            >
              <HiFilter className="w-4 h-4" />
              <span>Filters & Sort</span>
            </button>

            {/* Sorting */}
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <span className="text-xs text-gray-400 hidden sm:inline whitespace-nowrap">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-dark-900 border border-dark-600 focus:border-gold-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none w-full sm:w-48"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest Arrivals</option>
                <option value="rating">Best Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout: Sidebar Filter + Responsive Product Grid */}
        <div className="flex gap-8 items-start">
          {/* Filter Sidebar (Desktop Sticky + Mobile Drawer) */}
          <aside
            className={`
              fixed inset-0 z-50 bg-dark-950/95 backdrop-blur-md p-6 overflow-y-auto transform transition-transform duration-300
              lg:sticky lg:top-24 lg:z-10 lg:translate-x-0 lg:bg-dark-800 lg:p-6 lg:rounded-2xl lg:border lg:border-dark-700 lg:w-72 lg:block
              ${filterOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            {/* Mobile Header */}
            <div className="flex justify-between items-center lg:hidden pb-4 mb-6 border-b border-dark-700">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HiFilter className="text-gold-400" /> Filter & Refine
              </h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <HiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 text-sm">
              {/* 1. Category Filter */}
              <div>
                <h3 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-3 text-gold-400">
                  Categories
                </h3>
                <ul className="space-y-1.5">
                  <li>
                    <button
                      onClick={() => handleCategorySelect('all')}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        activeCategory === 'all'
                          ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                          : 'text-gray-300 hover:bg-dark-700/60'
                      }`}
                    >
                      All Categories
                    </button>
                  </li>
                  {HANDICRAFT_CATEGORIES.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => handleCategorySelect(cat.slug)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                          activeCategory.toLowerCase() === cat.slug.toLowerCase()
                            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                            : 'text-gray-300 hover:bg-dark-700/60'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-[10px] text-gray-500">({cat.productCount})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Price Range */}
              <div className="pt-4 border-t border-dark-700/80">
                <h3 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-3 text-gold-400">
                  Price Range
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'all', label: 'All Prices' },
                    { id: '0-500', label: 'Under ₹500' },
                    { id: '500-1000', label: '₹500 – ₹1,000' },
                    { id: '1000-5000', label: '₹1,000 – ₹5,000' },
                    { id: '5000-10000', label: '₹5,000 – ₹10,000' },
                    { id: '10000+', label: '₹10,000+' }
                  ].map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 text-xs text-gray-300 hover:text-white cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="price_range"
                        checked={selectedPriceRange === p.id}
                        onChange={() => setSelectedPriceRange(p.id)}
                        className="accent-gold-500"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Rating */}
              <div className="pt-4 border-t border-dark-700/80">
                <h3 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-3 text-gold-400">
                  Customer Rating
                </h3>
                <div className="space-y-2">
                  {[
                    { val: 0, label: 'All Ratings' },
                    { val: 4, label: '⭐ 4.0 & above' },
                    { val: 3, label: '⭐ 3.0 & above' },
                    { val: 2, label: '⭐ 2.0 & above' }
                  ].map((r) => (
                    <label
                      key={r.val}
                      className="flex items-center gap-2.5 text-xs text-gray-300 hover:text-white cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === r.val}
                        onChange={() => setSelectedRating(r.val)}
                        className="accent-gold-500"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Material */}
              <div className="pt-4 border-t border-dark-700/80">
                <h3 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-3 text-gold-400">
                  Craft Material
                </h3>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="all">All Materials</option>
                  {materialsList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Discount Filter */}
              <div className="pt-4 border-t border-dark-700/80">
                <h3 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-3 text-gold-400">
                  Discount
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 0, label: 'Any' },
                    { val: 10, label: '10%+ Off' },
                    { val: 20, label: '20%+ Off' },
                    { val: 30, label: '30%+ Off' },
                    { val: 50, label: '50%+ Off' }
                  ].map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => setSelectedDiscount(d.val)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedDiscount === d.val
                          ? 'bg-red-600 text-white border-red-500 shadow-sm'
                          : 'bg-dark-900 border-dark-600 text-gray-400 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Availability */}
              <div className="pt-4 border-t border-dark-700/80">
                <h3 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-3 text-gold-400">
                  Availability
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'all', label: 'All Items' },
                    { id: 'in_stock', label: 'In Stock Only' },
                    { id: 'out_of_stock', label: 'Out of Stock' }
                  ].map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-2.5 text-xs text-gray-300 hover:text-white cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="availability"
                        checked={selectedAvailability === a.id}
                        onChange={() => setSelectedAvailability(a.id)}
                        className="accent-gold-500"
                      />
                      <span>{a.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={clearAllFilters}
                className="w-full btn-outline py-2 text-xs font-semibold mt-4"
              >
                Reset All Filters
              </button>
            </div>
          </aside>

          {/* Product Grid Area (4 cols desktop, 2-3 cols tablet, 2 cols mobile) */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredAndSortedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              /* No Products Found Empty State */
              <div className="text-center py-20 bg-dark-800 rounded-3xl border border-dark-700 p-8 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-4 text-3xl text-gold-400">
                  🔍
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">
                  No products found
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  No products found. Try searching for another handicraft, adjusting your filters, or browsing our full collection.
                </p>
                <button onClick={clearAllFilters} className="btn-gold px-6 py-2.5 text-xs font-semibold">
                  View All Handicrafts
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
