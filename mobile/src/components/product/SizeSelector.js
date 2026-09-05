/**
 * Style Heaven Mens — Size Selector & Quantity Stepper
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export function SizeSelector({
  sizes = ['S', 'M', 'L', 'XL', 'XXL'],
  selectedSize,
  onSelectSize,
  style = null,
}) {
  const displaySizes =
    Array.isArray(sizes) && sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <View style={[styles.sizeContainer, style]}>
      <Text style={styles.sectionLabel}>Select Size</Text>
      <View style={styles.sizePillsRow}>
        {displaySizes.map((size) => {
          const isSelected = selectedSize === size;
          return (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizePill,
                isSelected && styles.selectedSizePill,
              ]}
              onPress={() => onSelectSize(size)}
            >
              <Text
                style={[
                  styles.sizeText,
                  isSelected && styles.selectedSizeText,
                ]}
              >
                {size}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function QuantityStepper({
  quantity = 1,
  onIncrement,
  onDecrement,
  min = 1,
  max = 99,
  style = null,
}) {
  return (
    <View style={[styles.stepperContainer, style]}>
      <TouchableOpacity
        style={[styles.stepperBtn, quantity <= min && styles.disabledStepperBtn]}
        onPress={onDecrement}
        disabled={quantity <= min}
      >
        <Text style={styles.stepperBtnText}>-</Text>
      </TouchableOpacity>

      <View style={styles.quantityDisplay}>
        <Text style={styles.quantityText}>{quantity}</Text>
      </View>

      <TouchableOpacity
        style={[styles.stepperBtn, quantity >= max && styles.disabledStepperBtn]}
        onPress={onIncrement}
        disabled={quantity >= max}
      >
        <Text style={styles.stepperBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sizeContainer: {
    marginVertical: SPACING.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  sizePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sizePill: {
    minWidth: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  selectedSizePill: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.gold,
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  selectedSizeText: {
    color: COLORS.gold,
  },
  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledStepperBtn: {
    opacity: 0.3,
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gold,
  },
  quantityDisplay: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
});
