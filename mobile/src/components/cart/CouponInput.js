/**
 * Style Heaven Mens — Coupon Input & Order Summary Card
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { formatCurrency, APP_CONFIG } from '../../constants/config';
import { couponAPI } from '../../services/api';
import { showToast } from '../common/Toast';

export function CouponInput({
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    // Direct check for default promo code
    if (cleanCode === 'KALA30') {
      onApplyCoupon({
        code: 'KALA30',
        discount_type: 'percentage',
        discount_value: 30,
      });
      setCode('');
      showToast('30% Launch Discount Applied! ✨');
      return;
    }

    setLoading(true);
    try {
      const res = await couponAPI.validate(cleanCode);
      if (res.data) {
        onApplyCoupon({
          code: cleanCode,
          discount_type: res.data.discount_type,
          discount_value: res.data.discount_value,
        });
        setCode('');
        showToast('Coupon applied successfully! 🎟️');
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Invalid or expired coupon code', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <View style={styles.appliedContainer}>
        <View style={styles.appliedLeft}>
          <Text style={styles.appliedIcon}>🎟️</Text>
          <View>
            <Text style={styles.appliedCode}>{appliedCoupon.code}</Text>
            <Text style={styles.appliedDiscount}>
              {appliedCoupon.discount_type === 'percentage'
                ? `${appliedCoupon.discount_value}% OFF`
                : appliedCoupon.discount_type === 'free_shipping'
                ? 'FREE DELIVERY'
                : `₹${appliedCoupon.discount_value} OFF`}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onRemoveCoupon} style={styles.removeBtn}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.inputContainer}>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Enter coupon code (e.g. KALA30)"
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="characters"
        style={styles.input}
      />
      <TouchableOpacity
        style={[styles.applyBtn, !code.trim() && styles.disabledApplyBtn]}
        onPress={handleApply}
        disabled={loading || !code.trim()}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.textDark} />
        ) : (
          <Text style={styles.applyBtnText}>Apply</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function OrderSummaryCard({
  subtotal = 0,
  discountAmount = 0,
  deliveryFee = 0,
  totalAmount = 0,
  coupon = null,
}) {
  const freeThresholdRemaining = Math.max(
    0,
    APP_CONFIG.freeShippingThreshold - subtotal
  );

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Bill Details</Text>

      {/* Free Delivery Progress Alert */}
      {subtotal > 0 && freeThresholdRemaining > 0 && (
        <View style={styles.deliveryProgress}>
          <Text style={styles.progressText}>
            Add <Text style={styles.highlightText}>{formatCurrency(freeThresholdRemaining)}</Text> more for FREE Delivery 🚚
          </Text>
        </View>
      )}

      {/* Row: Subtotal */}
      <View style={styles.summaryRow}>
        <Text style={styles.label}>Item Subtotal</Text>
        <Text style={styles.value}>{formatCurrency(subtotal)}</Text>
      </View>

      {/* Row: Discount */}
      {discountAmount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={[styles.label, styles.discountText]}>
            Coupon Discount {coupon?.code ? `(${coupon.code})` : ''}
          </Text>
          <Text style={[styles.value, styles.discountText]}>
            -{formatCurrency(discountAmount)}
          </Text>
        </View>
      )}

      {/* Row: Delivery Fee */}
      <View style={styles.summaryRow}>
        <Text style={styles.label}>Estimated Delivery</Text>
        <Text style={[styles.value, deliveryFee === 0 && styles.freeText]}>
          {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Row: Grand Total */}
      <View style={styles.summaryRow}>
        <Text style={styles.totalLabel}>Total Payable</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Coupon
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
    marginBottom: SPACING.md,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: SPACING.md,
    textTransform: 'uppercase',
  },
  applyBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  disabledApplyBtn: {
    opacity: 0.5,
  },
  applyBtnText: {
    color: COLORS.textDark,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  appliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  appliedCode: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  appliedDiscount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  removeBtn: {
    padding: 4,
  },
  removeText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '700',
  },

  // Summary
  summaryContainer: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    letterSpacing: 0.3,
  },
  deliveryProgress: {
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: SPACING.md,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  highlightText: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  discountText: {
    color: COLORS.success,
  },
  freeText: {
    color: COLORS.success,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.gold,
  },
});
