/**
 * Style Heaven Mens — Product Detail Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
  Dimensions,
} from 'react-native';
import Header from '../components/common/Header';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { SizeSelector, QuantityStepper } from '../components/product/SizeSelector';
import ProductCard from '../components/product/ProductCard';
import { productAPI } from '../services/api';
import { HANDICRAFT_PRODUCTS } from '../constants/handicraftsData';
import { formatCurrency } from '../constants/config';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { showToast } from '../components/common/Toast';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { productId, product: initialProduct } = route.params || {};
  const [product, setProduct] = useState(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!productId) return;
      try {
        const { data } = await productAPI.getById(productId);
        if (data) {
          setProduct(data);
          if (Array.isArray(data.sizes) && data.sizes.length > 0) {
            setSelectedSize(data.sizes[0]);
          }
        }
      } catch (e) {
        const local = HANDICRAFT_PRODUCTS.find((p) => String(p.id) === String(productId));
        if (local) setProduct(local);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [productId]);

  if (!product && !loading) {
    return (
      <View style={styles.container}>
        <Header title="Product Details" showBack={true} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Product could not be found.</Text>
          <Button title="Back to Products" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const isFavorited = product ? isInWishlist(product.id) : false;

  const images = product?.images && product.images.length > 0
    ? product.images
    : [
        product?.image_url ||
        product?.image ||
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop',
      ];

  const originalPrice = product?.original_price || product?.originalPrice;
  const currentPrice = product?.price || 0;
  const discountPercent =
    product?.discount_percentage ||
    (originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0);

  const isOutOfStock =
    product?.is_in_stock === false ||
    (product?.stock_quantity !== undefined && product.stock_quantity <= 0);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      showToast('Sorry, this item is currently out of stock.', 'error');
      return;
    }
    addToCart(product, selectedSize, quantity);
    showToast(`${quantity}x ${product.name} (Size: ${selectedSize}) added to Cart 🛒`);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      showToast('Sorry, this item is currently out of stock.', 'error');
      return;
    }
    addToCart(product, selectedSize, quantity);
    navigation.navigate('Checkout');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product?.name} on Style Heaven Mens: Indian Handcrafted Menswear! Price: ${formatCurrency(product?.price)}`,
        title: product?.name,
      });
    } catch (e) {}
  };

  // Related products
  const relatedProducts = HANDICRAFT_PRODUCTS.filter(
    (p) => p.id !== product?.id && p.category === product?.category
  ).slice(0, 4);

  return (
    <View style={styles.container}>
      <Header
        title={product?.category || 'Menswear'}
        showBack={true}
        showSearch={false}
        rightComponent={
          <TouchableOpacity
            style={styles.headerShareBtn}
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.shareIcon}>📤</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Product Image Carousel */}
        <View style={styles.imageGalleryContainer}>
          <Image
            source={{ uri: images[selectedImageIndex] || images[0] }}
            style={styles.mainImage}
            resizeMode="cover"
          />

          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}% OFF</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={() => {
              toggleWishlist(product);
              showToast(isFavorited ? 'Removed from Wishlist' : 'Saved to Wishlist ❤️');
            }}
          >
            <Text style={styles.heartIcon}>{isFavorited ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Multi-image thumbnail selector */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {images.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.thumbnailWrapper,
                  selectedImageIndex === idx && styles.activeThumbnail,
                ]}
                onPress={() => setSelectedImageIndex(idx)}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Details Section */}
        <View style={styles.detailsContainer}>
          {/* Category & Verified Tag */}
          <View style={styles.tagRow}>
            <Badge label="Certified Authentic" variant="gold" size="sm" />
            {product?.is_handmade && (
              <Badge label="100% Handcrafted" variant="success" size="sm" style={{ marginLeft: 6 }} />
            )}
          </View>

          {/* Product Title */}
          <Text style={styles.title}>{product?.name}</Text>

          {/* Rating & Reviews */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.ratingValue}>{product?.rating || 4.9}</Text>
            </View>
            <Text style={styles.reviewsCount}>
              ({product?.review_count || 128} verified reviews)
            </Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.stateOrigin}>
              Origin: {product?.state_of_origin || 'India'}
            </Text>
          </View>

          {/* Pricing Row */}
          <View style={styles.pricingRow}>
            <Text style={styles.currentPrice}>
              {formatCurrency(currentPrice)}
            </Text>
            {originalPrice && originalPrice > currentPrice && (
              <Text style={styles.originalPrice}>
                {formatCurrency(originalPrice)}
              </Text>
            )}
            <Text style={styles.taxesText}>Inclusive of all taxes</Text>
          </View>

          {/* Stock Status Indicator */}
          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: isOutOfStock ? COLORS.error : COLORS.success },
              ]}
            />
            <Text
              style={[
                styles.stockText,
                { color: isOutOfStock ? COLORS.error : COLORS.success },
              ]}
            >
              {isOutOfStock
                ? 'Out of Stock'
                : product?.stock_quantity && product.stock_quantity < 10
                ? `Only ${product.stock_quantity} pieces left in stock!`
                : 'In Stock — Ready to Dispatch'}
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Size Selector */}
          <SizeSelector
            sizes={product?.sizes || ['S', 'M', 'L', 'XL', 'XXL']}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
          />

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionLabel}>Quantity</Text>
            <QuantityStepper
              quantity={quantity}
              onIncrement={() => setQuantity((q) => Math.min(q + 1, 10))}
              onDecrement={() => setQuantity((q) => Math.max(q - 1, 1))}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Artisan Profile Box */}
          <TouchableOpacity
            style={styles.artisanCard}
            onPress={() => {
              if (product?.artisan_id || product?.artisan) {
                navigation.navigate('ArtisanStore', {
                  artisanId: product.artisan_id || product.artisan?.id,
                  artisan: product.artisan || { store_name: product.artisan_name || 'Master Artisan' },
                });
              }
            }}
          >
            <View style={styles.artisanLeft}>
              <View style={styles.artisanAvatar}>
                <Text style={styles.artisanInitial}>
                  {(product?.artisan_name || product?.artisan_profiles?.store_name || 'A')[0]}
                </Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.artisanStoreName}>
                    {product?.artisan_name || product?.artisan_profiles?.store_name || 'Master Artisan Workshop'}
                  </Text>
                  <Text style={styles.verifiedCheck}>✓</Text>
                </View>
                <Text style={styles.artisanLocation}>
                  📍 {product?.artisan_location || product?.state_of_origin || 'Varanasi, India'}
                </Text>
              </View>
            </View>
            <Text style={styles.artisanStoreLink}>View Store →</Text>
          </TouchableOpacity>

          {/* Description & Heritage Craft Details */}
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionTitle}>Artisan Craft Details</Text>
            <Text style={styles.descriptionText}>
              {product?.description ||
                'This exclusive garment is handwoven using centuries-old traditional techniques. Made with authentic natural fabrics ensuring supreme breathability, luxury drape, and timeless elegance.'}
            </Text>

            {product?.material && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Fabric Material:</Text>
                <Text style={styles.specValue}>{product.material}</Text>
              </View>
            )}

            {product?.craft_technique && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Craft Technique:</Text>
                <Text style={styles.specValue}>{product.craft_technique}</Text>
              </View>
            )}

            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Care Instructions:</Text>
              <Text style={styles.specValue}>Dry Clean or Gentle Cold Handwash</Text>
            </View>
          </View>

          {/* Related Products Carousel */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>You May Also Like</Text>
              <View style={styles.relatedGrid}>
                {relatedProducts.map((rel) => (
                  <View key={rel.id} style={{ width: '50%' }}>
                    <ProductCard product={rel} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, SHADOWS.medium]}>
        <Button
          title="Add to Cart 🛒"
          variant="outline"
          onPress={handleAddToCart}
          disabled={isOutOfStock}
          style={styles.actionBtnOutline}
        />
        <Button
          title="Buy Now ⚡"
          variant="primary"
          onPress={handleBuyNow}
          disabled={isOutOfStock}
          style={styles.actionBtnPrimary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: SPACING.md,
  },
  headerShareBtn: {
    padding: 6,
  },
  shareIcon: {
    fontSize: 18,
  },
  imageGalleryContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.95,
    backgroundColor: COLORS.surfaceCard,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.error,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.xs,
  },
  discountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    fontSize: 18,
  },
  thumbnailRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  activeThumbnail: {
    borderColor: COLORS.gold,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: SPACING.lg,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.xs,
  },
  star: {
    color: COLORS.gold,
    fontSize: 12,
    marginRight: 2,
  },
  ratingValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  reviewsCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  dotSeparator: {
    color: COLORS.textMuted,
    marginHorizontal: 6,
  },
  stateOrigin: {
    fontSize: 12,
    color: COLORS.textGold,
    fontWeight: '600',
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.gold,
  },
  originalPrice: {
    fontSize: 16,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  taxesText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 'auto',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  quantitySection: {
    marginTop: SPACING.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  artisanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  artisanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artisanAvatar: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  artisanInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gold,
  },
  artisanStoreName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  verifiedCheck: {
    fontSize: 11,
    color: COLORS.success,
    marginLeft: 4,
    fontWeight: '800',
  },
  artisanLocation: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  artisanStoreLink: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gold,
  },
  descriptionBox: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  specLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  relatedSection: {
    marginTop: SPACING.md,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionBtnOutline: {
    flex: 1,
  },
  actionBtnPrimary: {
    flex: 1.2,
  },
});
