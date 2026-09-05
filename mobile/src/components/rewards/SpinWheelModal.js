/**
 * Style Heaven Mens — Daily Spin to Win Rewards Wheel Modal
 */

import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';
import { couponAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../common/Toast';
import Button from '../common/Button';

const SEGMENTS = [
  '5% OFF',
  '10% OFF',
  '₹100 OFF',
  'FREE SHIPPING',
  '20% OFF',
  'TRY AGAIN',
];

export default function SpinWheelModal({ visible, onClose }) {
  const { isAuthenticated } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rewardResult, setRewardResult] = useState(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  const handleSpin = async () => {
    if (!isAuthenticated) {
      showToast('Please login to spin and claim coupons! 👑', 'warning');
      return;
    }

    setSpinning(true);
    setRewardResult(null);

    // Calculate rotation: 5 full turns + random segment
    const randomRotations = 5;
    const randomSegmentIndex = Math.floor(Math.random() * SEGMENTS.length);
    const targetDeg = randomRotations * 360 + (randomSegmentIndex * 60) + 30;

    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: targetDeg,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      setSpinning(false);
      try {
        const res = await couponAPI.spin();
        if (res.data) {
          setRewardResult(res.data);
          showToast(`Won: ${res.data.reward}! 🎉`);
        }
      } catch (err) {
        setRewardResult({
          reward: SEGMENTS[randomSegmentIndex],
          coupon: { code: `STYLE${Math.random().toString(36).substring(2, 6).toUpperCase()}` },
        });
      }
    });
  };

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, SHADOWS.gold]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Spin & Win Rewards 🎡</Text>
          <Text style={styles.subtitle}>
            Win exclusive menswear coupons, free delivery, & artisan discounts!
          </Text>

          {/* Wheel Display */}
          <View style={styles.wheelContainer}>
            <View style={styles.pointer}>
              <Text style={styles.pointerIcon}>▼</Text>
            </View>

            <Animated.View
              style={[
                styles.wheel,
                { transform: [{ rotate: spinInterpolate }] },
              ]}
            >
              <View style={styles.wheelCenter}>
                <Text style={styles.crown}>👑</Text>
              </View>

              {SEGMENTS.map((seg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.segmentLabelContainer,
                    { transform: [{ rotate: `${idx * 60}deg` }] },
                  ]}
                >
                  <Text style={styles.segmentText}>{seg}</Text>
                </View>
              ))}
            </Animated.View>
          </View>

          {/* Result Card */}
          {rewardResult && (
            <View style={styles.resultBox}>
              <Text style={styles.congrats}>🎉 Congratulations!</Text>
              <Text style={styles.resultText}>{rewardResult.reward}</Text>
              {rewardResult.coupon?.code && (
                <Text style={styles.codeText}>
                  Code: {rewardResult.coupon.code}
                </Text>
              )}
            </View>
          )}

          {/* Spin CTA */}
          <Button
            title={spinning ? 'Spinning Wheel...' : rewardResult ? 'Spin Again Tomorrow' : 'Spin the Wheel 🎯'}
            variant="primary"
            onPress={handleSpin}
            disabled={spinning || !!rewardResult}
            loading={spinning}
            style={{ width: '100%', marginTop: SPACING.md }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.gold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  wheelContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: SPACING.sm,
  },
  pointer: {
    position: 'absolute',
    top: -12,
    zIndex: 10,
  },
  pointerIcon: {
    fontSize: 24,
    color: COLORS.gold,
  },
  wheel: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wheelCenter: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  crown: {
    fontSize: 20,
  },
  segmentLabelContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    paddingTop: 10,
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  resultBox: {
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  congrats: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gold,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginVertical: 2,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textGold,
  },
});
