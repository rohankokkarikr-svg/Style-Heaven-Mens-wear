/**
 * Style Heaven Mens — Mobile Push Notification Service
 * Handles notification permissions, token registration, and local notification triggers
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import storage from './storage';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationsService = {
  /**
   * Request push notification permissions and obtain Expo push token
   */
  async registerForPushNotifications() {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted.');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      token = tokenData?.data || null;

      if (token) {
        await storage.set('@sh_push_token', token);
      }
    } catch (error) {
      console.warn('Error obtaining push notification token:', error.message);
    }

    return token;
  },

  /**
   * Trigger local order confirmation notification
   */
  async scheduleOrderConfirmation(orderId, total) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🛍️ Order Confirmed! — Style Heaven Mens',
          body: `Thank you for your order #${orderId?.substring(0, 8)} of ₹${total?.toLocaleString()}. We are preparing your artisanal fashion items.`,
          data: { orderId, type: 'order_confirmed' },
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (e) {
      console.warn('Could not schedule local notification', e);
    }
  },

  /**
   * Trigger local promotional discount notification
   */
  async schedulePromoNotification(title, message) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || '✨ Exclusive Menswear Offer!',
          body: message || 'Discover handcrafted fashion deals. Flat 30% OFF with code KALA30.',
          sound: true,
        },
        trigger: null,
      });
    } catch (e) {}
  },
};

export default notificationsService;
