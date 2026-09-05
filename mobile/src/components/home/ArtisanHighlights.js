/**
 * Style Heaven Mens — Artisan Highlights & Testimonials
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export function ArtisanHighlights({ artisans = [] }) {
  const navigation = useNavigation();

  if (!artisans || artisans.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.badgeLabel}>Master Craftsmen</Text>
          <Text style={styles.sectionTitle}>Meet the Artisans</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.artisansScroll}
      >
        {artisans.map((art) => {
          const storeName = art.store_name || 'Artisan Workshop';
          const initial = storeName[0]?.toUpperCase() || 'A';

          return (
            <TouchableOpacity
              key={art.id}
              style={styles.artisanCard}
              onPress={() => navigation.navigate('ArtisanStore', { artisanId: art.id, artisan: art })}
            >
              {art.profile_image ? (
                <Image
                  source={{ uri: art.profile_image }}
                  style={styles.artisanAvatar}
                />
              ) : (
                <View style={styles.artisanAvatarFallback}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}

              <Text style={styles.artisanName} numberOfLines={1}>
                {storeName}
              </Text>
              <Text style={styles.specialization} numberOfLines={1}>
                {art.specialization || art.artisan_type || 'Master Weaver'}
              </Text>
              <Text style={styles.location} numberOfLines={1}>
                📍 {art.location || 'India'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function TestimonialsList() {
  const reviews = [
    {
      id: 1,
      name: 'Vikramaditya S.',
      rating: 5,
      comment: 'The Banarasi silk kurta fit like a bespoke dream. The craftsmanship is breathtaking!',
      city: 'Bangalore',
    },
    {
      id: 2,
      name: 'Aditya Mehta',
      rating: 5,
      comment: 'Authentic hand-block prints and direct artisan connection. Best menswear store.',
      city: 'Mumbai',
    },
    {
      id: 3,
      name: 'Raghavan Iyer',
      rating: 5,
      comment: 'Super fast delivery and the brass cufflinks look incredibly royal.',
      city: 'Chennai',
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.badgeLabel}>Customer Love</Text>
          <Text style={styles.sectionTitle}>Gentlemen's Reviews</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.artisansScroll}
      >
        {reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.starsRow}>
              {'★★★★★'.split('').map((star, i) => (
                <Text key={i} style={styles.star}>
                  {star}
                </Text>
              ))}
            </View>
            <Text style={styles.comment}>"{r.comment}"</Text>
            <View style={styles.reviewerRow}>
              <Text style={styles.reviewerName}>{r.name}</Text>
              <Text style={styles.reviewerCity}>• {r.city}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: SPACING.md,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  artisansScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  artisanCard: {
    width: 140,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  artisanAvatar: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    marginBottom: SPACING.sm,
  },
  artisanAvatarFallback: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldMuted,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gold,
  },
  artisanName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  specialization: {
    fontSize: 10,
    color: COLORS.gold,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  location: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  // Reviews
  reviewCard: {
    width: 240,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  star: {
    color: COLORS.gold,
    fontSize: 12,
    marginRight: 2,
  },
  comment: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
    minHeight: 54,
  },
  reviewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  reviewerName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reviewerCity: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
});
