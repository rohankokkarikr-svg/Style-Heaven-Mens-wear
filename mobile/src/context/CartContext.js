/**
 * Style Heaven Mens — Mobile Cart Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '../services/storage';
import { APP_CONFIG } from '../constants/config';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState(null);

  // Restore cart on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const saved = await storage.getCart();
        if (Array.isArray(saved)) {
          setItems(saved);
        }
      } catch (e) {
        console.warn('Failed to load cart from storage', e);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    if (!loading) {
      storage.setCart(items);
    }
  }, [items, loading]);

  const addToCart = (product, size = 'Standard', quantity = 1) => {
    if (!product || !product.id) return;
    const key = `${product.id}-${size}`;

    setItems((prev) => {
      const exists = prev.find((i) => i.key === key);
      if (exists) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { key, product, size, quantity }];
    });
  };

  const removeFromCart = (key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const updateQuantity = (key, quantity) => {
    if (quantity < 1) {
      removeFromCart(key);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  const applyCoupon = (couponObj) => {
    setCoupon(couponObj);
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  // Calculations
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1),
    0
  );

  let discountAmount = 0;
  if (coupon) {
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * (coupon.discount_value || 0)) / 100);
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = Math.min(coupon.discount_value || 0, subtotal);
    }
  }

  const deliveryFee =
    subtotal === 0 || subtotal >= APP_CONFIG.freeShippingThreshold || coupon?.discount_type === 'free_shipping'
      ? 0
      : APP_CONFIG.defaultDeliveryFee;

  const totalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        totalItems,
        subtotal,
        discountAmount,
        deliveryFee,
        totalAmount,
        coupon,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};

export default CartContext;
