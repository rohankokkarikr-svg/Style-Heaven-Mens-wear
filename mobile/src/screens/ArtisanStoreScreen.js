/**
 * Style Heaven Mens — Artisan Store Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Header from '../components/common/Header';
import ProductGrid from '../components/product/ProductGrid';
import Badge from '../components/common/Badge';
import { artisanAPI, productAPI } from '../services/api';
import { HANDICRAFT_PRODUCTS } from '../constants/handicraftsData';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function ArtisanStoreScreen({ route, navigation }) {
  const { artisanId, artisan: initialArtisan } = route.params || {};
  const [artisan, setArtisan] = useState(initialArtisan || null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtisanData = async () => {
      try {
        if (artisanId) {
          const { data: artData } = await artisanAPI.getById(artisanId);
          if (artData) setArtisan(artData);
        }

        const { data: prods } = await productAPI.getAll({ artisan_id: artisanId });
        if (Array.isArray(prods) && prods.length > 0) {
          setProducts(prods);
        } else {
          setProducts(HANDICRAFT_PRODUCTS.slice(0, 6));
        }
      } catch (e) {
        setProducts(HANDICRAFT_PRODUCTS.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };

    fetchArtisanData();
  }, [artisanId]);

  const storeName = artisan?.store_name || artisan?.name || 'Master Artisan Workshop';
  const initial = storeName[0]?.toUpperCase() || 'A';

  return (
    <View style={styles.container}>
      <Header title={storeName} showBack={true} />

      <ProductGrid
        products={products}
        loading={loading}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <View style={styles.avatarRow}>
              {artisan?.profile_image ? (
                <Image
                  source={{ uri: artisan.profile_image }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}

              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.storeName}>{storeName}</Text>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
                <Text style={styles.specialization}>
                  {artisan?.specialization || artisan?.artisan_type || 'Generational Handloom Weaver'}
                </Text>
                <Text style={styles.location}>
                  📍 {artisan?.location || 'Varanasi, India'}
                </Text>
              </View>
            </View>

            {/* Bio */}
            <Text style={styles.bioText}>
              {artisan?.bio ||
                'Preserving Indian textile traditions with handcrafted banarasi silks, authentic block prints, and generational heritage techniques.'}
            </Text>

            {/* Badges */}
            <View style={styles.badgesRow}>
              <Badge label="Verified Artisan" variant="success" size="sm" />
              <Badge label="Direct Fair Trade" variant="gold" size="sm" style={{ marginLeft: 6 }} />
              <Badge label="100% Handmade" variant="info" size="sm" style={{ marginLeft: 6 }} />
            </View>

            <View style={styles.divider} />
            <Text style={styles.catalogHeading}>Artisan's Handcrafted Catalog</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileHeader: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.gold,
    marginRight: SPACING.md,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldMuted,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.gold,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  checkIcon: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 6,
    fontWeight: '900',
  },
  specialization: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gold,
    marginTop: 2,
  },
  location: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bioText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginVertical: SPACING.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  catalogHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
