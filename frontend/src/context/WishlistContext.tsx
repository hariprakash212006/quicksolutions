import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import type { Product } from '../types';

interface WishlistContextType {
  wishlist: Product[];
  wishlistIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<boolean>;
  loading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'qs_guest_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync wishlist from backend if authenticated or from localStorage if guest
  const refreshWishlist = useCallback(async () => {
    if (token) {
      setLoading(true);
      try {
        const res = await axios.get('/api/auth/wishlist');
        if (res.data.success) {
          const items: Product[] = res.data.wishlist || [];
          setWishlist(items);
          setWishlistIds(items.map((i) => i._id));
        }
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest localStorage fallback
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          const parsed: Product[] = JSON.parse(local);
          setWishlist(parsed);
          setWishlistIds(parsed.map((p) => p._id));
        } else {
          setWishlist([]);
          setWishlistIds([]);
        }
      } catch {
        setWishlist([]);
        setWishlistIds([]);
      }
    }
  }, [token]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isWishlisted = useCallback(
    (productId: string) => {
      return wishlistIds.includes(productId);
    },
    [wishlistIds]
  );

  const toggleWishlist = async (product: Product): Promise<boolean> => {
    const pId = product._id;
    const exists = wishlistIds.includes(pId);

    if (token) {
      try {
        const res = await axios.post(`/api/auth/wishlist/${pId}`);
        if (res.data.success) {
          const isAdded = res.data.isAdded !== undefined ? res.data.isAdded : !exists;
          if (isAdded) {
            setWishlist((prev) => [product, ...prev.filter((p) => p._id !== pId)]);
            setWishlistIds((prev) => [pId, ...prev.filter((id) => id !== pId)]);
          } else {
            setWishlist((prev) => prev.filter((p) => p._id !== pId));
            setWishlistIds((prev) => prev.filter((id) => id !== pId));
          }
          return isAdded;
        }
      } catch (err) {
        console.error('Wishlist toggle error:', err);
      }
    }

    // Guest fallback
    if (exists) {
      const nextList = wishlist.filter((p) => p._id !== pId);
      setWishlist(nextList);
      setWishlistIds(nextList.map((p) => p._id));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));
      return false;
    } else {
      const nextList = [product, ...wishlist];
      setWishlist(nextList);
      setWishlistIds([pId, ...wishlistIds]);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));
      return true;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistIds,
        isWishlisted,
        toggleWishlist,
        loading,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
