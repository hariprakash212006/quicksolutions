import React from 'react';
import { Shield, Lock, FileText, Globe } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-4 pt-6 sm:pt-12 pb-24 sm:pb-12 space-y-6 sm:space-y-8">
      <div className="text-center space-y-3 sm:space-y-4">
        <img 
          src="/logo/logo.png" 
          alt="Quick Solutions Logo" 
          className="h-16 sm:h-20 w-auto mx-auto object-contain drop-shadow-md mb-2 hover:scale-105 transition-transform"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Privacy Policy</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Last Updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-600" /> 1. Overview and Legal Framework
            </h2>
            <p>
              We at Quick Solutions prioritize the protection of your personal information. This Privacy Policy outlines our data processing practices aligned with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>. 
              <br />
              <a href="https://www.meity.gov.in/data-protection-framework" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-sm">Read more about DPDP Act, 2023</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" /> 2. Data Collection
            </h2>
            <p>We only collect data necessary to provide our e-commerce services, including:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Name, email, and phone number for account creation.</li>
              <li>Shipping and billing address for order fulfillment.</li>
              <li>Transaction data (securely processed, full payment details are not stored).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-600" /> 3. Data Security and Usage
            </h2>
            <p>
              Your data is encrypted and securely stored. We use your data to process orders, improve user experience, and send transactional updates. We strictly prohibit selling your personal data to third parties. We enforce reasonable security practices as mandated by Section 43A of the IT Act, 2000.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-brand-600" /> 4. User Rights
            </h2>
            <p>
              Under the DPDP Act, you have the right to access, correct, or request the deletion of your personal data. You may withdraw consent at any time by contacting our Grievance Officer.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
