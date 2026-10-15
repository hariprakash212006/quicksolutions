import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, ShoppingBag, User, Heart, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const MobileBottomNav: React.FC = () => {
  const { cart, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { user } = useAuth();
  const location = useLocation();

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // Hide on checkout, admin, and product detail (product detail has its own sticky buy bar)
  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/product/')
  ) {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Shop', path: '/shop' },
    ...(user?.role === 'admin'
      ? [{ icon: ShieldCheck, label: 'Admin', path: '/admin' }]
      : [{ icon: Heart, label: 'Wishlist', path: user ? '/account?tab=wishlist' : '/login', badge: wishlistCount }]
    ),
    { icon: ShoppingBag, label: 'Cart', path: '#', isCart: true, badge: cartItemsCount },
    { icon: User, label: user ? 'Account' : 'Sign In', path: user ? '/account' : '/login' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-t border-slate-200/70 dark:border-slate-800/70 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around h-15 px-1 py-1">
        {navItems.map((item) => {
          if (item.isCart) {
            return (
              <button
                key={item.label}
                onClick={() => setIsCartOpen(true)}
                className="relative flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-all active:scale-90"
                aria-label="Open Shopping Cart"
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 stroke-[2.2px]" />
                  <AnimatePresence>
                    {item.badge !== undefined && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-2.5 bg-brand-600 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-sm"
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[10px] font-bold tracking-tight mt-1 opacity-80">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon
                      className={`w-5 h-5 transition-transform ${
                        isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-[2px]'
                      }`}
                    />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold tracking-tight mt-1 transition-all ${
                      isActive ? 'opacity-100 font-extrabold' : 'opacity-80'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-active-indicator"
                      className="absolute -bottom-1 w-5 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
