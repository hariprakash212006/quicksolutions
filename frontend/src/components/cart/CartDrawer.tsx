import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal, total, shipping, shippingConfig } = useCart();
  const navigate = useNavigate();

  const isAllFree = shippingConfig?.allProductsFreeShipping ?? false;
  const freeThreshold = shippingConfig?.freeShippingThreshold ?? 2000;
  const isThresholdEnabled = shippingConfig?.enabled !== false;
  const freeShippingProgress = isAllFree ? 100 : Math.min((subtotal / freeThreshold) * 100, 100);
  const remaining = Math.max(0, freeThreshold - subtotal);

  if (!isCartOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Shopping Cart</h2>
                <span className="text-xs bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded-full font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Bar */}
            {cart.length > 0 && isThresholdEnabled && (
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                {isAllFree ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>🎉 Free Express Delivery active on all items!</span>
                  </div>
                ) : subtotal >= freeThreshold ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <Zap className="w-4 h-4" />
                    🎉 You've unlocked FREE shipping!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Add <span className="font-bold text-brand-600 dark:text-brand-400">₹{remaining.toLocaleString('en-IN')}</span> more for free shipping
                    </p>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${freeShippingProgress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-base">Your cart is empty</p>
                    <p className="text-xs mt-1">Explore CCTV cameras and RO water purifiers</p>
                  </div>
                  <button
                    onClick={() => { setIsCartOpen(false); navigate('/shop'); }}
                    className="mt-2 px-6 py-2.5 bg-brand-600 text-white font-semibold text-sm rounded-xl hover:bg-brand-500 transition"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map(({ product, quantity }) => (
                    <motion.div
                      key={product._id}
                      layout
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
                    >
                      <div className="w-16 h-16 shrink-0 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                            {product.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{product.brand}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                            <button
                              onClick={() => updateQuantity(product._id, quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-base font-bold transition active:bg-slate-200"
                            >
                              −
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[28px] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product._id, quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-base font-bold transition active:bg-slate-200"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                            ₹{(product.sellingPrice * quantity).toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => removeFromCart(product._id)}
                            className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="p-4 pb-safe border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Estimated Shipping</span>
                    <span>
                      {shipping === 0
                        ? <span className="text-emerald-500 font-bold">FREE</span>
                        : `₹${shipping.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Amount</span>
                    <span className="text-brand-600 dark:text-brand-400">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
                  className="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20 transition transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>100% Secure Checkout & Razorpay Protection</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

