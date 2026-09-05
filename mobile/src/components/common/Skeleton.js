/**
 * Style Heaven Mens — Skeleton Placeholders
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export function SkeletonItem({ width = '100%', height = 20, borderRadius = RADIUS.sm, style = null }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.productCardSkeleton}>
      <SkeletonItem width="100%" height={160} borderRadius={RADIUS.md} />
      <View style={{ marginTop: 8 }}>
        <SkeletonItem width="80%" height={14} />
        <SkeletonItem width="50%" height={12} style={{ marginTop: 6 }} />
        <SkeletonItem width="60%" height={16} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCardSkeleton}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SkeletonItem width="40%" height={16} />
        <SkeletonItem width="25%" height={16} />
      </View>
      <SkeletonItem width="100%" height={60} style={{ marginVertical: 12 }} />
      <SkeletonItem width="30%" height={18} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: COLORS.surfaceHighlight,
  },
  productCardSkeleton: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    flex: 1,
    marginHorizontal: 4,
  },
  orderCardSkeleton: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
});
