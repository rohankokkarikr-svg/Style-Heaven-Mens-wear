/**
 * Style Heaven Mens — Toast & Feedback Overlay
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

let showToastGlobal = null;

export const showToast = (message, type = 'success') => {
  if (showToastGlobal) {
    showToastGlobal(message, type);
  }
};

export default function Toast() {
  const [toast, setToast] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    showToastGlobal = (message, type) => {
      setToast({ message, type });
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToast(null);
      });
    };
    return () => {
      showToastGlobal = null;
    };
  }, [fadeAnim]);

  if (!toast) return null;

  const getBorderColor = () => {
    if (toast.type === 'error') return COLORS.error;
    if (toast.type === 'warning') return COLORS.warning;
    return COLORS.gold;
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        { borderColor: getBorderColor(), opacity: fadeAnim },
        SHADOWS.gold,
      ]}
    >
      <Text style={styles.toastIcon}>
        {toast.type === 'error' ? '⚠️' : toast.type === 'warning' ? '⚡' : '✨'}
      </Text>
      <Text style={styles.toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 85,
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    maxWidth: '90%',
  },
  toastIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  toastText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
