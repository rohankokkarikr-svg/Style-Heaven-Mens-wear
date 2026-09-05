/**
 * Style Heaven Mens — Horizontal Category Pills
 */

import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { HANDICRAFT_CATEGORIES } from '../../constants/handicraftsData';

export default function CategoryPills({
  activeCategory = 'all',
  onSelectCategory = null,
}) {
  const navigation = useNavigation();

  const handlePress = (slug) => {
    if (onSelectCategory) {
      onSelectCategory(slug);
    } else {
      if (slug === 'all') {
        navigation.navigate('CategoriesTab');
      } else {
        navigation.navigate('ProductList', { category: slug });
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <TouchableOpacity
          style={[
            styles.pill,
            activeCategory === 'all' && styles.activePill,
          ]}
          onPress={() => handlePress('all')}
        >
          <Text style={styles.icon}>✨</Text>
          <Text
            style={[
              styles.pillText,
              activeCategory === 'all' && styles.activePillText,
            ]}
          >
            All Collections
          </Text>
        </TouchableOpacity>

        {HANDICRAFT_CATEGORIES.map((cat) => {
          const isActive =
            activeCategory.toLowerCase() === cat.slug.toLowerCase() ||
            activeCategory.toLowerCase() === cat.name.toLowerCase();

          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, isActive && styles.activePill]}
              onPress={() => handlePress(cat.slug)}
            >
              <Text style={styles.icon}>{cat.icon || '🧵'}</Text>
              <Text
                style={[
                  styles.pillText,
                  isActive && styles.activePillText,
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  scrollContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  activePill: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.gold,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activePillText: {
    color: COLORS.gold,
  },
});
