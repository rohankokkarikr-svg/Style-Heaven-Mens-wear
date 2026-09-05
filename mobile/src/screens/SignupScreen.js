/**
 * Style Heaven Mens — Signup Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Header from '../components/common/Header';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/common/Toast';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' | 'artisan'
  const [storeName, setStoreName] = useState('');
  const [artisanType, setArtisanType] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSignup = async () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Please enter your full name';
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Please enter valid 10-digit mobile number';
    }
    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (role === 'artisan' && !storeName.trim()) {
      errs.storeName = 'Please enter your workshop or store name';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const user = await signup({
        name: name.trim(),
        phone: cleanPhone.slice(0, 10),
        password,
        role,
        store_name: storeName.trim(),
        artisan_type: artisanType.trim(),
      });
      showToast(`Account created! Welcome, ${user.name} ✨`);
      navigation.navigate('HomeTab');
    } catch (err) {
      showToast(err.response?.data?.error || 'Registration failed. Please check details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header title="Create Account" showBack={true} showCart={false} showWishlist={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.brandHeader}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>Join Style Heaven Mens</Text>
          <Text style={styles.subtitle}>
            Experience luxury Indian handloom & artisanal menswear.
          </Text>
        </View>

        <View style={styles.formCard}>
          {/* Account Role Selector */}
          <Text style={styles.roleLabel}>I am joining as:</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'user' && styles.selectedRoleBtn]}
              onPress={() => setRole('user')}
            >
              <Text style={styles.roleIcon}>🛍️</Text>
              <Text style={[styles.roleText, role === 'user' && styles.selectedRoleText]}>
                Customer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, role === 'artisan' && styles.selectedRoleBtn]}
              onPress={() => setRole('artisan')}
            >
              <Text style={styles.roleIcon}>🧑‍🎨</Text>
              <Text style={[styles.roleText, role === 'artisan' && styles.selectedRoleText]}>
                Artisan / Creator
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Full Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rohan Sharma"
            error={errors.name}
          />

          <Input
            label="Mobile Number (10 digits) *"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
          />

          {role === 'artisan' && (
            <>
              <Input
                label="Store / Workshop Name *"
                value={storeName}
                onChangeText={setStoreName}
                placeholder="e.g. Royal Banarasi Silk Weavers"
                error={errors.storeName}
              />
              <Input
                label="Craft Specialization"
                value={artisanType}
                onChangeText={setArtisanType}
                placeholder="e.g. Handloom Weaving, Block Printing"
              />
            </>
          )}

          <Input
            label="Create Password *"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 6 characters"
            secureTextEntry={true}
            error={errors.password}
          />

          <Input
            label="Confirm Password *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            secureTextEntry={true}
            error={errors.confirmPassword}
          />

          <Button
            title="Create Account 🚀"
            variant="primary"
            onPress={handleSignup}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.loginPrompt}>
            <Text style={styles.promptText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login Here →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  brandHeader: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  crown: {
    fontSize: 36,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  selectedRoleBtn: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.gold,
  },
  roleIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  selectedRoleText: {
    color: COLORS.gold,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  promptText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gold,
  },
});
