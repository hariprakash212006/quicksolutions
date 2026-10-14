import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, User as UserIcon, Sun, Moon, Phone,
  ShieldCheck, Menu, X, ChevronDown, Camera, HardDrive,
  Droplets, Wrench, Package, ChevronRight, Zap, Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import type { Product } from '../../types';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cms, setCms] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    axios.get('/api/cms').then((res) => {
      if (res.data.success) setCms(res.data.cms);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const res = await axios.get(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
          if (res.data.success) {
            setSuggestions(res.data.suggestions);
            setShowSuggestions(true);
          }
        } catch { /* silent */ }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setSearchFocused(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setIsMobileSearchOpen(false);
      navigate(`/shop?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-4 text-[13px] font-bold uppercase tracking-widest transition-colors ${
      isActive
        ? 'text-brand-600 dark:text-brand-400'
        : 'text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400'
    } group`;

  const categoryLinks = [
    { to: '/shop?category=cctv-security', icon: <Camera className="w-5 h-5 text-brand-500" />, label: 'CCTV & Security', desc: 'Smart AI Cameras & PTZ' },
    { to: '/shop?category=dvr-nvr-systems', icon: <HardDrive className="w-5 h-5 text-purple-500" />, label: 'DVR & NVR', desc: '4/8/16 Channel Recorders' },
    { to: '/shop?category=water-purifiers-ro', icon: <Droplets className="w-5 h-5 text-cyan-500" />, label: 'RO Purifiers', desc: 'Copper & Alkaline Systems' },
    { to: '/shop?category=accessories', icon: <Package className="w-5 h-5 text-amber-500" />, label: 'Accessories', desc: 'Cables, Power Supplies' },
    { to: '/shop?category=installation-services', icon: <Wrench className="w-5 h-5 text-emerald-500" />, label: 'Installation', desc: 'Professional Setup' },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-500 ${scrolled ? 'shadow-premium' : ''}`}>

      {/* ── Top Utility & Running Announcement Bar (Mobile & Desktop) ── */}
      <div className="bg-slateCustom-950 text-slate-300 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider py-1.5 px-2.5 sm:px-4 border-b border-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Support Phone Link */}
          <div className="flex items-center shrink-0">
            <a
              href={`tel:${cms?.businessInfo?.phone || '+919876543210'}`}
              className="flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors bg-slate-900/90 hover:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-800 text-[9.5px] sm:text-[11px] font-bold shrink-0 shadow-sm"
              title="Call Customer Support"
            >
              <Phone className="w-3 h-3 text-brand-400 shrink-0" />
              <span className="hidden xs:inline text-slate-400">SUPPORT:</span>
              <span className="text-white tracking-tight">{cms?.businessInfo?.phone || '+91 98765 43210'}</span>
            </a>
          </div>

          {/* Running Ticker / Marquee Announcement */}
          <div className="flex-1 overflow-hidden relative mx-1 sm:mx-2 flex items-center min-w-0">
            {/* Subtle Gradient Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-3 sm:w-5 bg-gradient-to-r from-slateCustom-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-3 sm:w-5 bg-gradient-to-l from-slateCustom-950 to-transparent z-10 pointer-events-none" />
            
            <div className="inline-flex items-center gap-6 whitespace-nowrap animate-marquee shrink-0 hover:[animation-play-state:paused] cursor-default text-[9.5px] sm:text-[11px] tracking-wider text-slate-300">
              {/* First Track */}
              <div className="inline-flex items-center gap-5 sm:gap-6 shrink-0">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{cms?.announcementBar?.text || 'AUTHORIZED DEALER • ORIGINAL WARRANTY • 24/7 SUPPORT'}</span>
                </span>
                <span className="text-brand-400 font-bold">•</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  FESTIVE DISCOUNTS LIVE ON CCTV & RO PURIFIERS
                </span>
                <span className="text-brand-400 font-bold">•</span>
                <span className="text-cyan-300 font-medium">
                  FREE ON-SITE DEMO & EXPERT INSTALLATION
                </span>
                <span className="text-brand-400 font-bold">•</span>
              </div>
              {/* Duplicate Track for Seamless Loop */}
              <div className="inline-flex items-center gap-5 sm:gap-6 shrink-0" aria-hidden="true">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{cms?.announcementBar?.text || 'AUTHORIZED DEALER • ORIGINAL WARRANTY • 24/7 SUPPORT'}</span>
                </span>
                <span className="text-brand-400 font-bold">•</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  FESTIVE DISCOUNTS LIVE ON CCTV & RO PURIFIERS
                </span>
                <span className="text-brand-400 font-bold">•</span>
                <span className="text-cyan-300 font-medium">
                  FREE ON-SITE DEMO & EXPERT INSTALLATION
                </span>
                <span className="text-brand-400 font-bold">•</span>
              </div>
            </div>
          </div>

          {/* Quick Help & Admin Panel (Desktop only) */}
          <div className="hidden md:flex items-center space-x-5 shrink-0 text-[11px]">
            <RouterLink to="/faq" className="hover:text-white transition-colors flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Help
            </RouterLink>
            {user?.role === 'admin' && (
              <RouterLink
                to="/admin"
                className="bg-brand-600 text-white px-2.5 py-0.5 rounded text-[10px] font-bold shadow-glow-brand hover:bg-brand-500 transition-colors"
              >
                ADMIN PANEL
              </RouterLink>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Header ── */}
      <div className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 ${scrolled ? 'py-2 sm:py-3' : 'py-2 sm:py-3.5'} px-3 sm:px-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-6">

          {/* Left: Mobile Menu Button & Brand Logo */}
          <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-1 text-slate-900 dark:text-white shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* Logo + Brand Name */}
            <RouterLink to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
              <img 
                src="/logo/logo.png" 
                alt="Quick Solutions For U" 
                className={`object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-sm dark:drop-shadow-[0_2px_12px_rgba(255,255,255,0.18)] ${
                  scrolled ? 'h-6 sm:h-9 md:h-11' : 'h-7 sm:h-10 md:h-13 lg:h-14'
                } w-auto max-h-7 sm:max-h-14 max-w-[32px] sm:max-w-[52px] shrink-0`}
                onError={(e) => {
                  // Fallback to text if the image doesn't exist yet
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className={`hidden rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-black text-xs sm:text-base shadow-sm transition-transform group-hover:scale-105 shrink-0 ${
                scrolled ? 'w-6 h-6 md:w-9 md:h-9' : 'w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12'
              }`}>
                QS
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-black tracking-tight text-slate-900 dark:text-white leading-tight transition-all duration-300 truncate ${
                  scrolled ? 'text-xs xs:text-sm sm:text-base md:text-xl' : 'text-xs xs:text-sm sm:text-lg md:text-2xl'
                }`}>
                  QUICK SOLUTIONS FOR U
                </span>
                <span className="text-[7.5px] xs:text-[8.5px] sm:text-[10px] md:text-[11px] font-bold tracking-[0.16em] text-brand-600 dark:text-brand-400 uppercase leading-none truncate">
                  PREMIUM SECURITY & RO
                </span>
              </div>
            </RouterLink>
          </div>

          {/* Desktop Navigation (Moved to main header for premium look) */}
          <nav className="hidden lg:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <NavLink to="/" end className={navLinkClass}>
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 dark:bg-brand-400 transition-all group-hover:w-full"></span>
            </NavLink>
            <NavLink to="/shop" className={navLinkClass}>
              Shop
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 dark:bg-brand-400 transition-all group-hover:w-full"></span>
            </NavLink>

            {/* Mega Menu Trigger */}
            <div className="relative group py-4 cursor-pointer">
              <span className="flex items-center gap-1 text-[13px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                Categories <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              </span>
              <div className="absolute top-[100%] -left-32 w-[600px] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-premium opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all transform translate-y-4 group-hover:translate-y-0 duration-200 p-6 z-50 grid grid-cols-2 gap-4 backdrop-blur-xl">
                <div className="col-span-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-end">
                    <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">Explore Collections</h4>
                        <p className="text-xs text-slate-500">Premium security & purification</p>
                    </div>
                    <RouterLink to="/shop" className="text-xs font-bold text-brand-600 hover:underline">View All &rarr;</RouterLink>
                </div>
                {categoryLinks.map((cat) => (
                  <RouterLink
                    key={cat.to}
                    to={cat.to}
                    className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group/item"
                  >
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white group-hover/item:bg-white dark:group-hover/item:bg-slate-700 shadow-sm transition-colors">
                      {cat.icon}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover/item:text-brand-600 dark:group-hover/item:text-brand-400 transition-colors">{cat.label}</h5>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
                    </div>
                  </RouterLink>
                ))}
              </div>
            </div>

            <NavLink to="/about" className={navLinkClass}>
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-600 dark:bg-brand-400 transition-all group-hover:w-full"></span>
            </NavLink>
          </nav>

          {/* Actions & Search */}
          <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
            {/* Mobile Search Icon Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextState = !isMobileSearchOpen;
                setIsMobileSearchOpen(nextState);
                if (nextState) {
                  setTimeout(() => mobileInputRef.current?.focus(), 150);
                }
              }}
              className={`md:hidden p-2 rounded-full transition-colors ${
                isMobileSearchOpen
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-label={isMobileSearchOpen ? 'Close search' : 'Open search'}
            >
              {isMobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
            
            {/* Desktop Expandable Search */}
            <div ref={searchRef} className={`hidden md:flex relative items-center transition-all duration-300 ${searchFocused ? 'w-64' : 'w-10'}`}>
               <form onSubmit={handleSearchSubmit} className="w-full relative">
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onFocus={() => setSearchFocused(true)}
                   placeholder="Search..."
                   className={`w-full bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-full text-sm border border-transparent focus:border-brand-500/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:shadow-glow-brand transition-all duration-300 ${searchFocused ? 'pl-10 pr-10 py-2.5 opacity-100' : 'pl-10 pr-0 py-2.5 opacity-0 cursor-pointer'}`}
                 />
                 <div className={`absolute left-0 top-0 h-full w-10 flex items-center justify-center rounded-full transition-colors ${searchFocused ? 'text-brand-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'}`} onClick={() => !searchFocused && setSearchFocused(true)}>
                    <Search className="w-4 h-4" />
                 </div>
                 {searchQuery && searchFocused && (
                   <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                     <X className="w-4 h-4" />
                   </button>
                 )}
               </form>

               {/* Suggestions */}
               <AnimatePresence>
                 {showSuggestions && suggestions.length > 0 && searchFocused && (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 10 }}
                     className="absolute top-full right-0 w-80 mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium overflow-hidden z-50"
                   >
                     <div className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                       Products
                     </div>
                     {suggestions.map((item) => (
                       <div
                         key={item._id}
                         onClick={() => {
                           setShowSuggestions(false);
                           setSearchQuery('');
                           setSearchFocused(false);
                           navigate(`/product/${item.slug}`);
                         }}
                         className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                       >
                         <img src={item.images[0]} alt={item.name} className="w-12 h-12 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 p-1 mix-blend-multiply dark:mix-blend-normal" />
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                           <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-0.5">₹{item.sellingPrice.toLocaleString('en-IN')}</p>
                         </div>
                       </div>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block mx-1"></div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Wishlist (Desktop/Tablet) */}
            <RouterLink
              to="/account"
              className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
              title="My Favorites"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </RouterLink>

            {/* Account (Desktop/Tablet) */}
            <RouterLink
              to={user ? '/account' : '/login'}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
            >
              <UserIcon className="w-5 h-5" />
            </RouterLink>

            {/* Cart (Desktop only, mobile has sticky bottom navigation) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="hidden md:flex relative p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full hover:scale-105 transition-transform shadow-md"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 bg-brand-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar (Revealed when tapping the search icon) */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              ref={mobileSearchRef}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-visible relative"
            >
              <form
                onSubmit={(e) => {
                  handleSearchSubmit(e);
                  setIsMobileSearchOpen(false);
                }}
                className="relative"
              >
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) setShowSuggestions(true);
                  }}
                  placeholder="Search CCTV, RO Purifiers, Brands..."
                  className="w-full bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-10 py-2.5 rounded-xl text-sm border border-slate-200/50 dark:border-slate-700/50 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-shadow shadow-inner"
                  autoFocus
                />
                <Search className="w-4 h-4 text-brand-500 absolute left-3.5 top-3" />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                    className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Mobile Search Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[210] max-h-80 overflow-y-auto"
                  >
                    <div className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span>Matching Products</span>
                      <span className="text-brand-500 font-semibold">{suggestions.length} found</span>
                    </div>
                    {suggestions.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchQuery('');
                          setIsMobileSearchOpen(false);
                          navigate(`/product/${item.slug}`);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition border-b border-slate-100 dark:border-slate-800/40 last:border-0"
                      >
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-11 h-11 object-contain rounded-xl bg-slate-50 dark:bg-slate-800 p-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                          <p className="text-[11px] font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                            ₹{item.sellingPrice.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={(e) => {
                        handleSearchSubmit(e);
                        setIsMobileSearchOpen(false);
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 text-center text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline border-t border-slate-100 dark:border-slate-800"
                    >
                      View all results for "{searchQuery}" →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Slide-Over Mobile Drawer ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[250] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="absolute inset-y-0 left-0 w-[88vw] max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col z-10 border-r border-slate-200/50 dark:border-slate-800/50 touch-scroll"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <RouterLink
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <img
                    src="/logo/logo.png"
                    alt="Quick Solutions"
                    className="h-10 w-auto object-contain drop-shadow-sm"
                  />
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-slate-900 dark:text-white leading-none">
                      QUICK SOLUTIONS FOR U
                    </span>
                    <span className="text-[8px] font-bold tracking-[0.2em] text-brand-600 dark:text-brand-400 uppercase mt-0.5">
                      PREMIUM SECURITY
                    </span>
                  </div>
                </RouterLink>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Contact Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex gap-2">
                <a
                  href={`tel:${cms?.businessInfo?.phone || '+919876543210'}`}
                  className="flex-1 py-2.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs shadow-sm hover:border-brand-500 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-brand-600" />
                  <span>Call Us</span>
                </a>
                <a
                  href={`https://wa.me/${cms?.businessInfo?.phone?.replace(/\D/g, '') || '919876543210'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm transition"
                >
                  <span>💬 WhatsApp</span>
                </a>
              </div>

              {/* Drawer Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1">
                  {[
                    { to: '/', label: 'Home', end: true },
                    { to: '/shop', label: 'Shop All Products' },
                    { to: '/shop?featured=true', label: 'Featured Collection' },
                    { to: '/about', label: 'About Us' },
                    { to: '/faq', label: 'Help & FAQ' },
                    { to: '/feedback', label: 'Customer Reviews' },
                  ].map(({ to, label, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between font-bold py-2.5 px-3.5 rounded-xl text-sm transition-colors ${
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      {label}
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </NavLink>
                  ))}
                </div>

                {/* Categories Accordion */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 block">
                    Product Categories
                  </span>
                  <div className="space-y-1">
                    {categoryLinks.map((cat) => (
                      <RouterLink
                        key={cat.to}
                        to={cat.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-bold">{cat.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{cat.desc}</p>
                        </div>
                      </RouterLink>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer with Theme Toggle & Account */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Appearance</span>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm"
                  >
                    {theme === 'light' ? <><Moon className="w-3.5 h-3.5 text-slate-600" /> Dark</> : <><Sun className="w-3.5 h-3.5 text-amber-400" /> Light</>}
                  </button>
                </div>

                <RouterLink
                  to={user ? '/account' : '/login'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{user ? `My Account (${user.name})` : 'Sign In / Register'}</span>
                </RouterLink>

                {user?.role === 'admin' && (
                  <RouterLink
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 text-brand-300 border border-slate-700 rounded-xl text-xs font-bold transition hover:bg-slate-700"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Control Panel
                  </RouterLink>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};


