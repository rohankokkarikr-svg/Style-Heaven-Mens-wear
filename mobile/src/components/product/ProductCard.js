/**
 * Style Heaven Mens — Product Card Component
 * Optimized for FlatList grid performance with image caching and wishlist toggle
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';
import { formatCurrency } from '../../constants/config';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { showToast } from '../common/Toast';

export default function ProductCard({ product, style = null }) {
  const navigation = useNavigation();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);

  // Discount calculation
  const originalPrice = product.original_price || product.originalPrice;
  const currentPrice = product.price;
  const discountPercent =
    product.discount_percentage ||
    (originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0);

  const handleQuickAdd = (e) => {
    e?.stopPropagation?.();
    const size = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : 'Standard';
    addToCart(product, size, 1);
    showToast(`${product.name} added to Cart 🛒`);
  };

  const handleWishlistToggle = (e) => {
    e?.stopPropagation?.();
    toggleWishlist(product);
    showToast(isFavorited ? 'Removed from Wishlist' : 'Added to Wishlist ❤️');
  };

  const imageUrl =
    product.image_url ||
    product.image ||
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, SHADOWS.small, style]}
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id, product })}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}

        {/* Wishlist Heart Button */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={handleWishlistToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.heartIcon}>{isFavorited ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        {/* Stock status overlay */}
        {product.is_in_stock === false || (product.stock_quantity !== undefined && product.stock_quantity <= 0) ? (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>SOLD OUT</Text>
          </View>
        ) : null}
      </View>

      {/* Product Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.category} numberOfLines={1}>
          {product.category || 'Menswear'}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating & Artisan */}
        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.ratingText}>{product.rating || '4.8'}</Text>
          </View>
          {product.material && (
            <Text style={styles.materialText} numberOfLines={1}>
              {product.material}
            </Text>
          )}
        </View>

        {/* Price & Quick Add Button */}
        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrency(currentPrice)}</Text>
            {originalPrice && originalPrice > currentPrice && (
              <Text style={styles.originalPrice}>
                {formatCurrency(originalPrice)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleQuickAdd}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.addBtnIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    margin: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surfaceHighlight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.xs,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(18, 18, 18, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 14,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  infoContainer: {
    padding: SPACING.sm,
  },
  category: {
    fontSize: 10,
    color: COLORS.textGold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 18,
    minHeight: 36,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: RADIUS.xs,
  },
  starIcon: {
    color: COLORS.gold,
    fontSize: 10,
    marginRight: 2,
  },
  ratingText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  materialText: {
    fontSize: 10,
    color: COLORS.textMuted,
    maxWidth: 70,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gold,
  },
  originalPrice: {
    fontSize: 11,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnIcon: {
    color: COLORS.textDark,
    fontSize: 18,
    fontWeight: '800',
    marginTop: -2,
  },
});
