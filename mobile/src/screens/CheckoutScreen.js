/**
 * Style Heaven Mens — Native Checkout Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Header from '../components/common/Header';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { OrderSummaryCard } from '../components/cart/CouponInput';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { notificationsService } from '../services/notifications';
import { showToast } from '../components/common/Toast';
import { formatCurrency } from '../constants/config';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function CheckoutScreen({ navigation }) {
  const {
    items,
    subtotal,
    discountAmount,
    deliveryFee,
    totalAmount,
    coupon,
    clearCart,
  } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || user?.email || '');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('Karnataka');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'cod' | 'online'
  const [submitting, setSubmitting] = useState(false);

  // Errors
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Please enter your full name';
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (!addressLine.trim() || addressLine.trim().length < 8) {
      errs.addressLine = 'Please enter complete delivery address';
    }
    if (!city.trim()) errs.city = 'Please enter city';
    if (!pincode.trim() || pincode.trim().length < 6) {
      errs.pincode = 'Please enter valid 6-digit PIN code';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      showToast('Please fix required address fields', 'error');
      return;
    }

    if (!items || items.length === 0) {
      showToast('Cart is empty', 'error');
      navigation.navigate('CartTab');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to place your order and track delivery.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      const fullShippingAddress = `${fullName}, ${addressLine}, ${city}, ${state} - ${pincode}`;

      const orderPayload = {
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity || 1,
          price_at_time: i.product.price,
          size: i.size || 'Standard',
        })),
        total_price: totalAmount,
        discount_amount: discountAmount,
        coupon_code: coupon?.code || null,
        shipping_address: fullShippingAddress,
        phone: phone.replace(/\D/g, '').slice(0, 10),
        payment_method: paymentMethod === 'upi' ? 'upi' : paymentMethod === 'cod' ? 'cod' : 'online',
        payment_status: paymentMethod === 'cod' ? 'pending' : 'pending_verification',
      };

      const res = await orderAPI.create(orderPayload);
      const createdOrder = res.data;

      // Local push notification
      await notificationsService.scheduleOrderConfirmation(createdOrder.id, totalAmount);

      clearCart();

      if (paymentMethod === 'upi') {
        showToast('Order created! Please complete UPI payment ✨');
        navigation.replace('PaymentGateway', {
          orderId: createdOrder.id,
          method: 'upi_phonepe',
        });
      } else {
        showToast('🎉 Order placed successfully! 🛍️');
        navigation.replace('OrderDetail', {
          orderId: createdOrder.id,
          order: createdOrder,
        });
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to place order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Checkout" showBack={true} showCart={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Step 1: Delivery Address */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>1</Text>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>

          <Input
            label="Full Name *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Rohan Sharma"
            error={errors.fullName}
          />

          <Input
            label="Mobile Number (10 digits) *"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
          />

          <Input
            label="House / Flat No., Street, Landmark *"
            value={addressLine}
            onChangeText={setAddressLine}
            placeholder="e.g. 42, Heritage Enclave, MG Road"
            multiline
            numberOfLines={2}
            error={errors.addressLine}
          />

          <View style={styles.row}>
            <Input
              label="City *"
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Bengaluru"
              style={{ flex: 1, marginRight: SPACING.sm }}
              error={errors.city}
            />
            <Input
              label="PIN Code *"
              value={pincode}
              onChangeText={setPincode}
              placeholder="e.g. 560001"
              keyboardType="number-pad"
              maxLength={6}
              style={{ flex: 1 }}
              error={errors.pincode}
            />
          </View>
        </View>

        {/* Step 2: Payment Method */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionNumber}>2</Text>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          {/* Option: Direct UPI */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'upi' && styles.selectedPaymentOption,
            ]}
            onPress={() => setPaymentMethod('upi')}
            activeOpacity={0.8}
          >
            <View style={styles.radioCircle}>
              {paymentMethod === 'upi' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentDetails}>
              <View style={styles.methodHeader}>
                <Text style={styles.methodTitle}>⚡ 100% Direct Artisan UPI</Text>
                <Text style={styles.recommendedBadge}>RECOMMENDED</Text>
              </View>
              <Text style={styles.methodSubtitle}>
                PhonePe · Google Pay · Paytm · BHIM (Instant QR & Deep link)
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option: Cash on Delivery */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.selectedPaymentOption,
            ]}
            onPress={() => setPaymentMethod('cod')}
            activeOpacity={0.8}
          >
            <View style={styles.radioCircle}>
              {paymentMethod === 'cod' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.methodTitle}>💵 Cash on Delivery (COD)</Text>
              <Text style={styles.methodSubtitle}>
                Pay cash or UPI at your doorstep upon delivery
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Step 3: Bill Summary */}
        <OrderSummaryCard
          subtotal={subtotal}
          discountAmount={discountAmount}
          deliveryFee={deliveryFee}
          totalAmount={totalAmount}
          coupon={coupon}
        />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, SHADOWS.medium]}>
        <View style={styles.totalInfo}>
          <Text style={styles.bottomTotalLabel}>Total Amount</Text>
          <Text style={styles.bottomTotalValue}>{formatCurrency(totalAmount)}</Text>
        </View>

        <Button
          title={submitting ? 'Placing Order...' : 'Confirm & Place Order 🚀'}
          variant="primary"
          onPress={handlePlaceOrder}
          disabled={submitting}
          loading={submitting}
          style={styles.confirmBtn}
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
  sectionCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionNumber: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gold,
    color: COLORS.textDark,
    textAlign: 'center',
    fontWeight: '900',
    lineHeight: 24,
    fontSize: 12,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  selectedPaymentOption: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldMuted,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
  },
  paymentDetails: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  recommendedBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: RADIUS.xs,
  },
  methodSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
  confirmBtn: {
    flex: 1.5,
    marginLeft: SPACING.md,
  },
});
