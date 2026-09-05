/**
 * Style Heaven Mens — Filter & Sorting Bottom Sheet Modal
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import Button from '../common/Button';

export default function FilterModal({
  visible,
  onClose,
  sortBy,
  onSelectSort,
  priceRange,
  onSelectPriceRange,
  material,
  onSelectMaterial,
  inStockOnly,
  onToggleInStockOnly,
  onReset,
}) {
  const sortOptions = [
    { id: 'popular', label: '★ Most Popular' },
    { id: 'newest', label: '✦ Newest Arrivals' },
    { id: 'price_asc', label: 'Price: Low to High' },
    { id: 'price_desc', label: 'Price: High to Low' },
    { id: 'rating', label: 'Highest Rated' },
  ];

  const priceRanges = [
    { id: 'all', label: 'All Prices' },
    { id: '0-1000', label: 'Under ₹1,000' },
    { id: '1000-2500', label: '₹1,000 – ₹2,500' },
    { id: '2500-5000', label: '₹2,500 – ₹5,000' },
    { id: '5000+', label: '₹5,000+' },
  ];

  const materials = [
    'all',
    'Silk',
    'Cotton',
    'Khadi',
    'Linen',
    'Brass',
    'Wood',
    'Clay',
    'Wool',
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter & Sort</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Sort By */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.chipsWrap}>
                {sortOptions.map((opt) => {
                  const active = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.chip, active && styles.activeChip]}
                      onPress={() => onSelectSort(opt.id)}
                    >
                      <Text style={[styles.chipText, active && styles.activeChipText]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              <View style={styles.chipsWrap}>
                {priceRanges.map((p) => {
                  const active = priceRange === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.chip, active && styles.activeChip]}
                      onPress={() => onSelectPriceRange(p.id)}
                    >
                      <Text style={[styles.chipText, active && styles.activeChipText]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Craft Material */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Artisan Material</Text>
              <View style={styles.chipsWrap}>
                {materials.map((m) => {
                  const active = material === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, active && styles.activeChip]}
                      onPress={() => onSelectMaterial(m)}
                    >
                      <Text style={[styles.chipText, active && styles.activeChipText]}>
                        {m === 'all' ? 'All Materials' : m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Availability Toggle */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => onToggleInStockOnly(!inStockOnly)}
              >
                <Text style={styles.toggleLabel}>In Stock Only</Text>
                <View
                  style={[
                    styles.checkbox,
                    inStockOnly && styles.checkedCheckbox,
                  ]}
                >
                  {inStockOnly && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Button
              title="Reset"
              variant="outline"
              onPress={onReset}
              style={{ flex: 1, marginRight: SPACING.sm }}
            />
            <Button
              title="Apply Filters"
              variant="primary"
              onPress={onClose}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderColor: COLORS.goldBorder,
    maxHeight: '80%',
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: COLORS.textMuted,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textGold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.gold,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeChipText: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.xs,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceCard,
  },
  checkedCheckbox: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  checkmark: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
