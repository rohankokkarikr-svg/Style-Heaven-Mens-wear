/**
 * Style Heaven Mens — Home Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Header from '../components/common/Header';
import HeroBannerSlider from '../components/home/HeroBannerSlider';
import CategoryPills from '../components/home/CategoryPills';
import DiscountBannerCard from '../components/home/DiscountBannerCard';
import { ArtisanHighlights, TestimonialsList } from '../components/home/ArtisanHighlights';
import ProductCard from '../components/product/ProductCard';
import SpinWheelModal from '../components/rewards/SpinWheelModal';
import { ProductCardSkeleton } from '../components/common/Skeleton';
import { productAPI, artisanAPI } from '../services/api';
import { HANDICRAFT_PRODUCTS } from '../constants/handicraftsData';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function HomeScreen({ navigation }) {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [spinModalVisible, setSpinModalVisible] = useState(false);

  const loadHomeData = async () => {
    try {
      const [featRes, artRes] = await Promise.allSettled([
        productAPI.getFeatured(),
        artisanAPI.getAll(),
      ]);

      if (featRes.status === 'fulfilled' && Array.isArray(featRes.value.data) && featRes.value.data.length > 0) {
        setFeaturedProducts(featRes.value.data);
      } else {
        setFeaturedProducts(HANDICRAFT_PRODUCTS.slice(0, 8));
      }

      if (artRes.status === 'fulfilled' && Array.isArray(artRes.value.data)) {
        setArtisans(artRes.value.data.slice(0, 6));
      }
    } catch (e) {
      setFeaturedProducts(HANDICRAFT_PRODUCTS.slice(0, 8));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
            colors={[COLORS.gold]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Hero Banner Carousel */}
        <HeroBannerSlider />

        {/* 2. Quick Category Filter Pills */}
        <CategoryPills />

        {/* 3. Promotional Discount Banner Card */}
        <DiscountBannerCard />

        {/* 4. Featured Menswear & Handicrafts Grid */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.badgeLabel}>Curated Masterpieces</Text>
            <Text style={styles.sectionTitle}>Featured Menswear</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProductList')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.skeletonRow}>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        ) : (
          <View style={styles.productGrid}>
            {featuredProducts.slice(0, 6).map((prod) => (
              <View key={prod.id} style={styles.productCol}>
                <ProductCard product={prod} />
              </View>
            ))}
          </View>
        )}

        {/* 5. Meet the Artisans */}
        <ArtisanHighlights artisans={artisans} />

        {/* 6. Customer Testimonials */}
        <TestimonialsList />

        {/* 7. Bottom Brand Banner */}
        <View style={styles.brandFooter}>
          <Text style={styles.brandCrown}>👑</Text>
          <Text style={styles.brandTitle}>Style Heaven Mens</Text>
          <Text style={styles.brandDesc}>
            Celebrating 5000 Years of Indian Textile & Handloom Heritage. Direct from Master Artisans to Your Wardrobe.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Spin Wheel Reward Button */}
      <TouchableOpacity
        style={[styles.floatingSpinBtn, SHADOWS.gold]}
        onPress={() => setSpinModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.spinIcon}>🎡</Text>
        <Text style={styles.spinText}>SPIN TO WIN</Text>
      </TouchableOpacity>

      <SpinWheelModal
        visible={spinModalVisible}
        onClose={() => setSpinModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gold,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.sm,
  },
  productCol: {
    width: '50%',
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
  },
  brandFooter: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  brandCrown: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  brandDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  floatingSpinBtn: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.goldLight,
    zIndex: 99,
  },
  spinIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  spinText: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
