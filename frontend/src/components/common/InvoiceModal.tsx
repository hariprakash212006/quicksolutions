import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Download, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios';
import type { Order } from '../../types';

interface InvoiceModalProps {
  order: Order | any;
  isOpen?: boolean;
  onClose: () => void;
  cmsBusinessInfo?: any;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen = true, onClose, cmsBusinessInfo }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const endpoint = order._id ? `/api/orders/${order._id}/invoice` : `/api/orders/invoice`;
      const res = await axios.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // If direct backend PDF download fails (e.g. mock or auth fallback), trigger system print-to-PDF
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  const seller = cmsBusinessInfo || {
    name: 'Quick Solutions For U',
    address: 'Plot 42, Tech Park, Main Ring Road, New Delhi 110001',
    gstin: '07AAAAA0000A1Z5',
    phone: '+91 98765 43210',
    email: 'support@quicksolutionsforu.in',
    domain: 'quicksolutionsforu.in',
  };

  const addr = order.shippingAddress || {};
  const items = order.orderItems || [];
  const itemsSubtotal = order.itemsPrice ?? items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
  const tax = order.taxPrice ?? Math.round(itemsSubtotal * 0.18 / 1.18);
  const shipping = order.shippingPrice ?? 0;
  const discount = order.couponDiscount ?? 0;
  const grandTotal = order.totalPrice ?? (itemsSubtotal + shipping - discount);

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Top Action Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 print:hidden">
          {/* Back Option Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 shadow-sm"
              title="Back to previous screen"
            >
              <ArrowLeft className="w-4 h-4 text-brand-400" />
              <span>Back</span>
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold text-brand-400 tracking-wider">Official Tax Invoice</span>
              <span className="text-xs text-slate-400">• INV-{order.orderNumber}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Download Official PDF"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div ref={printRef} className="p-6 sm:p-10 space-y-8 bg-white text-slate-900 print:p-4 text-xs sm:text-sm">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/logo/logo.png" 
                  alt="Quick Solutions" 
                  className="w-10 h-10 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {seller.name}
                  </h1>
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block -mt-0.5">
                    Authorized CCTV & Water Technology Provider
                  </span>
                </div>
              </div>
              <p className="text-slate-500 text-xs max-w-sm pt-2 leading-relaxed">
                {seller.address}
              </p>
              <p className="text-slate-500 text-xs">
                GSTIN: <strong className="text-slate-800">{seller.gstin}</strong> • Email: {seller.email}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 sm:bg-transparent sm:p-0 sm:border-none">
              <span className="inline-block bg-brand-50 text-brand-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-brand-200">
                Tax Invoice
              </span>
              <p className="text-xs text-slate-500 pt-1">
                Invoice No: <strong className="text-slate-900 font-mono">INV-{order.orderNumber}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Order Date: <strong className="text-slate-900">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Payment Status: <strong className="text-emerald-600 font-semibold">{order.paymentInfo?.status || 'Paid'}</strong>
              </p>
            </div>
          </div>

          {/* Customer & Shipping Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bill To / Ship To:</span>
              <p className="font-extrabold text-sm text-slate-900">{addr.fullName || 'Customer'}</p>
              <p className="text-slate-600 text-xs leading-relaxed">{addr.addressLine || addr.addressLine1}</p>
              {addr.addressLine2 && <p className="text-slate-600 text-xs leading-relaxed">{addr.addressLine2}</p>}
              <p className="text-slate-600 text-xs">{addr.city}, {addr.state} - {addr.pincode}</p>
              <p className="text-slate-500 text-xs pt-1">Phone: <strong className="text-slate-800">{addr.phone}</strong></p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order & Logistics Info:</span>
              <div className="text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <strong className="text-slate-800">{order.paymentMethod || 'Online'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Order Status:</span>
                  <strong className="text-brand-600 font-semibold">{order.orderStatus}</strong>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span>Airway Bill / Tracking:</span>
                    <strong className="font-mono text-slate-800">{order.trackingNumber}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Place of Supply:</span>
                  <strong className="text-slate-800">{addr.state || 'Delhi'}, India</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Products Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">Product Description</th>
                  <th className="p-3 text-center">HSN</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">GST (18%)</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item: any, i: number) => {
                  const lineTotal = item.price * item.quantity;
                  const itemTax = Math.round(lineTotal * 0.18 / 1.18);
                  const basePrice = Math.round((lineTotal - itemTax) / item.quantity);
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center text-slate-400">{i + 1}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        {item.SKU && <p className="text-[10px] text-slate-400">SKU: {item.SKU}</p>}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">852580</td>
                      <td className="p-3 text-center font-semibold text-slate-800">{item.quantity}</td>
                      <td className="p-3 text-right text-slate-600">₹{basePrice.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-slate-600">₹{itemTax.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-slate-900">₹{lineTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
            <div className="space-y-2 max-w-sm text-xs text-slate-500">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Genuine Certified Goods</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Standard 1-2 Year Manufacturer Warranty applies. Keep this invoice as proof of purchase for warranty and installation claims.
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{itemsSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (9%) + SGST (9%):</span>
                <span className="font-semibold text-slate-900">₹{tax.toLocaleString('en-IN')} (incl.)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery & Handling:</span>
                <span className="font-semibold text-slate-900">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount:</span>
                  <span>- ₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm sm:text-base font-black text-slate-900">
                <span>Total Amount:</span>
                <span className="text-brand-600 font-mono text-base sm:text-lg">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Declaration */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              <p>Computer-generated invoice. Authorized by {seller.name}.</p>
              <p>For support contact: {seller.phone} or {seller.email}</p>
            </div>
            <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
              <div className="inline-block border border-slate-200 px-4 py-2 rounded-xl bg-slate-50 text-slate-700 font-bold text-[10px]">
                Authorized Signatory
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Action / Back Footer (Hidden on Print) */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 print:hidden">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-brand-500" />
            <span>Back to Orders</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download Invoice PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
