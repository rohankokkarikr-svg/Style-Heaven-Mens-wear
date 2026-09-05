/**
 * Style Heaven Mens — Product List & Category Explorer Screen
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Header from '../components/common/Header';
import ProductGrid from '../components/product/ProductGrid';
import FilterModal from '../components/product/FilterModal';
import { productAPI } from '../services/api';
import { HANDICRAFT_PRODUCTS, HANDICRAFT_CATEGORIES } from '../constants/handicraftsData';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function ProductListScreen({ route, navigation }) {
  const { category = 'all', categoryTitle = null, search = '' } = route.params || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Filters State
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState('all');
  const [material, setMaterial] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  const fetchProducts = async () => {
    try {
      const params = {};
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;

      const { data } = await productAPI.getAll(params);
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(HANDICRAFT_PRODUCTS);
      }
    } catch {
      setProducts(HANDICRAFT_PRODUCTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Compute category label
  const resolvedTitle = useMemo(() => {
    if (categoryTitle) return categoryTitle;
    if (category && category !== 'all') {
      const match = HANDICRAFT_CATEGORIES.find(
        (c) => c.slug.toLowerCase() === category.toLowerCase()
      );
      return match ? match.name : category;
    }
    if (search) return `Search: "${search}"`;
    return 'All Menswear & Crafts';
  }, [category, categoryTitle, search]);

  // Comprehensive Client Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (category && category !== 'all') {
      list = list.filter(
        (p) =>
          (p.category || '').toLowerCase() === category.toLowerCase() ||
          (p.subcategory || '').toLowerCase() === category.toLowerCase()
      );
    }

    // Price range filter
    if (priceRange !== 'all') {
      if (priceRange === '0-1000') list = list.filter((p) => p.price <= 1000);
      else if (priceRange === '1000-2500') list = list.filter((p) => p.price > 1000 && p.price <= 2500);
      else if (priceRange === '2500-5000') list = list.filter((p) => p.price > 2500 && p.price <= 5000);
      else if (priceRange === '5000+') list = list.filter((p) => p.price > 5000);
    }

    // Material filter
    if (material !== 'all') {
      list = list.filter((p) =>
        (p.material || '').toLowerCase().includes(material.toLowerCase())
      );
    }

    // Availability filter
    if (inStockOnly) {
      list = list.filter(
        (p) => p.is_in_stock !== false && (p.stock_quantity === undefined || p.stock_quantity > 0)
      );
    }

    // Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => (b.id > a.id ? 1 : -1));
    }

    return list;
  }, [products, category, priceRange, material, inStockOnly, sortBy]);

  const handleResetFilters = () => {
    setSortBy('popular');
    setPriceRange('all');
    setMaterial('all');
    setInStockOnly(false);
  };

  const hasActiveFilters =
    priceRange !== 'all' || material !== 'all' || inStockOnly || sortBy !== 'popular';

  return (
    <View style={styles.container}>
      <Header title={resolvedTitle} showBack={true} showSearch={true} showCart={true} />

      {/* Filter and Results Count Bar */}
      <View style={styles.filterBar}>
        <Text style={styles.resultsCount}>
          {filteredProducts.length} Artisanal Items
        </Text>

        <View style={styles.filterActions}>
          {hasActiveFilters && (
            <TouchableOpacity onPress={handleResetFilters} style={styles.resetBtn}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.filterBtn, hasActiveFilters && styles.activeFilterBtn]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterIcon}>⚙️</Text>
            <Text style={[styles.filterBtnText, hasActiveFilters && styles.activeFilterText]}>
              Filter & Sort
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Products Grid */}
      <ProductGrid
        products={filteredProducts}
        loading={loading}
        refreshing={refreshing}
        onRefresh={onRefresh}
        emptyTitle="No Items Found"
        emptyDescription="Try adjusting your active filters or explore our complete Indian menswear collection."
        onEmptyAction={handleResetFilters}
        emptyActionText="Reset All Filters"
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        sortBy={sortBy}
        onSelectSort={setSortBy}
        priceRange={priceRange}
        onSelectPriceRange={setPriceRange}
        material={material}
        onSelectMaterial={setMaterial}
        inStockOnly={inStockOnly}
        onToggleInStockOnly={setInStockOnly}
        onReset={handleResetFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resetBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetText: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '700',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeFilterBtn: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldMuted,
  },
  filterIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  activeFilterText: {
    color: COLORS.gold,
  },
});
