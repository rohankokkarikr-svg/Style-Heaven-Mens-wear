/**
 * Style Heaven Mens — Edit Profile Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Header from '../components/common/Header';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/common/Toast';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || user?.email || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateUser({ name: name.trim() });
      showToast('Profile updated successfully! ✨');
      navigation.goBack();
    } catch (e) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header title="Edit Profile" showBack={true} showCart={false} showWishlist={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formCard}>
          <Input
            label="Full Name *"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
          />

          <Input
            label="Registered Mobile Number"
            value={phone}
            editable={false}
            helperText="Mobile number cannot be changed once verified."
          />

          <Button
            title={saving ? 'Saving...' : 'Save Profile Changes ✨'}
            variant="primary"
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: SPACING.md }}
          />
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
  },
  formCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
});
