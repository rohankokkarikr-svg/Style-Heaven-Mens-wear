/**
 * Style Heaven Mens — Mobile Wishlist Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '../services/storage';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const saved = await storage.getWishlist();
        if (Array.isArray(saved)) {
          setWishlist(saved);
        }
      } catch (e) {
        console.warn('Failed to load wishlist from storage', e);
      } finally {
        setLoading(false);
      }
    };
    loadWishlist();
  }, []);

  useEffect(() => {
    if (!loading) {
      storage.setWishlist(wishlist);
    }
  }, [wishlist, loading]);

  const addToWishlist = (product) => {
    if (!product || !product.id) return;
    setWishlist((prev) => {
      if (prev.some((item) => String(item.id) === String(product.id))) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((item) => String(item.id) !== String(productId)));
  };

  const toggleWishlist = (product) => {
    if (!product || !product.id) return;
    const exists = wishlist.some((item) => String(item.id) === String(product.id));
    if (exists) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => String(item.id) === String(productId));
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        totalWishlistItems: wishlist.length,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
};

export default WishlistContext;
