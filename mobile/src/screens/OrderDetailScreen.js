/**
 * Style Heaven Mens — Individual Order Detail Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Header from '../components/common/Header';
import { OrderTimeline } from '../components/orders/OrderCard';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { orderAPI } from '../services/api';
import { showToast } from '../components/common/Toast';
import { formatCurrency, APP_CONFIG } from '../constants/config';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId, order: initialOrder } = route.params || {};
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    try {
      const { data } = await orderAPI.getById(orderId);
      if (data) setOrder(data);
    } catch (err) {
      showToast('Could not load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await orderAPI.cancelOrder(order.id);
              showToast('Order cancelled successfully');
              fetchOrderDetail();
            } catch (err) {
              showToast(err.response?.data?.error || 'Failed to cancel order', 'error');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenWhatsAppReceipt = () => {
    const itemsText = (order?.items || [])
      .map(
        (i) =>
          `• ${i.product?.name || 'Item'} (Size: ${i.size}, Qty: ${i.quantity}) - ₹${(
            (i.price_at_time || 0) * (i.quantity || 1)
          ).toLocaleString()}`
      )
      .join('\n');
    const msg = `📦 *Order Receipt Request*\n----------------------------------------\n📦 *Order ID:* #${order?.id?.substring(
      0,
      8
    )}\n👤 *Customer:* ${order?.users?.name || 'Customer'}\n📞 *Phone:* +91 ${
      order?.phone || ''
    }\n💵 *Total Amount:* ₹${order?.total_price?.toLocaleString()}\n\n🛒 *Items:*\n${itemsText}\n========================================\n⌛ *Status:* ${
      order?.status
    }`;

    Linking.openURL(`https://wa.me/${APP_CONFIG.supportWhatsapp}?text=${encodeURIComponent(msg)}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Order Details" showBack={true} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Header title="Order Details" showBack={true} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Order not found.</Text>
          <Button title="Back to Orders" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  const items = order.items || [];
  const isPending =
    order.status === 'pending' || order.status === 'payment_verification_pending';

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Recent';

  return (
    <View style={styles.container}>
      <Header
        title={`Order #${order.id?.substring(0, 8)}`}
        showBack={true}
        showCart={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Status & ID Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderLabel}>Order Identifier</Text>
              <Text style={styles.orderId}>#{order.id?.substring(0, 8)}</Text>
              <Text style={styles.orderDate}>{orderDate}</Text>
            </View>

            <Badge
              label={order.status?.replace(/_/g, ' ') || 'Pending'}
              variant={
                order.status === 'delivered'
                  ? 'success'
                  : order.status === 'cancelled'
                  ? 'danger'
                  : 'gold'
              }
            />
          </View>

          {/* Delivery Tracking Progress */}
          <OrderTimeline currentStatus={order.status} />
        </View>

        {/* Ordered Items List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ordered Items ({items.length})</Text>

          {items.map((item, idx) => {
            const prod = item.product || {};
            const img =
              prod.image_url ||
              prod.image ||
              'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop';

            return (
              <View
                key={item.id || idx}
                style={[styles.itemRow, idx < items.length - 1 && styles.itemBorder]}
              >
                <Image source={{ uri: img }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {prod.name || 'Artisanal Menswear Item'}
                  </Text>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemSize}>Size: {item.size || 'Standard'}</Text>
                    <Text style={styles.itemQty}>Qty: {item.quantity || 1}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatCurrency((item.price_at_time || prod.price || 0) * (item.quantity || 1))}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Information</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>Shipping Address:</Text>
            <Text style={styles.addressValue}>{order.shipping_address}</Text>
            <Text style={styles.phoneValue}>📞 Contact: +91 {order.phone}</Text>
          </View>
        </View>

        {/* Payment & Bill Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Method:</Text>
            <Text style={styles.billValue}>
              {order.payment_method?.toUpperCase() || 'UPI / COD'}
            </Text>
          </View>

          {order.transaction_id && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Transaction UTR:</Text>
              <Text style={[styles.billValue, { color: COLORS.gold }]}>
                {order.transaction_id}
              </Text>
            </View>
          )}

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Total Price:</Text>
            <Text style={styles.billTotal}>{formatCurrency(order.total_price)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Get WhatsApp Invoice Receipt 💬"
            variant="primary"
            onPress={handleOpenWhatsAppReceipt}
            style={{ marginBottom: SPACING.md }}
          />

          {isPending && (
            <Button
              title="Cancel Order ✕"
              variant="danger"
              onPress={handleCancelOrder}
              loading={cancelling}
            />
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gold,
    marginTop: 2,
  },
  orderDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    letterSpacing: 0.3,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemImage: {
    width: 64,
    height: 70,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighlight,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemMetaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  itemSize: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemQty: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gold,
  },
  addressBox: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  addressLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addressValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginVertical: 4,
  },
  phoneValue: {
    fontSize: 12,
    color: COLORS.textGold,
    fontWeight: '600',
    marginTop: 2,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  billLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.gold,
  },
  actionButtons: {
    marginTop: SPACING.xs,
  },
});
