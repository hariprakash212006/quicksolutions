import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface DealData {
  active: boolean;
  badge: string;
  title: string;
  subtitle: string;
  productId?: string;
  productSlug?: string;
  originalPrice: number;
  dealPrice: number;
  discountPercentage: number;
  image: string;
  endTime?: string | Date;
  ctaText: string;
  ctaLink: string;
}

export const DealOfTheDay: React.FC = () => {
  const [deal, setDeal] = useState<DealData>({
    active: true,
    badge: 'Deal of the Day',
    title: 'CP Plus 4MP Smart Wi-Fi PTZ Camera',
    subtitle: '360° Vision, Color Night Vision, Two-Way Audio. Secure your home instantly with AI motion tracking.',
    productSlug: '',
    originalPrice: 4999,
    dealPrice: 2499,
    discountPercentage: 50,
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600',
    ctaText: 'Grab the Deal',
    ctaLink: '/shop',
  });

  const [timeLeft, setTimeLeft] = useState({
    hours: 11,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    // Fetch CMS Deal of the Day configuration
    axios
      .get('/api/cms')
      .then((res) => {
        if (res.data.success && res.data.cms?.dealOfTheDay) {
          setDeal((prev) => ({ ...prev, ...res.data.cms.dealOfTheDay }));
        }
      })
      .catch((err) => console.error('CMS Deal load error:', err));
  }, []);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      let targetTime: number;

      if (deal.endTime) {
        targetTime = new Date(deal.endTime).getTime();
      } else {
        // Fallback: End of today (midnight)
        const midnight = new Date();
        midnight.setHours(23, 59, 59, 999);
        targetTime = midnight.getTime();
      }

      const diff = Math.max(0, targetTime - now);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [deal.endTime]);

  if (deal.active === false) return null;

  const formatNumber = (num: number) => num.toString().padStart(2, '0');
  const targetLink = deal.productSlug ? `/product/${deal.productSlug}` : deal.ctaLink || '/shop';

  return (
    <section className="max-w-7xl mx-auto px-4 py-12 relative z-10">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slateCustom-950 dark:to-slate-900 rounded-3xl overflow-hidden shadow-premium relative border border-slate-800/80">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-5 sm:p-8 lg:p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-400 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-brand-500/30">
              <Timer className="w-4 h-4 animate-pulse" /> {deal.badge || 'Deal of the Day'}
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
              {deal.title}
            </h2>

            <p className="text-slate-300 font-medium leading-relaxed max-w-xl">
              {deal.subtitle}
            </p>

            {/* Countdown Clock */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Offer Ends In:
              </span>
              <div className="flex gap-3 items-center">
                <div className="flex flex-col items-center justify-center bg-slate-800/90 backdrop-blur-sm border border-slate-700/60 rounded-xl w-14 h-14 shadow-inner">
                  <span className="text-lg font-black text-white">{formatNumber(timeLeft.hours)}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Hrs</span>
                </div>
                <div className="text-2xl font-black text-slate-600">:</div>
                <div className="flex flex-col items-center justify-center bg-slate-800/90 backdrop-blur-sm border border-slate-700/60 rounded-xl w-14 h-14 shadow-inner">
                  <span className="text-lg font-black text-white">{formatNumber(timeLeft.minutes)}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Min</span>
                </div>
                <div className="text-2xl font-black text-slate-600">:</div>
                <div className="flex flex-col items-center justify-center bg-slate-800/90 backdrop-blur-sm border border-slate-700/60 rounded-xl w-14 h-14 shadow-inner">
                  <span className="text-lg font-black text-brand-400">{formatNumber(timeLeft.seconds)}</span>
                  <span className="text-[9px] font-bold text-brand-400/80 uppercase">Sec</span>
                </div>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <Link
                to={targetLink}
                className="bg-brand-500 hover:bg-brand-400 text-white font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-glow-brand flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {deal.ctaText || 'Grab the Deal'} <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex flex-col">
                {deal.originalPrice > deal.dealPrice && (
                  <span className="text-sm font-bold text-slate-400 line-through">
                    ₹{deal.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ₹{deal.dealPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Deal Image with Discount Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-center order-first lg:order-last mb-2 lg:mb-0"
          >
            <div className="relative w-full aspect-square max-w-[260px] sm:max-w-md mx-auto">
              <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-3xl animate-pulse" />
              <img
                src={deal.image}
                alt={deal.title}
                className="relative z-10 w-full h-full object-cover rounded-3xl transition-all duration-700 shadow-2xl rotate-2 hover:rotate-0"
              />
              {deal.discountPercentage > 0 && (
                <div className="absolute -top-4 -right-4 bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-lg sm:text-xl w-20 h-20 flex flex-col items-center justify-center rounded-full shadow-2xl rotate-12 border-4 border-slate-900 z-20">
                  <span>{deal.discountPercentage}%</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold -mt-1">OFF</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
