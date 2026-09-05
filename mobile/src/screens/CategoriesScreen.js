/**
 * Style Heaven Mens — Categories Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import Header from '../components/common/Header';
import { HANDICRAFT_CATEGORIES } from '../constants/handicraftsData';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function CategoriesScreen({ navigation }) {
  const renderCategoryCard = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, SHADOWS.medium]}
        onPress={() => navigation.navigate('ProductList', { category: item.slug, categoryTitle: item.name })}
      >
        <Image
          source={{ uri: item.image || item.bannerImage }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.gradientOverlay} />

        <View style={styles.cardContent}>
          <View style={styles.iconBadge}>
            <Text style={styles.icon}>{item.icon || '🧵'}</Text>
          </View>

          <Text style={styles.categoryName} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.categoryDesc} numberOfLines={2}>
            {item.shortDesc || item.description}
          </Text>

          <View style={styles.bottomRow}>
            <Text style={styles.itemCount}>
              {item.productCount || '20+'} Artisanal Items
            </Text>
            <Text style={styles.exploreArrow}>Explore Collection →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="All Categories" showSearch={true} showCart={true} />

      <FlatList
        data={HANDICRAFT_CATEGORIES}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBanner}>
            <Text style={styles.bannerTag}>Handmade In India</Text>
            <Text style={styles.bannerTitle}>Explore Curated Categories</Text>
            <Text style={styles.bannerSubtitle}>
              From royal banarasi silks to handcrafted leather juttis and brass menswear accessories.
            </Text>
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
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 90,
  },
  headerBanner: {
    marginBottom: SPACING.lg,
  },
  bannerTag: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    height: 180,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.65)',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  categoryDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gold,
  },
  exploreArrow: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
