import React from 'react';
import { Truck, Map, Clock, ShieldAlert } from 'lucide-react';

export const ShippingPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-4 pt-6 sm:pt-12 pb-24 sm:pb-12 space-y-6 sm:space-y-8">
      <div className="text-center space-y-3 sm:space-y-4">
        <img 
          src="/logo/logo.png" 
          alt="Quick Solutions Logo" 
          className="h-16 sm:h-20 w-auto mx-auto object-contain drop-shadow-md mb-2 hover:scale-105 transition-transform"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Shipping Policy</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Last Updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-600" /> 1. Processing and Delivery Timelines
            </h2>
            <p>
              Orders are typically processed within 24 to 48 hours of confirmation. Delivery times vary based on your location but generally range from 3 to 7 business days. We partner with reliable courier services like BlueDart and Delhivery to ensure timely and safe delivery.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-brand-600" /> 2. Shipping Coverage
            </h2>
            <p>
              We deliver pan-India to all serviceable pin codes. Certain remote locations may experience slightly longer delivery times. Doorstep installation services for CCTV and RO systems are currently available in select major cities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand-600" /> 3. Shipping Charges
            </h2>
            <p>
              Standard shipping is free on orders exceeding ₹2,000. For orders below this amount, a nominal shipping fee will be calculated at checkout based on the delivery destination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-600" /> 4. Damages and Delays
            </h2>
            <p>
              If your package arrives damaged, please refuse the delivery and contact our support team immediately. While we strive to meet all delivery timelines, unforeseeable circumstances like severe weather or logistical disruptions may cause slight delays.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
