/**
 * Style Heaven Mens — Reusable Styled Input Field
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = null,
  helperText = null,
  leftIcon = null,
  multiline = false,
  numberOfLines = 1,
  style = null,
  inputStyle = null,
  maxLength = undefined,
  editable = true,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordHidden, setIsPasswordHidden] = useState(secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedBorder,
          error && styles.errorBorder,
          !editable && styles.disabledInput,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={isPasswordHidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.textInput,
            multiline && { height: 24 * (numberOfLines || 3), textAlignVertical: 'top' },
            inputStyle,
          ]}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
          >
            <Text style={styles.eyeIcon}>
              {isPasswordHidden ? '👁️' : '🔒'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  focusedBorder: {
    borderColor: COLORS.gold,
  },
  errorBorder: {
    borderColor: COLORS.error,
  },
  disabledInput: {
    opacity: 0.6,
  },
  leftIconContainer: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    paddingVertical: SPACING.sm,
  },
  eyeBtn: {
    padding: SPACING.xs,
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
});
