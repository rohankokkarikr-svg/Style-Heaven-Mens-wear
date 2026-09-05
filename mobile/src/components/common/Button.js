/**
 * Style Heaven Mens — Reusable Luxury Button
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon = null,
  style = null,
  textStyle = null,
}) {
  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.primaryBtn, SHADOWS.gold];
      case 'secondary':
        return styles.secondaryBtn;
      case 'outline':
        return styles.outlineBtn;
      case 'danger':
        return styles.dangerBtn;
      case 'ghost':
        return styles.ghostBtn;
      default:
        return styles.primaryBtn;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'ghost':
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24, minHeight: 54 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 18, minHeight: 46 };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        getContainerStyle(),
        getSizeStyle(),
        (disabled || loading) && styles.disabledBtn,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? COLORS.textDark : COLORS.gold}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: SPACING.sm,
  },
  baseText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Variants
  primaryBtn: {
    backgroundColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
  },
  primaryText: {
    color: COLORS.textDark,
  },
  secondaryBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  secondaryText: {
    color: COLORS.textPrimary,
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  outlineText: {
    color: COLORS.gold,
  },
  dangerBtn: {
    backgroundColor: COLORS.error,
  },
  dangerText: {
    color: COLORS.textPrimary,
  },
  ghostBtn: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: COLORS.textGold,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
