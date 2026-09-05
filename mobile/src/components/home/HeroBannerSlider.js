/**
 * Style Heaven Mens — Hero Banner Carousel
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;

export default function HeroBannerSlider() {
  const navigation = useNavigation();
  const { settings } = useSettings();
  const slides = settings?.heroSlides || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeIndex, slides.length]);

  const onMomentumScrollEnd = (e) => {
    const newIndex = Math.round(
      e.nativeEvent.contentOffset.x / CARD_WIDTH
    );
    if (newIndex >= 0 && newIndex < slides.length) {
      setActiveIndex(newIndex);
    }
  };

  const renderSlide = ({ item }) => {
    return (
      <View style={styles.slideCard}>
        <Image
          source={{ uri: item.image }}
          style={styles.slideImage}
          resizeMode="cover"
        />
        <View style={styles.gradientOverlay} />

        <View style={styles.slideContent}>
          {item.badgeText ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badgeText}</Text>
            </View>
          ) : null}

          <Text style={styles.headline} numberOfLines={2}>
            {item.headline}
          </Text>

          <Text style={styles.subtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('CategoriesTab')}
          >
            <Text style={styles.ctaText}>Explore Collection →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        snapToInterval={CARD_WIDTH + SPACING.sm}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
      />

      {/* Pagination Dots */}
      <View style={styles.paginationRow}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              activeIndex === idx && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  slideCard: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    marginRight: SPACING.sm,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.55)',
  },
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  badge: {
    backgroundColor: COLORS.gold,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xs,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    color: COLORS.textDark,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  ctaButton: {
    backgroundColor: COLORS.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  activeDot: {
    width: 20,
    backgroundColor: COLORS.gold,
  },
});
