import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Eye, Heart, Check, AlertTriangle } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);
  const wishlisted = isWishlisted(product._id);
  

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const lowStock = product.stock > 0 && product.stock < 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-soft hover:shadow-premium transition-all duration-500 flex flex-col overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-slate-50/50 dark:bg-slate-800/30 p-3 sm:p-6 flex items-center justify-center">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700 ease-out"
        />

        {/* Top Badges */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-col gap-1 sm:gap-2 z-10">
          {product.discount > 0 && (
            <span className="bg-brand-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md shadow-sm tracking-wide">
              -{product.discount}%
            </span>
          )}
          {product.bestSeller && (
            <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md shadow-sm tracking-wide">
              BESTSELLER
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await toggleWishlist(product);
          }}
          className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 p-1.5 sm:p-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition hover:scale-110 active:scale-95"
          title={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${wishlisted ? 'fill-red-500 stroke-red-500' : 'stroke-slate-500 dark:stroke-slate-400 group-hover:stroke-slate-800 dark:group-hover:stroke-slate-200'}`}
          />
        </button>

        {/* Quick View overlay */}
        <Link
          to={`/product/${product.slug}`}
          className="absolute inset-0 z-0 opacity-0 lg:group-hover:opacity-100 transition-opacity bg-white/20 dark:bg-slate-900/40 backdrop-blur-[2px] hidden lg:flex items-center justify-center"
        >
          <span className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-out">
            <Eye className="w-4 h-4" /> Quick View
          </span>
        </Link>
      </div>

      {/* Details Section */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between relative bg-white dark:bg-transparent">
        <div>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
              {product.brand}
            </span>
          </div>

          <Link to={`/product/${product.slug}`}>
            <h3 className="text-xs sm:text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="pt-2 sm:pt-4 mt-auto flex items-end justify-between relative">
          <div className="flex flex-col">
            {product.mrp > product.sellingPrice && (
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 line-through font-medium">
                ₹{product.mrp.toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              ₹{product.sellingPrice.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Premium Add to Cart Button */}
          <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
             <AnimatePresence mode="wait">
              {added ? (
                <motion.div
                  key="added"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              ) : (
                <motion.button
                  key="add"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="absolute inset-0 bg-slate-900 hover:bg-brand-600 dark:bg-white dark:hover:bg-brand-500 text-white dark:text-slate-900 rounded-full flex items-center justify-center transition-colors shadow-md disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {lowStock && (
          <div className="mt-2 sm:mt-3 flex items-center gap-1 sm:gap-1.5 text-amber-600 dark:text-amber-400 text-[9px] sm:text-[11px] font-medium leading-tight">
            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            Only {product.stock} left in stock
          </div>
        )}
      </div>
    </motion.div>
  );
};


