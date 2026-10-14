import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ShieldCheck, ArrowRight, Camera, Droplets, HardDrive, Wrench,
  Truck, Headphones, Award, Star, Users, ThumbsUp, MessageCircle, Play,
  Tag, Copy, Check, Clock, Sparkles, Zap, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/product/ProductCard';
import { DealOfTheDay } from '../components/home/DealOfTheDay';
import axios from 'axios';
import type { Product, CMSConfig } from '../types';

/* ─────────────── Animated Counter ─────────────── */
const Counter: React.FC<{ to: number; suffix?: string }> = ({ to, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = Math.ceil(to / 60);
          const timer = setInterval(() => {
            start += step;
            if (start >= to) { setCount(to); clearInterval(timer); }
            else setCount(start);
          }, 20);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
};

/* ─────────────── Brands Marquee ─────────────── */
const brands = ['CP Plus', 'Hikvision', 'Dahua', 'Aqua Fresh', 'Seagate', 'Kent', 'Bosch', 'Godrej'];
const BrandsMarquee: React.FC = () => (
  <div className="relative overflow-hidden py-10 border-y border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/20 select-none">
    <div className="flex items-center gap-24 animate-marquee whitespace-nowrap">
      {[...brands, ...brands, ...brands].map((b, i) => (
        <span
          key={i}
          className="text-xl md:text-2xl font-black tracking-[0.2em] uppercase text-slate-300 dark:text-slate-700/50 hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-default"
        >
          {b}
        </span>
      ))}
    </div>
    <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent" />
  </div>
);

/* ─────────────── Skeleton Card ─────────────── */
const SkeletonCard: React.FC = () => (
  <div className="rounded-3xl snap-center shrink-0 w-[75vw] sm:w-[40vw] lg:w-auto overflow-hidden border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
    <div className="skeleton aspect-[4/3]" />
    <div className="p-5 space-y-3">
      <div className="skeleton h-3 rounded-full w-1/3" />
      <div className="skeleton h-5 rounded-full w-4/5" />
      <div className="skeleton h-5 rounded-full w-2/3" />
      <div className="skeleton h-10 rounded-full w-full mt-4" />
    </div>
  </div>
);

/* ─────────────── Real-Time Interactive Promo Banner ─────────────── */
interface PromoBannerProps {
  banner: {
    badge?: string;
    title?: string;
    description?: string;
    image?: string;
    ctaText?: string;
    ctaLink?: string;
    couponCode?: string;
    discountTag?: string;
    features?: string[];
  };
  phone?: string;
}

const RealtimePromoBanner: React.FC<PromoBannerProps> = ({ banner, phone }) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 45, seconds: 30 });

  useEffect(() => {
    const getRemaining = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { hours, minutes, seconds };
    };

    setTimeLeft(getRemaining());
    const timer = setInterval(() => {
      setTimeLeft(getRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const couponCode = banner.couponCode || 'QUICK500';
  const discountTag = banner.discountTag || 'FLAT ₹500 OFF';
  const whatsappNumber = (phone || '919876543210').replace(/\D/g, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const features = banner.features && banner.features.length > 0
    ? banner.features
    : [
        'Free Doorstep Site Inspection',
        'Same-Day Insured Dispatch Across India',
        '2-Year Official Brand Warranty',
        'Cash On Delivery (COD) Available',
      ];

  return (
    <section className="max-w-7xl mx-auto px-4 pb-16">
      <div className="relative rounded-3xl lg:rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-slate-950 via-brand-950 to-slate-900 text-white shadow-2xl border border-brand-500/30">
        {/* Ambient background glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Subtle patterned overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-10 lg:p-14 items-center">
          
          {/* Left Column: Offer Details & Actions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Live Status Badge */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 border border-brand-400/40 text-brand-300 text-xs font-black tracking-wider uppercase">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                {banner.badge || 'FLASH DEAL • LIMITED TIME'}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                {discountTag}
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
                {banner.title || 'Mega Surveillance & Water Purification Savings'}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal max-w-xl">
                {banner.description || 'Upgrade your security and family health today. Get complete 4-channel HD CCTV setups and Copper Alkaline RO purifiers with free certified installation.'}
              </p>
            </div>

            {/* Real-time Interactive Coupon Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3 max-w-xl">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-brand-300">
                  <Tag className="w-4 h-4 text-brand-400" /> Exclusive Online Coupon
                </span>
                <span className="text-[11px] text-emerald-400 font-bold">Apply at Checkout</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/40 p-2.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 px-2">
                  <div className="font-mono text-lg sm:text-xl font-black text-amber-300 tracking-wider">
                    {couponCode}
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Code
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white hover:bg-slate-100 text-slate-900 active:scale-95'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Real-Time Live Countdown */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Offer Expires Today In:</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-white">
                <div className="bg-black/50 border border-white/10 px-3 py-1.5 rounded-xl text-center min-w-[58px]">
                  <span className="text-lg font-black text-white">{pad(timeLeft.hours)}</span>
                  <p className="text-[9px] uppercase font-sans text-slate-400">Hours</p>
                </div>
                <span className="font-bold text-slate-500 text-lg">:</span>
                <div className="bg-black/50 border border-white/10 px-3 py-1.5 rounded-xl text-center min-w-[58px]">
                  <span className="text-lg font-black text-white">{pad(timeLeft.minutes)}</span>
                  <p className="text-[9px] uppercase font-sans text-slate-400">Mins</p>
                </div>
                <span className="font-bold text-slate-500 text-lg">:</span>
                <div className="bg-black/50 border border-white/10 px-3 py-1.5 rounded-xl text-center min-w-[58px]">
                  <span className="text-lg font-black text-amber-400">{pad(timeLeft.seconds)}</span>
                  <p className="text-[9px] uppercase font-sans text-slate-400">Secs</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to={banner.ctaLink || '/shop'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-extrabold px-6 sm:px-7 py-3.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 text-sm text-center"
              >
                {banner.ctaText || 'Shop Promotional Deals'}
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Quick Solutions! I saw the promo offer on your website with code ${couponCode}. Can you share details and a quotation?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3.5 rounded-xl shadow transition text-sm text-center"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                WhatsApp Enquiry
              </a>
            </div>

          </div>

          {/* Right Column: Visual Product Showcase & Guarantee Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 border border-white/15 p-6 backdrop-blur-xl space-y-5 shadow-2xl">
              
              {/* Image Preview with Discount Ribbon */}
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-white/10 group">
                <img
                  src={banner.image || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80'}
                  alt={banner.title || 'Promo Offer'}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                
                {/* Float Discount Badge */}
                <div className="absolute top-3 right-3 bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  LIMITED COMBO
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-bold text-sm leading-tight drop-shadow">
                    Doorstep Installation & Warranty Included
                  </p>
                </div>
              </div>

              {/* Value Propositions Checklist */}
              <div className="space-y-2.5 pt-1">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Verified Trust Strip */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="font-bold text-white">4.9 / 5</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">1,500+ Happy Customers</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════ */
export const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [cms, setCms] = useState<CMSConfig | null>(null);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [featRes, bestRes, cmsRes, catRes] = await Promise.all([
          axios.get('/api/products?featured=true&limit=4'),
          axios.get('/api/products?bestSeller=true&limit=4'),
          axios.get('/api/cms'),
          axios.get('/api/categories'),
        ]);
        if (featRes.data.success) setFeaturedProducts(featRes.data.products);
        if (bestRes.data.success) setBestSellers(bestRes.data.products);
        if (cmsRes.data.success) setCms(cmsRes.data.cms);
        if (catRes.data.success) setDbCategories(catRes.data.categories);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const heroBanner = cms?.heroBanners[0] || {
    title: 'Next-Gen Security & Pure RO Systems',
    subtitle: 'Protect your family and business with 5MP Full-Color Night Vision Cameras & 14-Stage Copper RO Purifiers. Original manufacturer warranty with certified doorstep installation.',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=2000&auto=format&fit=crop&q=80',
    ctaText: 'Explore Collection',
    ctaLink: '/shop',
  };

  const fallbackCategories = [
    {
      slug: 'cctv-security',
      to: '/shop?category=cctv-security',
      icon: <Camera className="w-8 h-8" />,
      label: 'CCTV & Security',
      sub: 'Browse Cameras',
      image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
      accent: 'bg-cyan-500',
    },
    {
      slug: 'water-purifiers-ro',
      to: '/shop?category=water-purifiers-ro',
      icon: <Droplets className="w-8 h-8" />,
      label: 'RO Purifiers',
      sub: 'Browse Purifiers',
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80',
      accent: 'bg-blue-500',
    },
    {
      slug: 'dvr-nvr-systems',
      to: '/shop?category=dvr-nvr-systems',
      icon: <HardDrive className="w-8 h-8" />,
      label: 'DVR & NVR',
      sub: 'Browse Recorders',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      accent: 'bg-purple-500',
    },
    {
      slug: 'accessories',
      to: '/shop?category=accessories',
      icon: <ShieldCheck className="w-8 h-8" />,
      label: 'Accessories',
      sub: 'Cables & Spares',
      image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=800&auto=format&fit=crop&q=80',
      accent: 'bg-amber-500',
    },
    {
      slug: 'installation-services',
      to: '/shop?category=installation-services',
      icon: <Wrench className="w-8 h-8" />,
      label: 'Installation',
      sub: 'Book Service',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
      accent: 'bg-emerald-500',
    },
  ];

  const getCategoryMeta = (slug: string) => {
    switch (slug) {
      case 'cctv-security':
        return { icon: <Camera className="w-8 h-8" />, sub: 'Browse Cameras', accent: 'bg-cyan-500', defaultImg: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80' };
      case 'water-purifiers-ro':
        return { icon: <Droplets className="w-8 h-8" />, sub: 'Browse Purifiers', accent: 'bg-blue-500', defaultImg: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80' };
      case 'dvr-nvr-systems':
        return { icon: <HardDrive className="w-8 h-8" />, sub: 'Browse Recorders', accent: 'bg-purple-500', defaultImg: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80' };
      case 'accessories':
        return { icon: <ShieldCheck className="w-8 h-8" />, sub: 'Cables & Spares', accent: 'bg-amber-500', defaultImg: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=800&auto=format&fit=crop&q=80' };
      case 'installation-services':
        return { icon: <Wrench className="w-8 h-8" />, sub: 'Book Service', accent: 'bg-emerald-500', defaultImg: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80' };
      default:
        return { icon: <Camera className="w-8 h-8" />, sub: 'Explore Products', accent: 'bg-brand-600', defaultImg: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80' };
    }
  };

  const categories = (dbCategories && dbCategories.length > 0)
    ? dbCategories.map((c) => {
        const meta = getCategoryMeta(c.slug);
        return {
          slug: c.slug,
          to: `/shop?category=${c.slug}`,
          label: c.name,
          image: c.image || meta.defaultImg,
          icon: meta.icon,
          sub: meta.sub,
          accent: meta.accent,
        };
      })
    : fallbackCategories;

  return (
    <div className="space-y-24 pb-24">

      {/* ── Cinematic Hero ── */}
      <section className="relative min-h-[520px] sm:h-[85vh] sm:min-h-[600px] py-14 sm:py-0 flex items-center justify-center overflow-hidden bg-slate-900">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <img
            src={heroBanner.image}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-transparent" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-3 glass-dark px-4 py-2 rounded-full border-brand-500/30"
            >
              <img 
                src="/logo/logo.png" 
                alt="Quick Solutions" 
                className="w-6 h-6 object-contain drop-shadow-sm" 
              />
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">Trusted By 500+ Businesses</span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              {heroBanner.title}
            </h1>

            <p className="text-sm sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl font-light">
              {heroBanner.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 pt-3 sm:pt-4">
              <Link
                to={heroBanner.ctaLink || '/shop'}
                className="group relative bg-white text-slate-900 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-premium text-center flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-slate-100 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center gap-2">
                  {heroBanner.ctaText || 'Explore Collection'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <a
                href={`https://wa.me/${cms?.businessInfo?.phone?.replace(/\D/g, '') || '919876543210'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 sm:gap-3 bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-full transition-all border border-slate-700 backdrop-blur-md hover:border-emerald-500 hover:text-emerald-400 text-center"
              >
                <MessageCircle className="w-5 h-5" /> Expert Advice
              </a>
            </div>
          </motion.div>

          {/* Hero Right Brand Showcase (Desktop) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="hidden lg:flex lg:col-span-5 justify-center items-center"
          >
            <div className="relative group w-full max-w-md p-8 rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden text-center flex flex-col items-center space-y-6">
              {/* Ambient Glow */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-500/30 transition-all duration-500" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <img
                  src="/logo/logo.png"
                  alt="Quick Solutions - All Solutions At One Call"
                  className="w-36 h-36 object-contain drop-shadow-[0_10px_25px_rgba(255,255,255,0.18)] transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Quick Solutions
                </h3>
                <p className="text-xs font-bold text-brand-400 uppercase tracking-widest">
                  All Solutions At One Call
                </p>
                <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
                  Authorized CCTV surveillance & copper RO water purifiers with certified doorstep installation.
                </p>
              </div>

              <div className="w-full pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-base font-black text-white">100%</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Original</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-base font-black text-brand-400">Doorstep</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Install</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="text-base font-black text-emerald-400">24/7</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Support</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Premium Trust Strip ── */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 sm:-mt-16 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-premium">
          {[
            { icon: <Award className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />, title: "Genuine", sub: "100% Auth" },
            { icon: <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />, title: "Install", sub: "Pro Setup" },
            { icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />, title: "Delivery", sub: "Fast Ship" },
            { icon: <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />, title: "Support", sub: "24/7 Care" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + (i * 0.1) }}
              className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2 sm:gap-4 p-4 sm:p-6 lg:p-8 bg-white dark:bg-slate-900 group cursor-default hover:bg-brand-50/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="p-2.5 sm:p-3 bg-brand-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {item.icon}
              </div>
              <div>
                <h4 className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{item.title}</h4>
                <p className="text-[9px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5 sm:mt-1">{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </section>

      {/* ── Category Grid ── */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <span className="section-label">Collections</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Shop By Category</h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors flex items-center gap-2 group uppercase tracking-widest">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="flex overflow-x-auto touch-scroll snap-x snap-mandatory flex-nowrap pb-6 gap-4 md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-4 lg:gap-5 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.to}
              className="snap-center shrink-0 w-[75vw] sm:w-[40vw] md:w-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link
                to={cat.to}
                className="group relative h-48 sm:h-64 md:h-72 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-end bg-slate-900 text-white shadow-soft hover:shadow-premium transition-all duration-500 block"
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80';
                  }}
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                <div className="relative z-10 p-4 sm:p-8 transform translate-y-0 sm:translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className={`mb-2 sm:mb-4 w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${cat.accent} flex items-center justify-center text-white shadow-lg`}>
                    <div className="scale-75 sm:scale-100">{cat.icon}</div>
                  </div>
                  <h3 className="font-black text-sm sm:text-2xl leading-tight mb-1 sm:mb-2">{cat.label}</h3>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1 sm:gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:delay-100">
                    {cat.sub} <ArrowRight className="w-2 h-2 sm:w-3 sm:h-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="bg-slate-100/50 dark:bg-slate-900/20 py-24 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
                <span className="section-label bg-brand-600 text-white border-brand-500 dark:bg-brand-600">Featured</span>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Premium Selection</h2>
            </div>
            <Link to="/shop?featured=true" className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors flex items-center gap-2 group uppercase tracking-widest">
                Explore All <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Link>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory flex-nowrap pb-6 gap-4 lg:grid lg:grid-cols-4 sm:gap-6 lg:gap-8 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
            {loading
                ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
                : featuredProducts.map((product, i) => (
                    <motion.div
                    key={product._id}
                    className="snap-center shrink-0 w-[75vw] sm:w-[40vw] lg:w-auto"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    >
                    <ProductCard product={product} />
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      <DealOfTheDay />

      {/* ── Social Proof / Stats ── */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 text-white p-12 md:p-20 shadow-premium">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-brand-500/20 blur-[120px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[100px] pointer-events-none transform -translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-6">
                <span className="section-label bg-white/10 text-white border-white/20">Our Legacy</span>
                <h2 className="text-4xl md:text-5xl font-black leading-tight">Setting the Standard in Security & Purification</h2>
                <p className="text-slate-400 text-lg leading-relaxed font-light">With over half a decade of excellence, we deliver uncompromising quality, genuine manufacturer warranties, and professional installation that our clients trust.</p>
                
                <div className="pt-6">
                     <a
                        href="#"
                        className="inline-flex items-center gap-3 bg-white text-slate-900 font-bold px-8 py-4 rounded-full transition-transform hover:scale-105"
                      >
                        <Play className="w-5 h-5 fill-slate-900" /> Watch Our Story
                      </a>
                </div>
            </div>

            <div className="lg:w-1/2 grid grid-cols-2 gap-8 w-full">
              {[
                  { icon: <Users className="w-8 h-8 text-brand-400" />, value: 1500, suffix: '+', label: 'Clients Served' },
                  { icon: <Star className="w-8 h-8 text-amber-400" />, value: 99, suffix: '%', label: 'Satisfaction' },
                  { icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />, value: 5, suffix: ' Yrs', label: 'Warranty' },
                  { icon: <ThumbsUp className="w-8 h-8 text-cyan-400" />, value: 5000, suffix: '+', label: 'Installations' },
              ].map((s, i) => (
                <motion.div 
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-dark p-6 rounded-3xl border-white/5"
                >
                  <div className="mb-4">{s.icon}</div>
                  <p className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter">
                    <Counter to={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Real-Time Interactive Promo Banner ── */}
      {cms?.promoBanner && cms.promoBanner.active !== false && (
        <RealtimePromoBanner banner={cms.promoBanner} phone={cms?.businessInfo?.phone} />
      )}

      {/* ?? Best Sellers ?? */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-2">
            <span className="section-label">Top Rated</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Best Sellers</h2>
          </div>
          <Link to="/shop?bestSeller=true" className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-500 transition-colors flex items-center gap-2 group uppercase tracking-widest">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory flex-nowrap pb-6 gap-4 lg:grid lg:grid-cols-4 sm:gap-6 lg:gap-8 lg:pb-0 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
          {loading
            ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
            : bestSellers.map((product, i) => (
                <motion.div
                  key={product._id}
                  className="snap-center shrink-0 w-[75vw] sm:w-[40vw] lg:w-auto"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
        </div>
      </section>

      {/* ── Brands Marquee ── */}
      <BrandsMarquee />

      {/* ── Floating WhatsApp Button (Desktop) ── */}
      <a
        href={`https://wa.me/${cms?.businessInfo?.phone?.replace(/\D/g, '') || '919876543210'}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden md:flex fixed bottom-6 right-6 z-[90] items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full shadow-premium transition-transform hover:scale-110 active:scale-95 group"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 relative z-10 group-hover:scale-110 transition-transform" />
      </a>
    </div>
  );
};


















