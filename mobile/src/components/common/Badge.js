/**
 * Style Heaven Mens — Reusable Badge / Tag Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function Badge({
  label,
  variant = 'gold', // 'gold' | 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  size = 'md', // 'sm' | 'md'
  icon = null,
  style = null,
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'gold':
        return {
          bg: COLORS.goldMuted,
          border: COLORS.goldBorder,
          text: COLORS.textGold,
        };
      case 'success':
        return {
          bg: COLORS.successLight,
          border: 'rgba(34, 197, 94, 0.4)',
          text: COLORS.success,
        };
      case 'danger':
        return {
          bg: COLORS.errorLight,
          border: 'rgba(239, 68, 68, 0.4)',
          text: COLORS.error,
        };
      case 'warning':
        return {
          bg: COLORS.warningLight,
          border: 'rgba(245, 158, 11, 0.4)',
          text: COLORS.warning,
        };
      case 'info':
        return {
          bg: COLORS.infoLight,
          border: 'rgba(59, 130, 246, 0.4)',
          text: COLORS.info,
        };
      default:
        return {
          bg: COLORS.surfaceHighlight,
          border: COLORS.borderLight,
          text: COLORS.textSecondary,
        };
    }
  };

  const { bg, border, text } = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bg, borderColor: border },
        size === 'sm' ? styles.smallPadding : styles.mediumPadding,
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'sm' && { fontSize: 10 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  smallPadding: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  mediumPadding: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
