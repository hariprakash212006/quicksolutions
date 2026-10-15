import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Phone, Mail, MapPin, MessageCircle, CreditCard, ExternalLink, Tv2, ArrowRight } from 'lucide-react';
import axios from 'axios';

export const Footer: React.FC = () => {
  const [cms, setCms] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    axios.get('/api/cms').then((res) => {
      if (res.data.success) setCms(res.data.cms);
    }).catch(console.error);
  }, []);

  const [loading, setLoading] = useState(false);
  
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await axios.post('/api/subscribe', { email });
      setSubscribed(true);
      setEmail('');
    } catch (error) {
      alert('Failed to subscribe. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-slateCustom-950 text-slate-400 text-sm border-t border-slate-800">
      {/* Newsletter strip */}
      <div className="bg-gradient-to-r from-brand-900 to-slateCustom-950 border-b border-slate-800/80 py-12 px-4 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="text-center md:text-left">
            <h3 className="text-white font-black text-2xl tracking-tight">Stay Updated on New Arrivals & Offers</h3>
            <p className="text-slate-400 text-sm mt-2 font-medium">Get exclusive deals on CCTV and RO purifiers delivered to your inbox.</p>
          </div>
          {subscribed ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-900/40 px-6 py-4 rounded-2xl border border-emerald-800/60 shadow-inner">
              ✓ You're successfully subscribed!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex items-center w-full md:w-auto relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full md:w-80 bg-slate-900/80 text-white placeholder-slate-500 border border-slate-700/80 rounded-full pl-4 sm:pl-6 pr-24 sm:pr-32 py-3 sm:py-3.5 text-xs sm:text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all backdrop-blur-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-70 text-white font-bold px-4 sm:px-6 rounded-full text-xs sm:text-sm transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-1.5 sm:gap-2 shadow-lg"
              >
                {loading ? 'Joining...' : <>Join <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pt-16 pb-12">
        {/* Company Bio */}
        <div className="space-y-6">
          <div className="flex items-center gap-3.5">
            <img 
              src="/logo/logo.png" 
              alt="Quick Solutions" 
              className="h-12 md:h-14 w-auto object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.18)] transition-transform hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center font-black text-xl shadow-lg">
              QS
            </div>
            <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-white leading-none mb-1">QUICK SOLUTIONS</span>
                <span className="text-[10px] font-bold tracking-[0.25em] text-brand-400 uppercase leading-none">SECURITY • SOLAR • RO</span>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed font-medium pr-4">
            {cms?.businessInfo?.footerText || 'Your trusted provider of 5MP Smart CCTV surveillance, solar panel systems, DVR/NVR recorders, 14-stage RO water purifiers, and professional doorstep installation services in India.'}
          </p>
          <div className="flex items-center gap-3 text-emerald-400 text-xs font-bold bg-slate-900 p-3 rounded-xl border border-slate-800">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>Authorized Dealer of CP Plus, Hikvision, Waaree & Tata Solar</span>
          </div>
          {/* Social Links */}
          <div className="flex items-center gap-3 pt-2">
            <a
              href={`https://wa.me/${cms?.businessInfo?.phone?.replace(/\D/g, '') || '919876543210'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-slate-900 hover:bg-emerald-600 border border-slate-800 hover:border-emerald-500 text-slate-400 hover:text-white rounded-xl transition-all hover:scale-110"
              title="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="p-2.5 bg-slate-900 hover:bg-pink-600 border border-slate-800 hover:border-pink-500 text-slate-400 hover:text-white rounded-xl transition-all hover:scale-110"
              title="Instagram"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="p-2.5 bg-slate-900 hover:bg-red-600 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-white rounded-xl transition-all hover:scale-110"
              title="YouTube"
            >
              <Tv2 className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6 lg:pl-8">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs">Categories</h4>
          <ul className="space-y-3.5 text-sm font-medium">
            {[
              ['/shop?category=cctv-security', 'CCTV Security Cameras'],
              ['/shop?category=dvr-nvr-systems', 'DVR / NVR Recorders'],
              ['/shop?category=solar-panels', 'Solar Panels & Systems'],
              ['/shop?category=water-purifiers-ro', 'RO Water Purifiers & Filters'],
              ['/shop?category=accessories', 'Surveillance & Solar Accessories'],
              ['/shop?category=installation-services', 'Doorstep Installation & AMC'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-brand-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-brand-500 group-hover:scale-150 transition-all shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Support */}
        <div className="space-y-6">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs">Customer Support</h4>
          <ul className="space-y-3.5 text-sm font-medium">
            {[
              ['/account', 'My Account & Orders'],
              ['/faq', 'Frequently Asked Questions'],
                ['/feedback', 'Customer Feedback'],
              ['/about', 'About Quick Solutions For U'],
              ['/terms-conditions', 'Warranty & Return Policy'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-brand-400 transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-brand-500 group-hover:scale-150 transition-all shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs">Contact Us</h4>
          <div className="space-y-4 text-sm font-medium">
            <div className="flex items-start gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
              <MapPin className="w-5 h-5 text-brand-400 shrink-0" />
              <span className="leading-snug">{cms?.businessInfo?.address || 'Plot 42, Tech Park, Main Ring Road, New Delhi 110001'}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
              <Phone className="w-5 h-5 text-brand-400 shrink-0" />
              <a href={`tel:${cms?.businessInfo?.phone}`} className="hover:text-white transition-colors">
                {cms?.businessInfo?.phone || '+91 98765 43210'}
              </a>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
              <Mail className="w-5 h-5 text-brand-400 shrink-0" />
              <a href={`mailto:${cms?.businessInfo?.email}`} className="hover:text-white transition-colors">
                {cms?.businessInfo?.email || 'support@quicksolutionsforu.in'}
              </a>
            </div>
          </div>

          {/* Payment Icons */}
          <div className="pt-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 font-bold">Secure Payments</p>
            <div className="flex items-center gap-2.5 flex-wrap">
              {['UPI', 'Visa', 'Mastercard', 'Razorpay', 'COD'].map((method) => (
                <span
                  key={method}
                  className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" /> {method}
                </span>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="pt-4">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3935.1613487583536!2d77.68465577483896!3d9.494692190586417!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06dd1b3ebde03b%3A0xf45058f84b7b03f3!2sQUICK%20SOLUTIONS!5e0!3m2!1sen!2sin!4v1791686901663!5m2!1sen!2sin" 
              width="100%" 
              height="160" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="strict-origin-when-cross-origin"
              className="rounded-xl shadow-sm border border-slate-800 opacity-80 hover:opacity-100 transition-opacity"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-slateCustom-950 border-t border-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4 font-medium text-center md:text-left">
            <p>
              © {new Date().getFullYear()} Quick Solutions For U (quicksolutionsforu.in). All rights reserved.{' '}
              {cms?.businessInfo?.gstin && <span className="block sm:inline sm:ml-2 sm:pl-2 sm:border-l sm:border-slate-700">GSTIN: {cms.businessInfo.gstin}</span>}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
              <Link to="/terms-conditions" className="hover:text-slate-300 transition-colors">Terms & Conditions</Link>
              <Link to="/shipping" className="hover:text-slate-300 transition-colors">Shipping Policy</Link>
            </div>
          </div>
      </div>
    </footer>
  );
};
