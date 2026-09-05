/**
 * Style Heaven Mens — Optimized Product Grid Component
 */

import React from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import { COLORS, SPACING } from '../../constants/theme';

export default function ProductGrid({
  products = [],
  loading = false,
  refreshing = false,
  onRefresh = null,
  ListHeaderComponent = null,
  ListFooterComponent = null,
  emptyTitle = 'No Products Found',
  emptyDescription = 'Try clearing your search or adjusting your filters to see more results.',
  onEmptyAction = null,
  emptyActionText = 'Browse All Menswear',
  contentContainerStyle = null,
}) {
  if (loading && products.length === 0) {
    return (
      <View style={styles.skeletonContainer}>
        {ListHeaderComponent}
        <View style={styles.gridRow}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
        <View style={styles.gridRow}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
        <View style={styles.gridRow}>
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </View>
      </View>
    );
  }

  const renderItem = ({ item }) => <ProductCard product={item} />;

  const keyExtractor = (item, index) =>
    item?.id ? String(item.id) : `prod-${index}`;

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews={true}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
            colors={[COLORS.gold, COLORS.textGold]}
            progressBackgroundColor={COLORS.surfaceCard}
          />
        ) : undefined
      }
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={
        !loading ? (
          <EmptyState
            icon="🔍"
            title={emptyTitle}
            description={emptyDescription}
            buttonText={onEmptyAction ? emptyActionText : null}
            onButtonPress={onEmptyAction}
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.xxxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  skeletonContainer: {
    paddingHorizontal: SPACING.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
});
