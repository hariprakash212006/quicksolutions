import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, Search } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <p className="text-[120px] md:text-[160px] font-extrabold leading-none select-none bg-gradient-to-br from-brand-400 via-cyan-400 to-brand-600 bg-clip-text text-transparent">
            404
          </p>
          <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-brand-500/20 via-cyan-500/10 to-transparent rounded-full pointer-events-none" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="space-y-3"
        >
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back to exploring our CCTV and RO purifier collection.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          <Link
            to="/"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3 rounded-xl transition w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            to="/shop"
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-6 py-3 rounded-xl hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition w-full sm:w-auto justify-center"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Products
          </Link>
        </motion.div>

        {/* Search suggestion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="pt-2"
        >
          <p className="text-xs text-slate-400 mb-3">Or try searching for what you need:</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            <Search className="w-3.5 h-3.5" />
            Search CCTV cameras & RO purifiers →
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
