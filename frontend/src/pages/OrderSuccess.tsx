import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Download, Truck } from 'lucide-react';
import axios from 'axios';
import type { Order } from '../types';

export const OrderSuccess: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/orders/${id}`).then((res) => {
      if (res.data.success) setOrder(res.data.order);
      setLoading(false);
    });
  }, [id]);

  const handleDownloadInvoice = async () => {
    try {
      const res = await axios.get(`/api/orders/${id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${order?.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert('Failed to download invoice');
    }
  };

  if (loading || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 font-semibold text-xs">Confirming your order details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-4 pt-6 sm:pt-12 pb-24 sm:pb-12 space-y-6 sm:space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Order Confirmed!</h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Thank you for ordering with Quick Solutions For U. Your order <strong className="text-brand-600">#{order.orderNumber}</strong> has been received.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-4">
          <button
            onClick={handleDownloadInvoice}
            className="w-full sm:w-auto px-5 py-3 bg-slate-900 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition"
          >
            <Download className="w-4 h-4" /> Download PDF Tax Invoice
          </button>
          <Link
            to="/account"
            className="w-full sm:w-auto px-5 py-3 bg-brand-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-brand-500 transition"
          >
            <Truck className="w-4 h-4" /> Track Order Status
          </Link>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Order Summary & Delivery Address
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <p className="text-slate-400 font-semibold mb-1">Delivering To:</p>
            <p className="font-bold text-slate-800 dark:text-slate-200">{order.shippingAddress.fullName}</p>
            <p className="text-slate-600 dark:text-slate-400">{order.shippingAddress.addressLine}</p>
            <p className="text-slate-600 dark:text-slate-400">
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Phone: {order.shippingAddress.phone}</p>
          </div>

          <div>
            <p className="text-slate-400 font-semibold mb-1">Payment & Order Info:</p>
            <p className="text-slate-600 dark:text-slate-400">Payment Method: <strong className="text-slate-800 dark:text-slate-200">{order.paymentMethod}</strong></p>
            <p className="text-slate-600 dark:text-slate-400">Status: <strong className="text-emerald-500">{order.orderStatus}</strong></p>
            <p className="text-slate-600 dark:text-slate-400">Total Paid: <strong className="text-brand-600 text-sm">₹{order.totalPrice.toLocaleString('en-IN')}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};
