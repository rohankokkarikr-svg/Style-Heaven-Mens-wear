/**
 * Style Heaven Mens — Login Screen
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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async () => {
    const errs = {};
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Please enter valid 10-digit mobile number';
    }
    if (!password) {
      errs.password = 'Please enter password';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const user = await login(cleanPhone.slice(0, 10), password);
      showToast(`Welcome back, ${user.name}! 👑`);
      navigation.goBack();
    } catch (err) {
      showToast(err.response?.data?.error || 'Invalid mobile number or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header title="Login" showBack={true} showCart={false} showWishlist={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.brandHeader}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to access your orders, wishlist, & daily spin rewards.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Input
            label="Mobile Number (10 digits) *"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            maxLength={10}
            error={errors.phone}
          />

          <Input
            label="Password *"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your account password"
            secureTextEntry={true}
            error={errors.password}
          />

          <Button
            title="Login to Account 🚀"
            variant="primary"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.signupPrompt}>
            <Text style={styles.promptText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up Here →</Text>
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
    marginVertical: SPACING.xl,
  },
  crown: {
    fontSize: 40,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
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
  submitBtn: {
    marginTop: SPACING.sm,
  },
  signupPrompt: {
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
  signupLink: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.gold,
  },
});
