import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { productAPI } from '../services/api';
import { HiFilter, HiX } from 'react-icons/hi';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category) params.category = category;
        if (search) params.search = search;
        
        const { data } = await productAPI.getAll(params);
        
        // Client side sorting
        let sorted = [...data];
        if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
        if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
        // newest is default from DB usually
        
        setProducts(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, search, sort]);

  const handleCategoryChange = (c) => {
    if (c === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?category=${c}`);
    }
  };

  const categoryLabels = {
    all:          'All Products',
    'T-Shirts':   'T-Shirts',
    'Shirts':     'Shirts',
    'Pants':      'Pants',
    'Jeans':      'Jeans',
    'Jackets':    'Jackets',
    'Suits':      'Suits',
    'Kurtas':     'Kurtas',
    'Accessories':'Accessories',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white capitalize">
            {search ? `Search: ${search}` : category ? `${categoryLabels[category] || category} Collection` : 'All Collection'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Showing {products.length} products</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            className="md:hidden btn-outline flex items-center gap-2 flex-1 justify-center"
            onClick={() => setFilterOpen(true)}
          >
            <HiFilter /> Filters
          </button>
          
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field md:w-48 flex-1"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar / Mobile Drawer */}
        <div className={`
          fixed inset-0 z-50 bg-dark-900/95 p-6 transform transition-transform duration-300 md:sticky md:top-24 self-start md:bg-transparent md:p-0 md:w-64 md:translate-x-0 md:block
          ${filterOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex justify-between items-center md:hidden mb-6">
            <h2 className="text-xl font-bold text-white">Filters</h2>
            <button onClick={() => setFilterOpen(false)} className="p-2 text-gray-400">
              <HiX className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Categories */}
            <div>
              <h3 className="font-semibold text-white mb-4 uppercase text-sm tracking-wider">Categories</h3>
              <ul className="space-y-3">
                {['all', 'T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Jackets', 'Suits', 'Kurtas', 'Accessories'].map((c) => (
                  <li key={c}>
                    <button
                      onClick={() => handleCategoryChange(c)}
                      className={`text-sm transition-colors ${
                        (category === c || (!category && c === 'all'))
                          ? 'text-gold-400 font-medium'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {categoryLabels[c] || c}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {/* More filters can be added here (size, price range) */}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-dark-800 rounded-xl border border-dark-600">
              <span className="text-4xl block mb-4">🔍</span>
              <h3 className="text-xl font-medium text-white mb-2">No products found</h3>
              <p className="text-gray-400">Try adjusting your filters or search query.</p>
              <button 
                onClick={() => navigate('/products')}
                className="btn-outline mt-6 inline-block"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
