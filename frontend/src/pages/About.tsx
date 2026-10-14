import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Wrench, Users, Award, Truck, Headphones,
  Camera, Droplets, CheckCircle2, ArrowRight,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

const values = [
  { icon: <ShieldCheck className="w-6 h-6 text-brand-500" />, title: 'Genuine Products', desc: 'Authorized dealer of CP Plus, Hikvision, Dahua & Aqua Fresh — every product is 100% original with box warranty.' },
  { icon: <Wrench className="w-6 h-6 text-cyan-500" />, title: 'Expert Installation', desc: 'Our certified technicians handle complete doorstep installation — from CCTV cabling to RO system setup.' },
  { icon: <Headphones className="w-6 h-6 text-emerald-500" />, title: 'Lifetime Support', desc: 'We stay with you beyond the sale. Get free technical support on WhatsApp anytime you need help.' },
  { icon: <Truck className="w-6 h-6 text-purple-500" />, title: 'Fast Delivery', desc: 'Express shipping with dispatch within 24 hours. Free delivery on all orders over ₹2,000.' },
];

const milestones = [
  { year: '2018', event: 'Founded as a local CCTV installation service in Malli,Srivilliputhur.' },
  { year: '2020', event: 'Expanded to selling CP Plus & Hikvision products online.' },
  { year: '2022', event: 'Added RO water purifier range — partnered with Aqua Fresh & Kent.' },
  { year: '2024', event: 'Crossed 500+ happy customers across 10+ cities in India.' },
  { year: '2026', event: 'Launched quicksolutionsforu.in — your complete security & water store.' },
];

export const About: React.FC = () => {
  return (
    <div className="space-y-0">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-slate-900 to-brand-950 text-white py-12 sm:py-20 px-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-5 relative z-10 flex flex-col items-center">
          <img 
            src="/logo/logo.png" 
            alt="Quick Solutions Logo" 
            className="h-16 sm:h-24 md:h-28 w-auto object-contain drop-shadow-[0_4px_16px_rgba(255,255,255,0.2)] mb-2 sm:mb-3"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <motion.span {...fadeUp()} className="section-label">Our Story</motion.span>
          <motion.h1 {...fadeUp(0.1)} className="text-2xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            About <span className="gradient-text">Quick Solutions For U</span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            We are India's trusted one-stop destination for professional CCTV security systems and pure water solutions. 
            Founded with a passion for making homes and businesses safer, we combine genuine products with expert installation.
          </motion.p>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div {...fadeUp()} className="space-y-5">
          <span className="section-label">Our Mission</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Making Security & Clean Water Accessible to Every Indian Home
          </h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            At Quick Solutions For U, we believe every family deserves the peace of mind that comes from reliable home security 
            and access to pure, healthy drinking water. We started as a small installation service and grew into a full-fledged 
            e-commerce store serving customers across India.
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            From a single 2MP camera installation to a 32-channel NVR system, or from a basic RO unit to a 14-stage copper 
            alkaline purifier — we guide our customers to make the right choice for their needs and budget.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            Explore Our Products <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div {...fadeUp(0.15)} className="grid grid-cols-2 gap-4">
          {[
            { icon: <Camera className="w-8 h-8 text-cyan-400" />, label: 'CCTV & Security', count: '100+ SKUs' },
            { icon: <Droplets className="w-8 h-8 text-blue-400" />, label: 'RO Purifiers', count: '50+ Models' },
            { icon: <Users className="w-8 h-8 text-brand-400" />, label: 'Happy Customers', count: '500+' },
            { icon: <Award className="w-8 h-8 text-amber-400" />, label: 'Years of Trust', count: '8 Years' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center space-y-2 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-center">{item.icon}</div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{item.count}</p>
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Values ── */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-16 px-4 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto space-y-10">
          <motion.div {...fadeUp()} className="text-center space-y-2">
            <span className="section-label">Why Choose Us</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">What Sets Us Apart</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} {...fadeUp(i * 0.08)}>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 h-full hover:shadow-lg transition">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl w-fit">{v.icon}</div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{v.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <motion.div {...fadeUp()} className="text-center space-y-2">
          <span className="section-label">Our Journey</span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">How We Grew</h2>
        </motion.div>
        <div className="relative border-l-2 border-brand-200 dark:border-brand-900 pl-8 space-y-8">
          {milestones.map((m, i) => (
            <motion.div key={m.year} {...fadeUp(i * 0.08)} className="relative">
              <div className="absolute -left-[2.6rem] top-1 w-5 h-5 rounded-full bg-brand-600 border-4 border-white dark:border-slate-950 shadow" />
              <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mb-1">{m.year}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{m.event}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Authorizations ── */}
      <section className="bg-slate-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.h2 {...fadeUp()} className="text-2xl font-extrabold">
            Trusted Authorizations & Partnerships
          </motion.h2>
          <motion.div {...fadeUp(0.1)} className="flex flex-wrap justify-center gap-3">
            {['CP Plus Authorized', 'Hikvision Partner', 'Dahua Dealer', 'Aqua Fresh Certified', 'Seagate Reseller'].map((badge) => (
              <span key={badge} className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {badge}
              </span>
            ))}
          </motion.div>
          <motion.div {...fadeUp(0.2)}>
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-7 py-3.5 rounded-xl transition mt-2"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Visit Us / Location ── */}
      <section className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-16 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Visit Our Office</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              We are located in the heart of the city. Drop by to explore our range of security cameras and water purifiers in person!
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3935.1613487583536!2d77.68465577483896!3d9.494692190586417!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06dd1b3ebde03b%3A0xf45058f84b7b03f3!2sQUICK%20SOLUTIONS!5e0!3m2!1sen!2sin!4v1791686901663!5m2!1sen!2sin" 
              width="100%" 
              height="450" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="strict-origin-when-cross-origin"
              className="rounded-2xl"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};
