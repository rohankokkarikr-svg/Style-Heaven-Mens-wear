/**
 * Style Heaven Mens — Search & Discovery Screen
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Header from '../components/common/Header';
import ProductGrid from '../components/product/ProductGrid';
import { productAPI } from '../services/api';
import { HANDICRAFT_PRODUCTS } from '../constants/handicraftsData';
import storage from '../services/storage';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const POPULAR_SEARCHES = [
  'Banarasi Silk Kurta',
  'Nehru Jacket',
  'Brass Cufflinks',
  'Hand-block Print',
  'Khadi Shirt',
  'Chanderi Dupatta',
  'Blue Pottery',
];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const timerRef = useRef(null);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const history = await storage.getSearchHistory();
      setSearchHistory(history);
    };
    loadHistory();
  }, []);

  // Fetch all products on initial load
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const { data } = await productAPI.getAll();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(HANDICRAFT_PRODUCTS);
        }
      } catch {
        setProducts(HANDICRAFT_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Debounce search query
  const handleQueryChange = (text) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(text);
      if (text.trim().length > 2) {
        storage.addSearchHistory(text.trim());
      }
    }, 300);
  };

  const handleSelectQuery = (text) => {
    setQuery(text);
    setDebouncedQuery(text);
    storage.addSearchHistory(text);
  };

  const handleClearHistory = async () => {
    await storage.clearSearchHistory();
    setSearchHistory([]);
  };

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    if (!term) return products;

    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const mat = (p.material || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return (
        name.includes(term) ||
        cat.includes(term) ||
        mat.includes(term) ||
        desc.includes(term)
      );
    });
  }, [products, debouncedQuery]);

  return (
    <View style={styles.container}>
      <Header title="Search Menswear" showSearch={false} />

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search kurtas, jackets, fabrics, accessories..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            autoFocus={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggestion Chips & Recent Searches (when query is empty) */}
      {!debouncedQuery ? (
        <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipsWrap}>
                {searchHistory.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.historyChip}
                    onPress={() => handleSelectQuery(item)}
                  >
                    <Text style={styles.clockIcon}>🕒</Text>
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Popular Searches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Searches 🔥</Text>
            <View style={styles.chipsWrap}>
              {POPULAR_SEARCHES.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.trendingChip}
                  onPress={() => handleSelectQuery(item)}
                >
                  <Text style={styles.trendingChipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Results Grid */
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            Found {filteredProducts.length} items for "{debouncedQuery}"
          </Text>
          <ProductGrid
            products={filteredProducts}
            loading={loading}
            emptyTitle="No Matching Items"
            emptyDescription="No handcrafted products matched your search. Try searching for a different keyword or category."
            onEmptyAction={() => handleQueryChange('')}
            emptyActionText="Clear Search"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBarContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 46,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  suggestionsContainer: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  clearText: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clockIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  trendingChip: {
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.full,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  trendingChipText: {
    fontSize: 12,
    color: COLORS.textGold,
    fontWeight: '700',
  },
  resultsContainer: {
    flex: 1,
    paddingTop: SPACING.sm,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  },
});
