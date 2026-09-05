/**
 * Style Heaven Mens — Cart Item Row Card
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { formatCurrency } from '../../constants/config';
import { QuantityStepper } from '../product/SizeSelector';

export default function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}) {
  if (!item || !item.product) return null;

  const { product, size, quantity, key } = item;
  const imageUrl =
    product.image_url ||
    product.image ||
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop';

  return (
    <View style={styles.card}>
      {/* Product Image */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Info */}
      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {product.name}
          </Text>
          <TouchableOpacity
            onPress={() => onRemove(key)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Size Badge */}
        <View style={styles.sizeBadge}>
          <Text style={styles.sizeText}>Size: {size || 'Standard'}</Text>
        </View>

        {/* Price & Stepper Row */}
        <View style={styles.bottomRow}>
          <Text style={styles.price}>
            {formatCurrency((product.price || 0) * (quantity || 1))}
          </Text>

          <QuantityStepper
            quantity={quantity || 1}
            onIncrement={() => onUpdateQuantity(key, (quantity || 1) + 1)}
            onDecrement={() => onUpdateQuantity(key, (quantity || 1) - 1)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 90,
    height: 100,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighlight,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: SPACING.xs,
  },
  deleteBtn: {
    padding: 2,
  },
  deleteIcon: {
    fontSize: 14,
  },
  sizeBadge: {
    backgroundColor: COLORS.surfaceHighlight,
    alignSelf: 'flex-start',
    borderRadius: RADIUS.xs,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginVertical: 4,
  },
  sizeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gold,
  },
});
