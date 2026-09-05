/**
 * Style Heaven Mens — Offline Connectivity Banner
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

export default function OfflineBanner({ isOffline = false }) {
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>
        Offline Mode: Browsing cached artisan catalog. Changes will sync when connected.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#854D0E',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 12,
    marginRight: 6,
  },
  text: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
