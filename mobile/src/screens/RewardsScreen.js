/**
 * Style Heaven Mens — Rewards & Loyalty Program Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Header from '../components/common/Header';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import SpinWheelModal from '../components/rewards/SpinWheelModal';
import { authAPI, couponAPI } from '../services/api';
import { showToast } from '../components/common/Toast';
import { formatCurrency } from '../constants/config';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

export default function RewardsScreen({ navigation }) {
  const [rewardsData, setRewardsData] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinModalVisible, setSpinModalVisible] = useState(false);

  useEffect(() => {
    const fetchAllRewards = async () => {
      try {
        const [rewRes, cpnRes, leadRes] = await Promise.allSettled([
          authAPI.getRewards(),
          couponAPI.getMyCoupons(),
          authAPI.getLeaderboard(),
        ]);

        if (rewRes.status === 'fulfilled' && rewRes.value.data) {
          setRewardsData(rewRes.value.data);
        }
        if (cpnRes.status === 'fulfilled' && Array.isArray(cpnRes.value.data)) {
          setCoupons(cpnRes.value.data);
        }
        if (leadRes.status === 'fulfilled' && Array.isArray(leadRes.value.data?.leaderboard)) {
          setLeaderboard(leadRes.value.data.leaderboard.slice(0, 10));
        }
      } catch (e) {
        console.warn('Rewards fetch notice', e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRewards();
  }, []);

  const handleCopyCode = async (code) => {
    await Clipboard.setStringAsync(code);
    showToast(`Coupon "${code}" copied! 📋`);
  };

  const progress = rewardsData?.progress || 0;
  const threshold = rewardsData?.rewardThreshold || 10;
  const progressPercent = Math.min(100, Math.round((progress / threshold) * 100));

  return (
    <View style={styles.container}>
      <Header title="Rewards & Loyalty" showBack={true} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Milestone Card: 10 Items = Free Item */}
        <View style={[styles.milestoneCard, SHADOWS.gold]}>
          <View style={styles.milestoneHeader}>
            <View>
              <Text style={styles.milestoneTag}>★ Milestone Reward</Text>
              <Text style={styles.milestoneTitle}>Order 10 Items & Get 1 Free!</Text>
            </View>
            <Badge
              label={rewardsData?.membershipLevel || 'Bronze Tier'}
              variant="gold"
              size="sm"
            />
          </View>

          <Text style={styles.milestoneDesc}>
            Receive a free handcrafted menswear item or 100% discount voucher once you complete 10 delivered items.
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                Progress: <Text style={styles.boldText}>{progress} / {threshold} Items</Text>
              </Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>

          {rewardsData?.rewardsEarned > 0 ? (
            <View style={styles.rewardUnlockedBox}>
              <Text style={styles.unlockedIcon}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.unlockedTitle}>Free Reward Coupon Unlocked!</Text>
                <Text style={styles.unlockedCode}>
                  Code: {rewardsData?.history?.[1]?.code || 'FREESHIRT10'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleCopyCode(rewardsData?.history?.[1]?.code || 'FREESHIRT10')}
                style={styles.copyBtn}
              >
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.neededText}>
              🔥 Order {rewardsData?.needed || 10} more items to unlock your free luxury garment!
            </Text>
          )}

          {/* Spin Wheel CTA */}
          <Button
            title="Spin the Daily Fortune Wheel 🎡"
            variant="primary"
            onPress={() => setSpinModalVisible(true)}
            style={styles.spinButton}
          />
        </View>

        {/* My Active Coupons */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Active Coupons ({coupons.length})</Text>

          {coupons.length > 0 ? (
            coupons.map((cpn) => (
              <View key={cpn.id} style={styles.couponCard}>
                <View style={styles.couponLeft}>
                  <Text style={styles.couponCode}>{cpn.code}</Text>
                  <Text style={styles.couponExpiry}>
                    Expires: {new Date(cpn.expiry_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.couponRight}>
                  <Text style={styles.couponValue}>
                    {cpn.discount_type === 'percentage'
                      ? `${cpn.discount_value}% OFF`
                      : `₹${cpn.discount_value} OFF`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleCopyCode(cpn.code)}
                    style={styles.couponCopyBtn}
                  >
                    <Text style={styles.couponCopyText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noCouponsBox}>
              <Text style={styles.noCouponsText}>
                No active coupons. Spin the wheel to claim exclusive discount codes!
              </Text>
            </View>
          )}
        </View>

        {/* VIP Leaderboard */}
        {leaderboard.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Gentlemen's VIP Leaderboard 🏆</Text>

            <View style={styles.leaderboardTable}>
              {leaderboard.map((user, idx) => (
                <View
                  key={user.id || idx}
                  style={[
                    styles.leaderboardRow,
                    idx === 0 && styles.firstRankRow,
                  ]}
                >
                  <Text style={styles.rankNumber}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </Text>
                  <View style={styles.leaderboardUser}>
                    <Text style={styles.leaderboardName} numberOfLines={1}>
                      {user.name || 'Artisan Enthusiast'}
                    </Text>
                    <Text style={styles.leaderboardLevel}>{user.membershipLevel || 'Member'}</Text>
                  </View>
                  <Text style={styles.leaderboardSpent}>
                    {formatCurrency(user.totalSpent)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Spin Wheel Modal */}
      <SpinWheelModal
        visible={spinModalVisible}
        onClose={() => setSpinModalVisible(false)}
      />
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
  milestoneCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  milestoneTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    textTransform: 'uppercase',
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  milestoneDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginVertical: SPACING.sm,
  },
  progressSection: {
    marginVertical: SPACING.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  boldText: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gold,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.full,
  },
  neededText: {
    fontSize: 11,
    color: COLORS.textGold,
    fontWeight: '700',
    marginVertical: SPACING.xs,
  },
  rewardUnlockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  unlockedIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  unlockedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.gold,
  },
  unlockedCode: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.xs,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  spinButton: {
    marginTop: SPACING.md,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  couponLeft: {
    flex: 1,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  couponExpiry: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  couponRight: {
    alignItems: 'flex-end',
  },
  couponValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.success,
  },
  couponCopyBtn: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.surfaceHighlight,
  },
  couponCopyText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  noCouponsBox: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  noCouponsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  leaderboardTable: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  firstRankRow: {
    backgroundColor: COLORS.goldMuted,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '800',
    width: 32,
    textAlign: 'center',
  },
  leaderboardUser: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  leaderboardName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  leaderboardLevel: {
    fontSize: 10,
    color: COLORS.gold,
    marginTop: 2,
  },
  leaderboardSpent: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
