import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSection {
  category: string;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    category: '🛒 Orders & Delivery',
    items: [
      { q: 'Do you offer free delivery?', a: 'Yes! We offer free express delivery on all orders above ₹2,000. Orders below that threshold have a flat ₹99 shipping fee. Products are dispatched within 24 hours on business days.' },
      { q: 'How long does delivery take?', a: 'Standard delivery takes 3–5 business days. For metro cities (Delhi, Mumbai, Bangalore, Chennai, Hyderabad), we often deliver within 1–2 days via express courier partners.' },
      { q: 'Can I track my order?', a: 'Yes. Once your order is dispatched, you will receive a tracking link via SMS and email. You can also check your order status in the "My Account" section.' },
      { q: 'Do you accept Cash on Delivery (COD)?', a: 'Yes, we accept COD for orders up to ₹15,000. For higher-value orders, we require online payment via UPI, Debit/Credit Card, or Net Banking through Razorpay.' },
    ],
  },
  {
    category: '📷 CCTV & Security Systems',
    items: [
      { q: 'What is the difference between a DVR and NVR?', a: 'A DVR (Digital Video Recorder) works with analog CCTV cameras via coaxial cable. An NVR (Network Video Recorder) works with IP cameras over an ethernet network. NVR systems generally support higher resolutions (4K+) and are more scalable.' },
      { q: 'What resolution should I choose for home security?', a: 'For most homes, 2MP (1080p Full HD) cameras are sufficient. For larger properties or those needing number plate/face recognition, we recommend 5MP or 8MP (4K) cameras. Our team can advise based on your layout.' },
      { q: 'Do your CCTV cameras work at night?', a: 'All our cameras feature either IR Night Vision (infrared LEDs for black-and-white night footage) or Full Color Night Vision (using Starlight/ColorVu technology for color images in low light). Product pages specify which type.' },
      { q: 'Can I view my cameras remotely on my phone?', a: 'Yes. All our DVR/NVR systems support remote viewing via mobile apps (CP Plus iCSee, Hik-Connect, etc.) on Android and iOS. We set this up during installation.' },
      { q: 'Do you sell cameras for outdoor use?', a: 'Yes. Our outdoor cameras are rated IP66 or IP67 for weatherproofing, suitable for rain, dust, and varying temperatures. Check the product specifications for the IP rating.' },
    ],
  },
  {
    category: '💧 RO Water Purifiers',
    items: [
      { q: 'What is a 14-stage RO purifier?', a: 'A 14-stage RO purifier passes water through 14 filtration stages — including sediment filter, pre-carbon, RO membrane, UV sterilization, UF, post-carbon, alkaline filter, and mineral cartridge. This ensures the purest, healthiest drinking water.' },
      { q: 'Is the copper RO purifier worth it?', a: 'Yes. Copper-infused RO purifiers add trace copper minerals to purified water, which has proven Ayurvedic health benefits including improved digestion and immunity. We recommend it if you prefer a natural mineral boost.' },
      { q: 'How often do RO membranes need replacement?', a: 'Typically every 12–18 months depending on water quality and usage. Pre-filters (sediment and carbon) usually need replacement every 6 months. We offer Annual Maintenance Contracts (AMC) for hassle-free upkeep.' },
      { q: 'Does RO remove TDS? What TDS level is safe to drink?', a: 'Yes, RO membranes reduce TDS by up to 95%. A TDS level of 50–150 ppm is ideal for drinking water. If your source water TDS is above 500 ppm, a RO purifier is strongly recommended.' },
    ],
  },
  {
    category: '🔧 Installation & Support',
    items: [
      { q: 'Do you offer doorstep installation?', a: 'Yes! Certified installation is available across major cities. Add an installation service to your cart while ordering, or contact us on WhatsApp to schedule. Our technician will call you to fix a convenient time.' },
      { q: 'How long does installation take?', a: 'A 4-camera CCTV system typically takes 2–4 hours. An RO purifier installation is 30–45 minutes. DVR/NVR rack installations may take longer depending on cable routing requirements.' },
      { q: 'What warranty do your products come with?', a: 'Warranty varies by product: CP Plus and Hikvision cameras carry 2-3 year manufacturer warranty. RO purifiers carry 1-2 year warranty with selected models offering lifetime membrane support. Specific warranty is listed on each product page.' },
      { q: 'How do I claim warranty?', a: 'Contact us via WhatsApp or email with your order number and a brief description of the issue. For hardware defects within the warranty period, we arrange free repair or replacement. Most claims are processed within 24–48 hours.' },
    ],
  },
  {
    category: '💳 Payments & Returns',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept UPI (PhonePe, Google Pay, Paytm), Debit/Credit Cards (Visa, Mastercard, Rupay), Net Banking, and Cash on Delivery. All online payments are secured through Razorpay.' },
      { q: 'What is your return policy?', a: 'We accept returns within 7 days for products that are damaged, defective, or significantly different from the listing. Items must be in original packaging. Please contact support before initiating a return.' },
      { q: 'How long do refunds take?', a: 'Approved refunds are processed within 5–7 business days and credited back to your original payment method. UPI refunds are typically faster (1–3 days).' },
    ],
  },
];

const FAQAccordion: React.FC<{ item: FAQItem; isOpen: boolean; onToggle: () => void }> = ({ item, isOpen, onToggle }) => (
  <div className={`border rounded-xl overflow-hidden transition-colors ${isOpen ? 'border-brand-300 dark:border-brand-700' : 'border-slate-200 dark:border-slate-800'}`}>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
    >
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.q}</span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="shrink-0"
      >
        <ChevronDown className={`w-4 h-4 ${isOpen ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <p className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
            {item.a}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const FAQ: React.FC = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  const toggle = (key: string) => setOpenItem(openItem === key ? null : key);

  return (
    <div className="space-y-0">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-brand-950 text-white py-12 sm:py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 relative z-10 flex flex-col items-center">
          <img 
            src="/logo/logo.png" 
            alt="Quick Solutions Logo" 
            className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-[0_4px_16px_rgba(255,255,255,0.2)] mb-2 hover:scale-105 transition-transform"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-label"
          >
            Help Center
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-xs sm:text-sm"
          >
            Find quick answers about our CCTV systems, RO purifiers, delivery, installation, and more.
          </motion.p>
        </div>
      </section>

      {/* FAQ Body */}
      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-6 sm:space-y-8">
        {/* Category tabs */}
        <div className="flex overflow-x-auto touch-scroll no-scrollbar pb-1 sm:flex-wrap gap-2">
          {faqData.map((section, i) => (
            <button
              key={section.category}
              onClick={() => setActiveSection(i)}
              className={`text-xs font-semibold px-4 py-2.5 rounded-full transition whitespace-nowrap shrink-0 ${
                activeSection === i
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 font-bold'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400'
              }`}
            >
              {section.category}
            </button>
          ))}
        </div>

        {/* Questions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
              {faqData[activeSection].category}
            </h2>
            {faqData[activeSection].items.map((item, i) => {
              const key = `${activeSection}-${i}`;
              return (
                <FAQAccordion
                  key={key}
                  item={item}
                  isOpen={openItem === key}
                  onToggle={() => toggle(key)}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Still have questions */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white text-center space-y-4">
          <h3 className="text-xl font-extrabold">Still Have Questions?</h3>
          <p className="text-emerald-100 text-sm">Chat with our experts on WhatsApp — we typically reply within minutes.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <a
              href="https://wa.me/919876543210?text=Hi! I have a question about your products."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
            <Link
              to="/feedback"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
