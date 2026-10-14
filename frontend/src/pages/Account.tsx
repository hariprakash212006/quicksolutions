import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Package, LogOut, Download, Truck, CheckCircle2, User, MapPin, Save, Edit, Trash2, Heart, ShoppingCart, Eye, FileText, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import type { Order } from '../types';
import { InvoiceModal } from '../components/common/InvoiceModal';

export const Account: React.FC = () => {
  const { user, logout, loading: authLoading, refreshUser } = useAuth();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const initialTab = (['orders', 'profile', 'addresses', 'wishlist'].includes(tabFromUrl || '') ? tabFromUrl : 'orders') as 'orders' | 'profile' | 'addresses' | 'wishlist';

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'wishlist'>(initialTab);
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['orders', 'profile', 'addresses', 'wishlist'].includes(t)) {
      setActiveTab(t as any);
    }
  }, [searchParams]);
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: '', fullName: '', phone: '', addressLine: '', landmark: '', city: '', state: '', pincode: '', isDefault: false
  });

  const navigate = useNavigate();

  // Redirect unauthenticated users after auth check is complete
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user, authLoading, navigate]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await axios.put('/api/auth/profile', { name, phone });
      await refreshUser();
      alert('Profile updated successfully');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      axios.get('/api/orders/my-orders').then((res) => {
        if (res.data.success) setOrders(res.data.orders);
        setOrdersLoading(false);
      }).catch(() => setOrdersLoading(false));
      
      axios.get('/api/addresses').then((res) => {
        if (res.data.success) setAddresses(res.data.addresses);
        setAddressLoading(false);
      }).catch(() => setAddressLoading(false));
    }
  }, [user]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        const res = await axios.put(`/api/addresses/${editingAddressId}`, addressForm);
        if (res.data.success) setAddresses(res.data.addresses);
      } else {
        const res = await axios.post('/api/addresses', addressForm);
        if (res.data.success) setAddresses(res.data.addresses);
      }
      await refreshUser();
      setIsAddressFormOpen(false);
      setEditingAddressId(null);
    } catch (err) {
      alert('Failed to save address');
    }
  };

  const deleteAddress = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await axios.delete(`/api/addresses/${id}`);
      if (res.data.success) setAddresses(res.data.addresses);
      await refreshUser();
    } catch (err) {
      alert('Failed to delete address');
    }
  };

  const getStatusStepIndex = (status: string) => {
    const steps = ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const idx = steps.indexOf(status);
    return idx === -1 ? 1 : idx + 1;
  };

  if (authLoading) {
    return <div className="flex items-center justify-center py-24"><div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!user) return null; // will redirect via useEffect

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-24 md:pb-8 space-y-6 sm:space-y-8">
      {/* Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-brand-950 text-white rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-white shadow-lg shrink-0">
            {user?.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold truncate">{user?.name}</h1>
              <span className="text-[10px] uppercase font-bold bg-brand-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-full shrink-0">
                {user?.role === 'admin' ? 'Store Administrator' : 'Verified Customer'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 truncate">{user?.email} • {user?.phone}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full md:w-auto justify-center px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="flex space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto touch-scroll no-scrollbar">
        {[
          { id: 'orders', label: 'My Orders', icon: Package },
          { id: 'wishlist', label: `My Favorites (${wishlist.length})`, icon: Heart },
          { id: 'profile', label: 'Profile Info', icon: User },
          { id: 'addresses', label: 'Address Book', icon: MapPin },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" /> My Orders & Live Dispatch Tracking
          </h2>
          <span className="text-xs text-slate-500 font-semibold">{orders.length} total orders</span>
        </div>

        {ordersLoading ? (
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Orders Placed Yet</p>
            <p className="text-xs text-slate-500">Your future order history will be displayed here.</p>
          </div>
        ) : (
          orders.map((ord) => {
            const stepIdx = getStatusStepIndex(ord.orderStatus);
            return (
              <div
                key={ord._id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-sm"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold">Order ID: </span>
                    <strong className="text-sm font-extrabold text-brand-600 dark:text-brand-400">#{ord.orderNumber}</strong>
                    <span className="text-xs text-slate-400 ml-3">
                      Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInvoiceOrder(ord)}
                      className="text-xs bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-600" /> View Invoice
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.get(`/api/orders/${ord._id}/invoice`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `Invoice-${ord.orderNumber}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.parentNode?.removeChild(link);
                        } catch (err) {
                          alert('Failed to download invoice');
                        }
                      }}
                      className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-600" /> PDF
                    </button>
                  </div>
                </div>

                {/* Live Order Tracking Timeline */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-brand-600" /> Live Delivery Progress
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Status: {ord.orderStatus}
                    </span>
                  </div>

                  {/* Visual Stepper */}
                  <div className="grid grid-cols-6 gap-1 pt-2">
                    {['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].map(
                      (stepName, i) => {
                        const isDone = i < stepIdx;
                        return (
                          <div key={stepName} className="flex flex-col items-center text-center space-y-1">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
                                isDone
                                  ? 'bg-brand-600 text-white shadow-md'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                              }`}
                            >
                              {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 hidden sm:block">
                              {stepName}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {ord.trackingNumber && (
                    <div className="text-xs text-slate-500 border-t border-slate-200/60 dark:border-slate-700/60 pt-2 flex items-center justify-between">
                      <span>Tracking Airway Bill: <strong className="text-slate-800 dark:text-slate-200 font-mono">{ord.trackingNumber}</strong></span>
                      <span>Courier: <strong className="text-brand-600 font-semibold">{ord.courierPartner || 'BlueDart Express'}</strong></span>
                    </div>
                  )}
                </div>

                {/* Items Purchased */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Items</h4>
                  {ord.orderItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-xl gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg bg-white border border-slate-200 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">{item.name}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Qty: {item.quantity} • Unit Price: ₹{item.price.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white shrink-0 text-right">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Total */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-xs">
                  <span className="text-slate-500">
                    Payment Method: <strong className="text-slate-800 dark:text-slate-200">{ord.paymentMethod}</strong> ({ord.paymentInfo?.status})
                  </span>
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">
                    Grand Total: <strong className="text-brand-600 dark:text-brand-400">₹{ord.totalPrice.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-2xl space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <User className="w-5 h-5 text-brand-600" />
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Profile Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition"
                  >
                    <Save className="w-4 h-4" />
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'addresses' && (
            <motion.div
              key="addresses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Saved Addresses</h2>
                </div>
                {!isAddressFormOpen && (
                  <button 
                    onClick={() => {
                      setAddressForm({ label: '', fullName: '', phone: '', addressLine: '', landmark: '', city: '', state: '', pincode: '', isDefault: false });
                      setEditingAddressId(null);
                      setIsAddressFormOpen(true);
                    }}
                    className="text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-lg font-bold border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors"
                  >
                    + Add New
                  </button>
                )}
              </div>
              
              {isAddressFormOpen ? (
                <form onSubmit={handleAddressSubmit} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Label (e.g. Home, Office)</label>
                      <input required type="text" value={addressForm.label} onChange={e => setAddressForm({...addressForm, label: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                      <input required type="text" value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                      <input required type="tel" value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Pincode</label>
                      <input required type="text" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Address (House No, Building, Street, Area)</label>
                      <input required type="text" value={addressForm.addressLine} onChange={e => setAddressForm({...addressForm, addressLine: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Landmark (Optional)</label>
                      <input type="text" value={addressForm.landmark} onChange={e => setAddressForm({...addressForm, landmark: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">City</label>
                      <input required type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">State</label>
                      <input required type="text" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="isDefault" checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} className="rounded text-brand-600 focus:ring-brand-500" />
                    <label htmlFor="isDefault" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Set as default address</label>
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl transition">
                      {editingAddressId ? 'Update Address' : 'Save Address'}
                    </button>
                    <button type="button" onClick={() => { setIsAddressFormOpen(false); setEditingAddressId(null); }} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-2.5 px-6 rounded-xl transition">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {addressLoading ? (
                     <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                  ) : addresses.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-500 text-sm font-semibold">
                      No addresses saved yet.
                    </div>
                  ) : (
                    addresses.map(addr => (
                      <div key={addr._id} className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 relative group hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                        {addr.isDefault && (
                          <div className="absolute top-4 right-4 text-[10px] bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 px-2 py-0.5 rounded-full font-bold border border-brand-200 dark:border-brand-800">
                            Default
                          </div>
                        )}
                        <h3 className="font-extrabold text-sm mb-1 flex items-center gap-2">
                          {addr.fullName} <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">{addr.label}</span>
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[250px] mt-2">
                          {addr.addressLine}<br/>
                          {addr.landmark ? `${addr.landmark}, ` : ''}{addr.city}, {addr.state} {addr.pincode}<br/>
                          India
                        </p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
                          Mobile: {addr.phone}
                        </p>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setAddressForm({
                                label: addr.label, fullName: addr.fullName, phone: addr.phone, 
                                addressLine: addr.addressLine, landmark: addr.landmark || '', 
                                city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault
                              });
                              setEditingAddressId(addr._id);
                              setIsAddressFormOpen(true);
                            }}
                            className="text-xs flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            onClick={() => deleteAddress(addr._id)}
                            className="text-xs flex items-center gap-1 font-bold text-red-600 hover:text-red-700 dark:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ── My Favorites / Wishlist Tab ── */}
          {activeTab === 'wishlist' && (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 fill-rose-500 stroke-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">My Favorite Products</h2>
                    <p className="text-xs text-slate-500">Items you have saved to purchase later</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg">
                  {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {wishlist.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Heart className="w-8 h-8 stroke-slate-300 dark:stroke-slate-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Your favorites list is empty</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Explore our top CCTV cameras, DVRs, and RO water purifiers and tap the heart icon to save them here!
                  </p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
                  >
                    Explore Catalog <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                  {wishlist.map((prod) => (
                    <div
                      key={prod._id}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 bg-slate-50/40 dark:bg-slate-800/20 hover:border-brand-300 dark:hover:border-brand-700 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-slate-800/80 p-2 sm:p-4 mb-2 sm:mb-3 flex items-center justify-center">
                          <img
                            src={prod.images?.[0] || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400'}
                            alt={prod.name}
                            className="w-full h-full object-contain"
                          />
                          {prod.discount > 0 && (
                            <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md">
                              -{prod.discount}%
                            </span>
                          )}
                          <button
                            onClick={() => toggleWishlist(prod)}
                            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-rose-500 shadow-sm hover:scale-110 transition active:scale-90"
                            title="Remove from favorites"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                          {prod.brand}
                        </span>
                        <Link to={`/product/${prod.slug}`}>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-brand-600 transition leading-snug">
                            {prod.name}
                          </h4>
                        </Link>
                      </div>

                      <div className="pt-3 sm:pt-4 mt-auto border-t border-slate-200/60 dark:border-slate-800 space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                              ₹{prod.sellingPrice?.toLocaleString('en-IN')}
                            </span>
                            {prod.mrp > prod.sellingPrice && (
                              <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                                ₹{prod.mrp?.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <span className={`text-[9px] sm:text-[10px] font-bold ${prod.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {prod.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => {
                              addToCart(prod, 1);
                              alert('Added to your cart!');
                            }}
                            disabled={prod.stock <= 0}
                            className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-[11px] sm:text-xs font-bold py-2 px-2 sm:px-3 rounded-xl flex items-center justify-center gap-1 transition active:scale-95"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline sm:inline">Add</span>
                          </button>
                          <Link
                            to={`/product/${prod.slug}`}
                            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition active:scale-95 shrink-0"
                            title="View Product"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tax Invoice Modal */}
      <InvoiceModal
        order={invoiceOrder}
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  );
};
