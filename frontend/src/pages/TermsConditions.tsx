import React from 'react';
import { FileCheck, BookOpen, Truck, Scale } from 'lucide-react';

export const TermsConditions: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-4 pt-6 sm:pt-12 pb-24 sm:pb-12 space-y-6 sm:space-y-8">
      <div className="text-center space-y-3 sm:space-y-4">
        <img 
          src="/logo/logo.png" 
          alt="Quick Solutions Logo" 
          className="h-16 sm:h-20 w-auto mx-auto object-contain drop-shadow-md mb-2 hover:scale-105 transition-transform"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Terms & Conditions</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Last Updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" /> 1. Compliance and Framework
            </h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. Our e-commerce operations strictly comply with the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong> issued by the Government of India.
              <br />
              <a href="https://consumeraffairs.nic.in/sites/default/files/E%20commerce%20rules.pdf" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-sm">Read the Consumer Protection (E-Commerce) Rules, 2020</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-brand-600" /> 2. Products and Pricing
            </h2>
            <p>
              We strive to display product colors, features, and specifications accurately. However, we cannot guarantee completely accurate portrayals due to monitor discrepancies. Prices are subject to change without notice, but will not affect confirmed orders. Prices are inclusive of all applicable taxes as per GST laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand-600" /> 3. Shipping, Returns, and Refunds
            </h2>
            <p>
              We honor a 7-day replacement policy for defective or damaged items upon delivery, compliant with consumer protection standards. Refund requests are processed within 5-7 business days to the original payment method. Delivery timelines are estimates; we use reputed logistics partners to ensure timely dispatch.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-600" /> 4. Governing Law and Jurisdiction
            </h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes relating to these terms and conditions shall be subject to the exclusive jurisdiction of the courts of New Delhi, India.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
