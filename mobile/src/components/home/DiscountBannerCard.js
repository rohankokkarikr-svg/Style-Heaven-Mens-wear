/**
 * Style Heaven Mens — Promotional Discount Banner Card
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import { showToast } from '../common/Toast';

export default function DiscountBannerCard() {
  const { settings } = useSettings();
  const banner = settings?.discountBanner;

  if (!banner || !banner.isActive) return null;

  const handleCopyCode = async () => {
    if (banner.code) {
      await Clipboard.setStringAsync(banner.code);
      showToast(`Coupon "${banner.code}" copied to clipboard! 📋`);
    }
  };

  return (
    <View style={[styles.container, SHADOWS.gold]}>
      <View style={styles.topRow}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagIcon}>🏷️</Text>
          <Text style={styles.tagText}>{banner.title || 'Special Offer'}</Text>
        </View>

        {banner.code && (
          <TouchableOpacity
            style={styles.codePill}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <Text style={styles.codeText}>CODE: {banner.code}</Text>
            <Text style={styles.copyIcon}>📋</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.description}>{banner.description}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.discountHighlight}>
          UP TO {banner.discountPercentage || 30}% OFF
        </Text>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={handleCopyCode}
        >
          <Text style={styles.applyBtnText}>Tap to Copy Code →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldMuted,
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tagIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  tagText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.md,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  codeText: {
    color: COLORS.textGold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  copyIcon: {
    fontSize: 10,
    marginLeft: 4,
  },
  description: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  discountHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gold,
  },
  applyBtn: {
    paddingVertical: 2,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
