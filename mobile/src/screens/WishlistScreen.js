/**
 * Style Heaven Mens — Wishlist Screen
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
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../constants/config';
import { showToast } from '../components/common/Toast';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function WishlistScreen({ navigation }) {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product) => {
    const size = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : 'Standard';
    addToCart(product, size, 1);
    removeFromWishlist(product.id);
    showToast(`${product.name} moved to Cart! 🛒`);
  };

  const renderWishlistItem = ({ item }) => {
    const img =
      item.image_url ||
      item.image ||
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop';

    return (
      <View style={[styles.card, SHADOWS.small]}>
        <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />

        <View style={styles.details}>
          <View style={styles.topRow}>
            <Text style={styles.category}>{item.category || 'Menswear'}</Text>
            <TouchableOpacity
              onPress={() => removeFromWishlist(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.price}>{formatCurrency(item.price)}</Text>

          <View style={styles.actionsRow}>
            <Button
              title="Move to Cart 🛒"
              variant="primary"
              size="sm"
              onPress={() => handleMoveToCart(item)}
              style={styles.moveBtn}
            />
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id, product: item })}
            >
              <Text style={styles.viewBtnText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={`My Wishlist (${wishlist.length})`}
        showBack={true}
        showWishlist={false}
        rightComponent={
          wishlist.length > 0 ? (
            <TouchableOpacity onPress={clearWishlist} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="❤️"
            title="Your Wishlist is Empty"
            description="Explore our authentic Indian menswear and tap the heart icon to save your favorite pieces."
            buttonText="Explore Collection"
            onButtonPress={() => navigation.navigate('CategoriesTab')}
          />
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderWishlistItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
    marginRight: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  image: {
    width: 95,
    height: 110,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighlight,
  },
  details: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textGold,
    textTransform: 'uppercase',
  },
  removeIcon: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gold,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  moveBtn: {
    flex: 1,
  },
  viewBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceHighlight,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
