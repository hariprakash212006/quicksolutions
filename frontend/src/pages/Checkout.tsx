import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Truck, Tag } from 'lucide-react';
import axios from 'axios';

declare global {
  interface Window { Razorpay: any }
}

type Pay = 'UPI' | 'Card' | 'NetBanking' | 'COD';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
  'Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Puducherry','Chandigarh','Jammu and Kashmir','Ladakh',
];

// Loads checkout.js once
const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// FIX: only strip a 91/+91 prefix when the number is 12 digits (old code broke numbers starting with 91)
const normalizePhone = (raw: string) => {
  const d = raw.replace(/\D/g, '');
  return d.length === 12 && d.startsWith('91') ? d.slice(2) : d;
};

const inputCls =
  'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200';

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <div className={className}>
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
    {children}
  </div>
);

export const Checkout: React.FC = () => {
  const { cart, subtotal, shipping, total, appliedCoupon, couponDiscount, applyCoupon, removeCoupon, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false); // hard guard against double-submit

  const [formData, setFormData] = useState({
    fullName: '', phone: '', addressLine: '', landmark: '', city: '', state: 'Tamil Nadu', pincode: '',
    paymentMethod: 'UPI' as Pay,
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveToAccount, setSaveToAccount] = useState(false);

  const applySavedAddress = (addr: any) => {
    setFormData((f) => ({
      ...f,
      fullName: addr.fullName || user?.name || '',
      phone: addr.phone || user?.phone || '',
      addressLine: addr.addressLine || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || f.state,
      pincode: addr.pincode || '',
    }));
  };

  useEffect(() => {
    if (!user) return;
    axios.get('/api/addresses').then((res) => {
      const addrs = res.data.success && res.data.addresses?.length ? res.data.addresses : (user.addresses || []);
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        const def = addrs.find((a: any) => a.isDefault) || addrs[0];
        setSelectedAddressId(def._id || 'addr-0');
        applySavedAddress(def);
      } else {
        setFormData((f) => ({
          ...f,
          fullName: f.fullName || user.name || '',
          phone: f.phone || user.phone || '',
        }));
      }
    }).catch(() => {
      if (user.addresses?.length) {
        setSavedAddresses(user.addresses);
        const def = user.addresses.find((a: any) => a.isDefault) || user.addresses[0];
        setSelectedAddressId(def._id || 'addr-0');
        applySavedAddress(def);
      }
    });
  }, [user]);

  // FIX: must match server rule (!product.isCODEnabled blocks COD, so undefined = blocked)
  const codAllowed = cart.every((i) => i.product.isCODEnabled === true);
  useEffect(() => {
    // FIX: don't leave COD selected if the cart no longer allows it
    if (!codAllowed && formData.paymentMethod === 'COD') setFormData((f) => ({ ...f, paymentMethod: 'UPI' }));
  }, [codAllowed, formData.paymentMethod]);

  const set = (k: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((f) => ({ ...f, [k]: e.target.value }));

  const handleCouponApply = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    try {
      const res = await axios.post('/api/coupons/validate', { code: couponInput.trim(), orderValue: subtotal });
      if (res.data.success) {
        applyCoupon(couponInput.trim().toUpperCase(), res.data.coupon.discountAmount);
        setCouponInput('');
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const validate = (): string | null => {
    if (formData.fullName.trim().length < 3) return 'Enter your full name (at least 3 characters).';
    if (!/^[6-9][0-9]{9}$/.test(normalizePhone(formData.phone))) return 'Enter a valid 10-digit Indian mobile number.';
    if (!formData.addressLine.trim() || !formData.city.trim() || !formData.state.trim()) return 'Fill in all required address fields.';
    if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) return 'Enter a valid 6-digit pincode.';
    return null;
  };

  const finish = (orderId: string) => {
    // FIX: navigate first, then clear; otherwise the "cart is empty" screen flashes
    navigate(`/order-success/${orderId}`, { replace: true });
    setTimeout(clearCart, 0);
  };

  const payOnline = async (order: any) => {
    const ok = await loadRazorpay();
    if (!ok) throw new Error('Could not load Razorpay. Check your connection and try again.');

    const { data } = await axios.post('/api/payments/razorpay/create', { orderId: order._id });

    await new Promise<void>((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount, // paise, set by server
        currency: data.currency,
        name: 'QuickShop',
        description: `Order ${order.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: { name: formData.fullName.trim(), contact: normalizePhone(formData.phone), email: user?.email },
        notes: { orderNumber: order.orderNumber },
        theme: { color: '#0891b2' },
        // Only show the method the customer picked
        method: {
          upi: formData.paymentMethod === 'UPI',
          card: formData.paymentMethod === 'Card',
          netbanking: formData.paymentMethod === 'NetBanking',
          wallet: false,
          emi: false,
          paylater: false,
        },
        handler: async (resp: any) => {
          try {
            // Server verifies the HMAC signature - never trust the browser alone
            await axios.post('/api/payments/razorpay/verify', {
              orderId: order._id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            resolve();
          } catch (e) { reject(e); }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled. Your order is saved - you can retry from My Orders.')),
        },
      });
      rzp.on('payment.failed', (r: any) => reject(new Error(r.error?.description || 'Payment failed. Please try again.')));
      rzp.open();
    });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    if (!user) return navigate('/login?redirect=/checkout');

    const err = validate();
    if (err) return setFormError(err);
    setFormError('');

    submitting.current = true;
    setLoading(true);
    try {
      // Server recalculates every price; client numbers are display-only
      const res = await axios.post('/api/orders', {
        orderItems: cart.map((i) => ({ product: i.product._id, quantity: i.quantity })),
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: normalizePhone(formData.phone),
          addressLine: formData.addressLine.trim(),
          landmark: formData.landmark.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        paymentMethod: formData.paymentMethod,
        couponCode: appliedCoupon || undefined,
      });
      const order = res.data.order;

      if (formData.paymentMethod !== 'COD') await payOnline(order);

      // Auto-save new address to account if requested by customer
      if (saveToAccount && user) {
        axios.post('/api/addresses', {
          label: 'Home',
          fullName: formData.fullName.trim(),
          phone: normalizePhone(formData.phone),
          addressLine: formData.addressLine.trim(),
          landmark: formData.landmark.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          isDefault: savedAddresses.length === 0,
        }).catch(() => {});
      }

      finish(order._id);
    } catch (e: any) {
      setFormError(e.response?.data?.message || e.message || 'Failed to place order');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Your cart is empty</h2>
        <p className="text-xs text-slate-500">Add items to your cart before checking out.</p>
        <button onClick={() => navigate('/shop')} className="px-6 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl">
          Explore shop
        </button>
      </div>
    );
  }

  const methods: { id: Pay; label: string; icon: string }[] = [
    { id: 'UPI', label: 'UPI / GPay / PhonePe / Paytm', icon: '📱' },
    { id: 'Card', label: 'Debit & credit cards', icon: '💳' },
    { id: 'NetBanking', label: 'Net banking', icon: '🏦' },
    { id: 'COD', label: 'Cash on delivery', icon: '💵' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Checkout & delivery details</h1>
        <p className="text-xs text-slate-500 mt-0.5">Payments are processed securely by Razorpay</p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8" noValidate>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-600" /> Shipping address
              </h3>
              {savedAddresses.length > 0 && selectedAddressId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddressId(null);
                    setFormData((f) => ({
                      ...f,
                      fullName: user?.name || '',
                      phone: user?.phone || '',
                      addressLine: '',
                      landmark: '',
                      city: '',
                      pincode: '',
                    }));
                  }}
                  className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
                >
                  + Add / Enter Different Address
                </button>
              )}
            </div>

            {/* Saved Addresses Picker */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose from Saved Addresses:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr._id;
                    return (
                      <div
                        key={addr._id || addr.addressLine}
                        onClick={() => {
                          setSelectedAddressId(addr._id);
                          applySavedAddress(addr);
                        }}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer transition relative ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <input
                              type="radio"
                              name="savedAddressSelect"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedAddressId(addr._id);
                                applySavedAddress(addr);
                              }}
                              className="text-brand-600"
                            />
                            {addr.label || 'Saved Address'}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-extrabold px-1.5 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">{addr.fullName} • {addr.phone}</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name *"><input className={inputCls} autoComplete="name" value={formData.fullName} onChange={set('fullName')} /></Field>
              <Field label="Phone number *"><input className={inputCls} type="tel" autoComplete="tel" value={formData.phone} onChange={set('phone')} /></Field>
              <Field label="Flat, house no., building, street *" className="sm:col-span-2">
                <input className={inputCls} autoComplete="street-address" value={formData.addressLine} onChange={set('addressLine')} />
              </Field>
              <Field label="Landmark (optional)"><input className={inputCls} value={formData.landmark} onChange={set('landmark')} /></Field>
              <Field label="City *"><input className={inputCls} autoComplete="address-level2" value={formData.city} onChange={set('city')} /></Field>
              <Field label="State *">
                <select className={inputCls} value={formData.state} onChange={set('state')}>
                  {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Pincode *">
                <input className={inputCls} inputMode="numeric" maxLength={6} autoComplete="postal-code" value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })} />
              </Field>
            </div>

            {user && (!selectedAddressId || selectedAddressId === 'new') && (
              <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={saveToAccount}
                  onChange={(e) => setSaveToAccount(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>Save this address to my account address book for future orders</span>
              </label>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" /> Payment method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {methods.map((opt) => {
                const disabled = opt.id === 'COD' && !codAllowed;
                const selected = formData.paymentMethod === opt.id;
                return (
                  <label key={opt.id}
                    className={`p-3.5 sm:p-4 rounded-xl border flex items-center gap-3 transition ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800' : 'cursor-pointer'} ${
                      selected ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 text-brand-600 font-bold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    <input type="radio" name="payment" className="text-brand-600" checked={selected} disabled={disabled}
                      onChange={() => setFormData({ ...formData, paymentMethod: opt.id })} />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3"><span className="text-xl">{opt.icon}</span><span className="text-xs font-semibold">{opt.label}</span></div>
                      {disabled && <span className="text-[10px] text-red-500 mt-1 ml-9">Not available for items in your cart</span>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-brand-600" /> Promo code
            </h4>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                <span className="font-bold text-emerald-600">Coupon {appliedCoupon} applied</span>
                <button type="button" onClick={removeCoupon} className="text-red-500 font-bold hover:underline">Remove</button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" placeholder="Enter promo code" value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    // FIX: Enter inside this input used to submit the whole order form
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCouponApply(); } }}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-0 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 uppercase" />
                  <button type="button" onClick={handleCouponApply} className="px-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl">Apply</button>
                </div>
                {couponError && <p className="text-[11px] text-red-500 font-semibold">{couponError}</p>}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Order summary</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product._id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded-md" />}
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{product.name}</p>
                      <p className="text-slate-400">Qty: {quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">₹{(product.sellingPrice * quantity).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-emerald-500 font-bold">FREE</span> : `₹${shipping}`}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold"><span>Coupon discount</span><span>- ₹{couponDiscount.toLocaleString('en-IN')}</span></div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Grand total</span><span className="text-brand-600 dark:text-brand-400">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {formError && <p role="alert" className="text-xs text-red-500 font-semibold">{formError}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-cyan-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:from-brand-500 hover:to-cyan-500 transition active:scale-95 disabled:opacity-60">
              {loading ? 'Processing…' : formData.paymentMethod === 'COD' ? `Place order (₹${total.toLocaleString('en-IN')})` : `Pay ₹${total.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};