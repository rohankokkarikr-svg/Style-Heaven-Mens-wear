/**
 * Style Heaven Mens — Profile & Account Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import Header from '../components/common/Header';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { APP_CONFIG } from '../constants/config';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function ProfileScreen({ navigation }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalWishlistItems } = useWishlist();

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent('Hello Style Heaven Mens, I would like assistance with my order / shopping.');
    Linking.openURL(`https://wa.me/${APP_CONFIG.supportWhatsapp}?text=${text}`).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp. Please check if it is installed.');
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    {
      id: 'orders',
      title: 'My Orders',
      subtitle: 'Track, view, or cancel placed orders',
      icon: '📦',
      badge: null,
      onPress: () => (isAuthenticated ? navigation.navigate('Orders') : navigation.navigate('Login')),
    },
    {
      id: 'wishlist',
      title: 'My Wishlist',
      subtitle: 'Saved handcrafted items',
      icon: '❤️',
      badge: totalWishlistItems > 0 ? `${totalWishlistItems} items` : null,
      onPress: () => navigation.navigate('Wishlist'),
    },
    {
      id: 'rewards',
      title: 'Rewards & Leaderboard',
      subtitle: 'Earn free items & daily spin rewards',
      icon: '🎡',
      badge: 'FREE GIFTS',
      onPress: () => (isAuthenticated ? navigation.navigate('Rewards') : navigation.navigate('Login')),
    },
    {
      id: 'support',
      title: 'Artisan Support & WhatsApp',
      subtitle: 'Chat directly with our styling team',
      icon: '💬',
      badge: '24/7',
      onPress: handleOpenWhatsApp,
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="My Account" showSearch={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          {isAuthenticated ? (
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || 'Valued Customer'}
                  </Text>
                  <Badge label="Elite Member" variant="gold" size="sm" />
                </View>
                <Text style={styles.userPhone}>+91 {user?.email || user?.phone || 'Customer'}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditProfile')}
                  style={styles.editProfileLink}
                >
                  <Text style={styles.editProfileText}>Edit Profile Details →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.guestContainer}>
              <Text style={styles.guestTitle}>Welcome to Style Heaven Mens</Text>
              <Text style={styles.guestSubtitle}>
                Login to access saved orders, redeem spin rewards, and receive exclusive offers.
              </Text>
              <View style={styles.authButtonsRow}>
                <Button
                  title="Login"
                  variant="primary"
                  onPress={() => navigation.navigate('Login')}
                  style={{ flex: 1, marginRight: SPACING.sm }}
                />
                <Button
                  title="Sign Up"
                  variant="outline"
                  onPress={() => navigation.navigate('Signup')}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Quick Menu List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconCircle}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>

              <View style={styles.menuDetails}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>

              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Version & Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Style Heaven Menswear App</Text>
          <Text style={styles.infoVersion}>Version 1.0.0 (Production Release)</Text>
          <Text style={styles.infoCopyright}>
            © 2026 Style Heaven Mens. All Rights Reserved.
          </Text>
        </View>

        {/* Logout Button (if authenticated) */}
        {isAuthenticated && (
          <Button
            title="Logout from Account 🚪"
            variant="danger"
            onPress={handleLogout}
            style={styles.logoutBtn}
          />
        )}
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
    paddingBottom: 90,
  },
  profileCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldMuted,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.gold,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  editProfileLink: {
    marginTop: 6,
  },
  editProfileText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gold,
  },
  guestContainer: {
    alignItems: 'center',
    textAlign: 'center',
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  guestSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  authButtonsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  menuContainer: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuDetails: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  menuSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: SPACING.sm,
  },
  menuBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.gold,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.textMuted,
  },
  infoBox: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  infoVersion: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  infoCopyright: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    marginVertical: SPACING.md,
  },
});
