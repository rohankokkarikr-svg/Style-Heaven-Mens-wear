/**
 * Style Heaven Mens — Orders History & Tracking Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Header from '../components/common/Header';
import { OrderCard } from '../components/orders/OrderCard';
import { OrderCardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/common/Toast';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export default function OrdersScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled'

  const fetchOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await orderAPI.getMyOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      showToast('Could not load orders. Please try again.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCancelOrder = (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderAPI.cancelOrder(orderId);
              showToast('Order cancelled successfully');
              fetchOrders();
            } catch (err) {
              showToast(err.response?.data?.error || 'Failed to cancel order', 'error');
            }
          },
        },
      ]
    );
  };

  // Filter orders by tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') {
      return o.status === 'pending' || o.status === 'payment_verification_pending';
    }
    return o.status === activeTab;
  });

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'In Progress' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title="My Orders" showBack={true} />
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🔒"
            title="Login to View Orders"
            description="Please login to your Style Heaven Mens account to track your orders and view delivery history."
            buttonText="Login Now"
            onButtonPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Orders" showBack={true} />

      {/* Status Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          data={tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                style={[styles.tabBtn, isActive && styles.activeTabBtn]}
                onPress={() => setActiveTab(item.id)}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <OrderCard order={item} onCancel={handleCancelOrder} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.gold}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="📦"
              title="No Orders Found"
              description={
                activeTab === 'all'
                  ? "You haven't placed any orders yet. Explore our handcrafted collection!"
                  : `No orders with status "${activeTab}".`
              }
              buttonText={activeTab === 'all' ? 'Explore Menswear' : null}
              onButtonPress={() => navigation.navigate('CategoriesTab')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  tabsWrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.xs,
  },
  tabsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabBtn: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.gold,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.gold,
  },
  skeletonContainer: {
    padding: SPACING.lg,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
});
