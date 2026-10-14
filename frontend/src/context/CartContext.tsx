import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type { CartItem, Product, ShippingConfig } from '../types';

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string, discountAmount: number) => void;
  removeCoupon: () => void;
  shippingConfig: ShippingConfig;
  refreshShippingConfig: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('qs_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>({
    allProductsFreeShipping: false,
    freeShippingThreshold: 2000,
    defaultShippingFee: 99,
    enabled: true,
  });

  const refreshShippingConfig = async () => {
    try {
      const res = await axios.get('/api/cms');
      if (res.data?.success && res.data?.cms?.shippingConfig) {
        setShippingConfig(res.data.cms.shippingConfig);
      }
    } catch {
      // Fallback to default config
    }
  };

  useEffect(() => {
    refreshShippingConfig();
  }, []);

  useEffect(() => {
    localStorage.setItem('qs_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product._id === product._id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity = Math.min(product.stock, updated[existingIndex].quantity + quantity);
        return updated;
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product._id === productId
          ? { ...item, quantity: Math.min(item.product.stock, quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const applyCoupon = (code: string, discountAmount: number) => {
    setAppliedCoupon(code);
    setCouponDiscount(discountAmount);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const tax = Math.round(subtotal * 0.18);

  let shipping = 0;
  if (subtotal > 0) {
    if (shippingConfig.allProductsFreeShipping) {
      shipping = 0;
    } else if (!shippingConfig.enabled) {
      shipping = shippingConfig.defaultShippingFee ?? 99;
    } else if (subtotal >= (shippingConfig.freeShippingThreshold ?? 2000)) {
      shipping = 0;
    } else {
      const itemCharges = cart.reduce(
        (sum, item) => sum + (item.product.deliveryCharge || 0) * item.quantity,
        0
      );
      shipping = itemCharges > 0 ? itemCharges : (shippingConfig.defaultShippingFee ?? 99);
    }
  }

  const total = Math.max(0, subtotal + shipping - couponDiscount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        shipping,
        total,
        itemCount,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        shippingConfig,
        refreshShippingConfig,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
