/**
 * Style Heaven Mens — Mobile Navigation Header
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function Header({
  title = 'Style Heaven Mens',
  showBack = false,
  showSearch = true,
  showCart = true,
  showWishlist = true,
  rightComponent = null,
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.headerRow}>
        {/* Left Side: Back button or Logo */}
        <View style={styles.leftGroup}>
          {showBack ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.brandBadge}>
              <Text style={styles.crownIcon}>👑</Text>
            </View>
          )}

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {!showBack && (
              <Text style={styles.subtitle}>Handcrafted Indian Menswear</Text>
            )}
          </View>
        </View>

        {/* Right Side: Actions */}
        <View style={styles.rightGroup}>
          {rightComponent}

          {showSearch && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('SearchTab')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionIcon}>🔍</Text>
            </TouchableOpacity>
          )}

          {showWishlist && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Wishlist')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionIcon}>❤️</Text>
              {totalWishlistItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {totalWishlistItems > 9 ? '9+' : totalWishlistItems}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {showCart && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('CartTab')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.actionIcon}>🛒</Text>
              {totalItems > 0 && (
                <View style={[styles.badge, styles.cartBadge]}>
                  <Text style={styles.badgeText}>
                    {totalItems > 99 ? '99+' : totalItems}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  crownIcon: {
    fontSize: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textGold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 6,
  },
  backArrow: {
    fontSize: 28,
    color: COLORS.gold,
    fontWeight: '300',
    marginTop: -4,
  },
  actionIcon: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  cartBadge: {
    backgroundColor: COLORS.gold,
  },
  badgeText: {
    color: COLORS.textDark,
    fontSize: 9,
    fontWeight: '800',
  },
});
