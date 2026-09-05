/**
 * Style Heaven Mens — Cart Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Header from '../components/common/Header';
import CartItemCard from '../components/cart/CartItemCard';
import { CouponInput, OrderSummaryCard } from '../components/cart/CouponInput';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../constants/config';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function CartScreen({ navigation }) {
  const {
    items,
    totalItems,
    subtotal,
    discountAmount,
    deliveryFee,
    totalAmount,
    coupon,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const handleProceedToCheckout = () => {
    navigation.navigate('Checkout');
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="My Shopping Cart" showCart={false} />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🛒"
            title="Your Cart is Empty"
            description="Looks like you haven't added any handcrafted menswear items yet."
            buttonText="Explore Collection"
            onButtonPress={() => navigation.navigate('CategoriesTab')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={`Cart (${totalItems})`}
        showCart={false}
        rightComponent={
          <TouchableOpacity onPress={clearCart} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearCartText}>Clear All</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cart Items List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionHeader}>Order Items ({totalItems})</Text>
          {items.map((item) => (
            <CartItemCard
              key={item.key}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}
        </View>

        {/* Coupon Input */}
        <CouponInput
          appliedCoupon={coupon}
          onApplyCoupon={applyCoupon}
          onRemoveCoupon={removeCoupon}
        />

        {/* Order Summary */}
        <OrderSummaryCard
          subtotal={subtotal}
          discountAmount={discountAmount}
          deliveryFee={deliveryFee}
          totalAmount={totalAmount}
          coupon={coupon}
        />

        {/* Security & Guarantee Notes */}
        <View style={styles.guaranteeBox}>
          <Text style={styles.guaranteeIcon}>🛡️</Text>
          <Text style={styles.guaranteeText}>
            100% Authentic Indian Craftsmanship Guarantee. 7-Day Easy Returns.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Bar */}
      <View style={[styles.bottomBar, SHADOWS.medium]}>
        <View style={styles.totalInfo}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>{formatCurrency(totalAmount)}</Text>
        </View>

        <Button
          title="Proceed to Checkout →"
          variant="primary"
          onPress={handleProceedToCheckout}
          style={styles.checkoutBtn}
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
    padding: SPACING.lg,
    paddingBottom: 110,
  },
  emptyContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
    marginRight: 4,
  },
  itemsSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    letterSpacing: 0.3,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  guaranteeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalInfo: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.gold,
  },
  checkoutBtn: {
    flex: 1.4,
    marginLeft: SPACING.md,
  },
});
