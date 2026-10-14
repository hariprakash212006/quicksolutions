import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/product/ProductCard';
import { Filter, Search, RefreshCw, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import type { Product, Category } from '../types';

/* ── Skeleton Card ── */
const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
    <div className="skeleton aspect-square" />
    <div className="p-4 space-y-2">
      <div className="skeleton h-3 rounded-full w-1/3" />
      <div className="skeleton h-4 rounded-full w-4/5" />
      <div className="skeleton h-4 rounded-full w-2/3" />
      <div className="skeleton h-8 rounded-xl w-full mt-2" />
    </div>
  </div>
);

/* ── Sidebar Content ── */
interface SidebarProps {
  categories: Category[];
  categoryParam: string;
  brandParam: string;
  minPrice: string;
  maxPrice: string;
  keyword: string;
  updateFilter: (k: string, v: string) => void;
  clearAllFilters: () => void;
  onClose?: () => void;
}
const SidebarFilters: React.FC<SidebarProps> = ({
  categories, categoryParam, brandParam, minPrice, maxPrice, keyword,
  updateFilter, clearAllFilters, onClose,
}) => {
  const hasFilters = !!(categoryParam || brandParam || minPrice || maxPrice || keyword);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Filters
        </h3>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-500 font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Clear
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</h4>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter('category', '')}
            className={`w-full text-left text-xs px-3 py-2 rounded-lg transition font-medium ${
              !categoryParam
                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => updateFilter('category', cat.slug)}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg transition font-medium ${
                categoryParam === cat.slug
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Popular Brands</h4>
        {['CP Plus', 'Hikvision', 'Dahua', 'Aqua Fresh', 'Seagate'].map((brand) => (
          <label
            key={brand}
            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer group"
          >
            <input
              type="radio"
              name="brand"
              checked={brandParam === brand}
              onChange={() => updateFilter('brand', brandParam === brand ? '' : brand)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">{brand}</span>
          </label>
        ))}
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range (₹)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
          />
          <span className="text-slate-400 font-bold">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════ */
export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const keyword = searchParams.get('keyword') || '';
  const categoryParam = searchParams.get('category') || '';
  const brandParam = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    axios.get('/api/categories').then((res) => {
      if (res.data.success) setCategories(res.data.categories);
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if (keyword) q.set('keyword', keyword);
        if (categoryParam) q.set('category', categoryParam);
        if (brandParam) q.set('brand', brandParam);
        if (minPrice) q.set('minPrice', minPrice);
        if (maxPrice) q.set('maxPrice', maxPrice);
        if (sort) q.set('sort', sort);
        q.set('page', String(page));

        const res = await axios.get(`/api/products?${q.toString()}`);
        if (res.data.success) {
          const totalCount = res.data.total ?? res.data.pagination?.total ?? res.data.products?.length ?? 0;
          if (page === 1) setProducts(res.data.products);
          else setProducts((prev) => [...prev, ...res.data.products]);
          setTotal(totalCount);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams, page]);

  const updateFilter = (key: string, value: string) => {
    const np = new URLSearchParams(searchParams);
    value ? np.set(key, value) : np.delete(key);
    setSearchParams(np);
  };

  const clearAllFilters = () => setSearchParams({});

  /* Active filter chips */
  const activeFilters = [
    categoryParam && { key: 'category', label: `Category: ${categories.find(c => c.slug === categoryParam)?.name || categoryParam}` },
    brandParam && { key: 'brand', label: `Brand: ${brandParam}` },
    (minPrice || maxPrice) && { key: 'price', label: `₹${minPrice || '0'} – ₹${maxPrice || '∞'}` },
    keyword && { key: 'keyword', label: `Search: "${keyword}"` },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-24 lg:pb-8 space-y-6">

      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-brand-700/20 blur-[60px] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold">All Security & Purifier Products</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Browse our full catalog of CCTV Cameras, DVR/NVR, Alkaline RO Systems & Accessories
          </p>
        </div>
        <div className="relative z-10 text-xs text-slate-300 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 font-semibold self-start md:self-auto shrink-0">
          {total} Products Available
        </div>
      </div>

      {/* ── Active Filter Chips ── */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs text-slate-500 font-medium">Active filters:</span>
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  if (f.key === 'price') { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }
                  else updateFilter(f.key, '');
                }}
                className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold px-3 py-1 rounded-full hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition"
              >
                {f.label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button onClick={clearAllFilters} className="text-xs text-red-500 font-semibold hover:underline ml-1">
              Clear All
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Desktop Sidebar ── */}
        <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-6 h-fit sticky top-28">
          <SidebarFilters
            categories={categories}
            categoryParam={categoryParam}
            brandParam={brandParam}
            minPrice={minPrice}
            maxPrice={maxPrice}
            keyword={keyword}
            updateFilter={updateFilter}
            clearAllFilters={clearAllFilters}
          />
        </div>

        {/* ── Product Grid & Controls ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Sort / Mobile Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Found <strong className="text-slate-800 dark:text-white">{products.length}</strong> of <strong className="text-slate-800 dark:text-white">{total}</strong> items
            </span>
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
              </button>
              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Sort:</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-0 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low-high">Price: Low to High</option>
                    <option value="price-high-low">Price: High to Low</option>
                    <option value="discount">Biggest Discount (%)</option>
                    <option value="highest-rated">Highest Rated</option>
                    <option value="best-selling">Best Sellers</option>
                    <option value="name-a-z">Name: A to Z</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading && page === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Products Found</h3>
              <p className="text-xs text-slate-500">Try adjusting your filters or search keywords.</p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-500 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                {products.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 6) * 0.1, duration: 0.4 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {products.length < total && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                    className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : `Load More (${total - products.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-[200] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute inset-y-0 left-0 w-[88vw] max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-5">
                <SidebarFilters
                  categories={categories}
                  categoryParam={categoryParam}
                  brandParam={brandParam}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  keyword={keyword}
                  updateFilter={updateFilter}
                  clearAllFilters={clearAllFilters}
                  onClose={() => setMobileFiltersOpen(false)}
                />
              </div>
              <div className="p-4 pb-safe border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex gap-2">
                {activeFilters.length > 0 && (
                  <button
                    onClick={() => { clearAllFilters(); setMobileFiltersOpen(false); }}
                    className="flex-1 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-[2] py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Show Results ({total})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
