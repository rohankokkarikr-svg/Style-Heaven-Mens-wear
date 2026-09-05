/**
 * Style Heaven Mens — Order Card & Tracking Timeline
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
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { formatCurrency } from '../../constants/config';
import Badge from '../common/Badge';

export function OrderCard({ order, onCancel = null }) {
  const navigation = useNavigation();

  if (!order) return null;

  const items = order.items || [];
  const firstItem = items[0]?.product;
  const imageUrl =
    firstItem?.image_url ||
    firstItem?.image ||
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop';

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  const getStatusVariant = () => {
    switch (order.status?.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'cancelled':
        return 'danger';
      case 'payment_verification_pending':
        return 'warning';
      default:
        return 'gold';
    }
  };

  const isPending =
    order.status === 'pending' || order.status === 'payment_verification_pending';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => navigation.navigate('OrderDetail', { orderId: order.id, order })}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>
            Order #{order.id?.substring(0, 8)}
          </Text>
          <Text style={styles.orderDate}>{orderDate}</Text>
        </View>

        <Badge
          label={order.status?.replace(/_/g, ' ') || 'Pending'}
          variant={getStatusVariant()}
        />
      </View>

      {/* Items Preview */}
      <View style={styles.itemsRow}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {firstItem?.name || `${items.length} Artisanal Items`}
          </Text>
          <Text style={styles.itemMeta}>
            {items.length > 1 ? `+ ${items.length - 1} other item(s)` : `Size: ${items[0]?.size || 'Standard'}`}
          </Text>
          <Text style={styles.itemPrice}>
            Total: {formatCurrency(order.total_price)}
          </Text>
        </View>
      </View>

      {/* Bottom Action Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.detailsLink}>View Full Order Details →</Text>

        {isPending && onCancel && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => onCancel(order.id)}
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function OrderTimeline({ currentStatus = 'pending' }) {
  const steps = [
    { id: 'pending', label: 'Placed' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
  ];

  const getStepIndex = () => {
    const s = (currentStatus || '').toLowerCase();
    if (s === 'delivered') return 3;
    if (s === 'shipped') return 2;
    if (s === 'confirmed' || s === 'processing') return 1;
    return 0;
  };

  const activeIndex = getStepIndex();
  const isCancelled = (currentStatus || '').toLowerCase() === 'cancelled';

  if (isCancelled) {
    return (
      <View style={styles.cancelledContainer}>
        <Text style={styles.cancelledText}>❌ Order was Cancelled</Text>
      </View>
    );
  }

  return (
    <View style={styles.timelineContainer}>
      <View style={styles.timelineRow}>
        {steps.map((step, idx) => {
          const isDone = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <View style={styles.stepNode}>
                <View
                  style={[
                    styles.circle,
                    isDone && styles.doneCircle,
                    isCurrent && styles.currentCircle,
                  ]}
                >
                  <Text style={[styles.circleText, isDone && styles.doneText]}>
                    {isDone ? '✓' : idx + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isDone && styles.doneLabel,
                    isCurrent && styles.currentLabel,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connecting Line */}
              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.line,
                    idx < activeIndex && styles.doneLine,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  orderDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighlight,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  itemMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gold,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gold,
  },
  cancelBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
  },

  // Timeline
  timelineContainer: {
    marginVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNode: {
    alignItems: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneCircle: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.goldLight,
  },
  currentCircle: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  circleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  doneText: {
    color: COLORS.textDark,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 6,
  },
  doneLabel: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  currentLabel: {
    color: COLORS.gold,
    fontWeight: '800',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  doneLine: {
    backgroundColor: COLORS.gold,
  },
  cancelledContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  cancelledText: {
    color: COLORS.error,
    fontWeight: '800',
    fontSize: 13,
  },
});
