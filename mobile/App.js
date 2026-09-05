/**
 * Style Heaven Mens — Mobile Application Root Entry (App.js)
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { SettingsProvider } from './src/context/SettingsContext';
import Toast from './src/components/common/Toast';
import notificationsService from './src/services/notifications';

export default function App() {
  useEffect(() => {
    // Register for push notifications on app startup
    notificationsService.registerForPushNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <NavigationContainer
                theme={{
                  dark: true,
                  colors: {
                    primary: '#D4AF37',
                    background: '#0A0A0A',
                    card: '#121212',
                    text: '#FFFFFF',
                    border: '#262626',
                    notification: '#D4AF37',
                  },
                }}
              >
                <RootNavigator />
                <Toast />
              </NavigationContainer>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
