import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, DollarSign, TrendingUp, AlertTriangle, Plus, Trash2, Edit,
  FileText, Upload, Image as ImageIcon, Truck, Package, BarChart3,
  CheckCircle, Clock, XCircle, Eye, RefreshCw, Search, Star,
  MessageSquare, Settings, Bell, X, Save, Loader2, Download,
  Users, Sparkles, MapPin, Tag, Zap, CheckCircle2, Ticket,
} from 'lucide-react';
import axios from 'axios';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { AdminTabsNav } from '../components/admin/AdminTabsNav';
import { AdminTableScroll } from '../components/admin/AdminTableScroll';

// ── Tiny toast helper ───────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
const useToast = () => {
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const show = useCallback((msg: string, type: ToastType = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
};

const statusColors: Record<string, string> = {
  Pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  Confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Processing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Packed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  Shipped: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Out for Delivery': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Return Requested': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

const ORDER_STATUSES = ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
const SHIPPING_PRESETS = [
  'Dispatched within 24 hours',
  'Dispatched same day (order before 2 PM)',
  'Dispatched in 2-3 business days',
  'Dispatched in 5-7 business days',
];

const initialCouponState = {
  code: '',
  discountType: 'percentage' as 'percentage' | 'flat',
  discountValue: 10,
  minOrderValue: 1000,
  maxDiscountAmount: 500,
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  usageLimit: 100,
  usageLimitPerUser: 1,
  isActive: true,
};

const initialProductState = {
  name: '',
  slug: '',
  SKU: '',
  category: '',
  brand: 'CP Plus',
  mrp: 3000,
  sellingPrice: 1999,
  discount: 33,
  gst: 18,
  hsn: '85258090',
  stock: 20,
  lowStockThreshold: 5,
  shortDescription: '',
  description: '',
  warranty: '1 Year Manufacturer Warranty',
  installationDetails: 'Free doorstep setup available',
  shippingInformation: 'Dispatched within 24 hours',
  returnPolicy: '7 Days Replacement Policy',
  featuresText: 'Full Color Night Vision\nWeatherproof Body\nBuilt-in Audio Mic',
  specifications: [
    { key: 'Resolution', value: '5 Megapixel (2880 x 1620)' },
    { key: 'Night Vision', value: 'Full Color Warm Light up to 30 Meters' },
  ],
  images: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80'],
  featured: false,
  bestSeller: false,
  isCODEnabled: true,
  isReturnable: true,
  deliveryCharge: 0,
};

export const AdminDashboard: React.FC = () => {
  const { toast, show } = useToast();

  // ── Core State ──
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'deals' | 'promo' | 'coupons' | 'shipping' | 'cms' | 'reviews'>('overview');

  // ── Products State ──
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({ ...initialProductState });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Orders State ──
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [exportingOrders, setExportingOrders] = useState(false);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<any | null>(null);

  // ── Customers State ──
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [exportingCustomers, setExportingCustomers] = useState(false);
  const [savingCMS, setSavingCMS] = useState(false);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, { name: string; image: string; description: string }>>({});

  // ── Reviews State ──
  const [reviews, setReviews] = useState<any[]>([]);

  // ── Coupons State ──
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({ ...initialCouponState });
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponSearch, setCouponSearch] = useState('');

  // ── CMS State ──
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingText, setShippingText] = useState(SHIPPING_PRESETS[0]);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [warrantyText, setWarrantyText] = useState('');
  const [showCodModal, setShowCodModal] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);

  // ── Shipping Control System State ──
  const [shippingForm, setShippingForm] = useState({
    allProductsFreeShipping: false,
    freeShippingThreshold: 2000,
    defaultShippingFee: 99,
    enabled: true,
  });
  const [savingShipping, setSavingShipping] = useState(false);
  const [simulatedCartAmount, setSimulatedCartAmount] = useState(1500);

  // ── Bulk Delivery Charge Modal State ──
  const [showBulkDeliveryChargeModal, setShowBulkDeliveryChargeModal] = useState(false);
  const [bulkDeliveryCharge, setBulkDeliveryCharge] = useState<number>(0);
  const [bulkDeliveryCategory, setBulkDeliveryCategory] = useState<string>('');
  const [updatingBulkDelivery, setUpdatingBulkDelivery] = useState(false);
  
  const [cmsForm, setCmsForm] = useState({
      announcementText: 'Free Express Delivery on Orders Over 12,000 across India!',
      heroTitle: 'Next-Gen CCTV & Smart Security Systems',
      heroSubtitle: 'Protect your home and commercial property with 5MP Full-Color Night Vision Cameras.',
      heroImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&auto=format&fit=crop&q=80',
      heroCtaText: 'Shop All Products',
      heroCtaLink: '/shop',
      promoActive: true,
      promoBadge: 'FLASH SALE • LIMITED TIME',
      promoTitle: 'Mega Savings on CCTV Security & Alkaline RO Purifiers',
      promoDescription: 'Complete security cabling, 5MP night vision DVR setup & 14-stage RO installation at your doorstep with certified technicians.',
      promoImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1000&auto=format&fit=crop&q=80',
      promoCtaText: 'Shop Promotional Deals',
      promoCtaLink: '/shop',
      promoCouponCode: 'QUICK500',
      promoDiscountTag: 'FLAT ₹500 OFF',
      promoFeaturesText: 'Free Doorstep Site Inspection\nSame-Day Insured Dispatch Across India\n2-Year Official Brand Warranty\nCash On Delivery (COD) Available',
      businessPhone: '+91 98765 43210',
      businessEmail: 'support@quicksolutionsforu.in',
      businessAddress: 'Plot 42, Tech Park, Main Ring Road, New Delhi 110001',
      businessGstin: '07AAAAA0000A1Z5',
      footerText: 'Quick Solutions For U is India authorized dealer of Hikvision, CP Plus & Copper RO Water Purifiers.',
      // Deal of the Day
      dealActive: true,
      dealBadge: 'Deal of the Day',
      dealTitle: 'CP Plus 4MP Smart Wi-Fi PTZ Camera',
      dealSubtitle: '360° Vision, Color Night Vision, Two-Way Audio. Secure your home instantly with AI motion tracking.',
      dealProductId: '',
      dealProductSlug: '',
      dealOriginalPrice: 4999,
      dealPrice: 2499,
      dealDiscountPercentage: 50,
      dealImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600',
      dealEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      dealCtaText: 'Grab the Deal',
      dealCtaLink: '/shop',
    });

  // ── Data Fetch ──
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, prodRes, catRes, ordersRes, cmsRes, revRes, custRes, coupRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/products?limit=200'),
        axios.get('/api/categories'),
        axios.get('/api/admin/orders'),
        axios.get('/api/cms'),
        axios.get('/api/admin/reviews'),
        axios.get('/api/admin/customers').catch(() => ({ data: { success: false, customers: [] } })),
        axios.get('/api/admin/coupons').catch(() => ({ data: { success: false, coupons: [] } })),
      ]);

      if (dashRes.data.success) {
        setStats(dashRes.data.stats);
        setLowStock(dashRes.data.lowStockProducts);
        setRecentOrders(dashRes.data.recentOrders || []);
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
        setFilteredProducts(prodRes.data.products);
      }
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.orders);
        setFilteredOrders(ordersRes.data.orders);
      }
      if (custRes.data?.success) {
        setCustomers(custRes.data.customers || []);
        setFilteredCustomers(custRes.data.customers || []);
      }
      if (catRes.data.success && catRes.data.categories.length > 0) {
        setCategories(catRes.data.categories);
        const drafts: Record<string, any> = {};
        catRes.data.categories.forEach((cat: any) => {
          drafts[cat._id] = { name: cat.name || '', image: cat.image || '', description: cat.description || '' };
        });
        setCategoryDrafts(drafts);
        setProductForm((prev) => ({ ...prev, category: prev.category || catRes.data.categories[0]._id }));
      }
      if (revRes.data.success) setReviews(revRes.data.reviews);
      if (coupRes?.data?.success) setCoupons(coupRes.data.coupons || []);
      if (cmsRes.data.success && cmsRes.data.cms) {
        const c = cmsRes.data.cms;
        const banner = c.heroBanners?.[0] || {};
        const promo = c.promoBanner || {};
        const info = c.businessInfo || {};
        const ann = c.announcementBar || {};
        const deal = c.dealOfTheDay || {};
        setCmsForm({
          announcementText: ann.text || cmsForm.announcementText,
          heroTitle: banner.title || cmsForm.heroTitle,
          heroSubtitle: banner.subtitle || cmsForm.heroSubtitle,
          heroImage: banner.image || cmsForm.heroImage,
          heroCtaText: banner.ctaText || 'Shop All Products',
          heroCtaLink: banner.ctaLink || '/shop',
          promoActive: promo.active !== false,
          promoBadge: promo.badge || 'FLASH SALE • LIMITED TIME',
          promoTitle: promo.title || cmsForm.promoTitle,
          promoDescription: promo.description || cmsForm.promoDescription,
          promoImage: promo.image || cmsForm.promoImage,
          promoCtaText: promo.ctaText || cmsForm.promoCtaText,
          promoCtaLink: promo.ctaLink || cmsForm.promoCtaLink,
          promoCouponCode: promo.couponCode || 'QUICK500',
          promoDiscountTag: promo.discountTag || 'FLAT ₹500 OFF',
          promoFeaturesText: promo.features && promo.features.length > 0
            ? promo.features.join('\n')
            : cmsForm.promoFeaturesText,
          businessPhone: info.phone || cmsForm.businessPhone,
          businessEmail: info.email || cmsForm.businessEmail,
          businessAddress: info.address || cmsForm.businessAddress,
          businessGstin: info.gstin || cmsForm.businessGstin,
          footerText: info.footerText || cmsForm.footerText,
          dealActive: deal.active !== false,
          dealBadge: deal.badge || 'Deal of the Day',
          dealTitle: deal.title || 'CP Plus 4MP Smart Wi-Fi PTZ Camera',
          dealSubtitle: deal.subtitle || '360° Vision, Color Night Vision, Two-Way Audio. Secure your home instantly with AI motion tracking.',
          dealProductId: deal.productId || '',
          dealProductSlug: deal.productSlug || '',
          dealOriginalPrice: deal.originalPrice || 4999,
          dealPrice: deal.dealPrice || 2499,
          dealDiscountPercentage: deal.discountPercentage || 50,
          dealImage: deal.image || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600',
          dealEndTime: deal.endTime ? new Date(deal.endTime).toISOString().slice(0, 16) : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          dealCtaText: deal.ctaText || 'Grab the Deal',
          dealCtaLink: deal.ctaLink || '/shop',
        });

        if (c.shippingConfig) {
          setShippingForm({
            allProductsFreeShipping: !!c.shippingConfig.allProductsFreeShipping,
            freeShippingThreshold: Number(c.shippingConfig.freeShippingThreshold ?? 2000),
            defaultShippingFee: Number(c.shippingConfig.defaultShippingFee ?? 99),
            enabled: c.shippingConfig.enabled !== false,
          });
        }
      }
    } catch (err) {
      show('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // ── Product Search Filter ──
  useEffect(() => {
    const q = productSearch.toLowerCase();
    setFilteredProducts(
      products.filter(p => p.name.toLowerCase().includes(q) || p.SKU?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
    );
  }, [productSearch, products]);

  // ── Order Search/Filter ──
  useEffect(() => {
    let result = orders;
    if (orderStatusFilter) result = result.filter(o => o.orderStatus === orderStatusFilter);
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      result = result.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
        o.shippingAddress?.phone?.includes(q)
      );
    }
    setFilteredOrders(result);
  }, [orderSearch, orderStatusFilter, orders]);

  // ── Product Modal Handlers ──
  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setProductForm({ ...initialProductState, category: categories[0]?._id || '' });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProductId(product._id);
    const specsObj = product.specifications || {};
    const specsList = Object.keys(specsObj).map(k => ({ key: k, value: specsObj[k] }));
    setProductForm({
      name: product.name || '',
      slug: product.slug || '',
      SKU: product.SKU || '',
      category: typeof product.category === 'object' ? product.category._id : product.category,
      brand: product.brand || 'CP Plus',
      mrp: product.mrp || 0,
      sellingPrice: product.sellingPrice || 0,
      discount: product.discount || 0,
      gst: product.gst || 18,
      hsn: product.hsn || '85258090',
      stock: product.stock || 0,
      lowStockThreshold: product.lowStockThreshold || 5,
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      warranty: product.warranty || '1 Year Warranty',
      installationDetails: product.installationDetails || '',
      shippingInformation: product.shippingInformation || '',
      returnPolicy: product.returnPolicy || '',
      featuresText: (product.features || []).join('\n'),
      specifications: specsList.length > 0 ? specsList : [{ key: '', value: '' }],
      images: product.images?.length > 0 ? product.images : initialProductState.images,
      featured: !!product.featured,
      bestSeller: !!product.bestSeller,
      isCODEnabled: product.isCODEnabled !== false,
      isReturnable: product.isReturnable !== false,
      deliveryCharge: product.deliveryCharge ?? 0,
    });
    setShowProductModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    if (productForm.name) formData.append('productName', productForm.name);
    if (productForm.category) formData.append('category', productForm.category);

    try {
      const res = await axios.post('/api/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success && res.data.urls?.length) {
        const uploadedUrls: string[] = res.data.urls;
        setProductForm(prev => {
          // Remove default unsplash placeholder if present when real images are uploaded
          const existing = prev.images.filter(img => !img.includes('images.unsplash.com'));
          return {
            ...prev,
            images: [...existing, ...uploadedUrls],
          };
        });
        show(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded and optimized!`);
      }
    } catch (err: any) {
      show(err.response?.data?.message || 'Error uploading images', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const specsObject: Record<string, string> = {};
      productForm.specifications.forEach(s => { if (s.key.trim()) specsObject[s.key.trim()] = s.value.trim(); });
      const payload = {
        name: productForm.name,
        slug: productForm.slug || productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        SKU: productForm.SKU,
        category: productForm.category,
        brand: productForm.brand,
        mrp: Number(productForm.mrp),
        sellingPrice: Number(productForm.sellingPrice),
        discount: Number(productForm.discount),
        gst: Number(productForm.gst),
        hsn: productForm.hsn,
        stock: Number(productForm.stock),
        lowStockThreshold: Number(productForm.lowStockThreshold),
        shortDescription: productForm.shortDescription || productForm.name,
        description: productForm.description || productForm.name,
        warranty: productForm.warranty,
        installationDetails: productForm.installationDetails,
        shippingInformation: productForm.shippingInformation,
        returnPolicy: productForm.returnPolicy,
        features: productForm.featuresText.split('\n').filter(f => f.trim().length > 0),
        specifications: specsObject,
        images: productForm.images,
        featured: productForm.featured,
        bestSeller: productForm.bestSeller,
        isCODEnabled: productForm.isCODEnabled,
        isReturnable: productForm.isReturnable,
        deliveryCharge: Number(productForm.deliveryCharge || 0),
        status: 'published',
      };

      if (editingProductId) {
        await axios.put(`/api/admin/products/${editingProductId}`, payload);
        show('Product updated successfully!');
      } else {
        await axios.post('/api/admin/products', payload);
        show('Product added successfully!');
      }
      setShowProductModal(false);
      fetchDashboardData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Error saving product', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/products/${id}`);
      show('Product deleted');
      fetchDashboardData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Error deleting product', 'error');
    }
  };

  // ── Order Handlers ──
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!window.confirm(`Update order status to "${newStatus}"?`)) return;
    setUpdatingOrderId(orderId);
    try {
      await axios.put(`/api/admin/orders/${orderId}/status`, {
        orderStatus: newStatus,
        trackingNumber: 'TRK-' + Date.now().toString().slice(-8),
        courierPartner: 'BlueDart / Delhivery',
      });
      show(`Order status updated to ${newStatus}`);
      fetchDashboardData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Error updating order status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      const res = await axios.get(`/api/orders/${orderId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch {
      show('Failed to download invoice', 'error');
    }
  };

  // ── CMS Handler ──
  const handleSaveCMS = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    setSavingCMS(true);
    try {
      await axios.put('/api/admin/cms', {
        announcementBar: { text: cmsForm.announcementText, link: '/shop', active: true },
        heroBanners: [{ title: cmsForm.heroTitle, subtitle: cmsForm.heroSubtitle, image: cmsForm.heroImage, ctaText: cmsForm.heroCtaText, ctaLink: cmsForm.heroCtaLink }],
        promoBanner: {
          active: cmsForm.promoActive,
          badge: cmsForm.promoBadge,
          title: cmsForm.promoTitle,
          description: cmsForm.promoDescription,
          image: cmsForm.promoImage,
          ctaText: cmsForm.promoCtaText || 'Claim Offer Now',
          ctaLink: cmsForm.promoCtaLink || '/shop',
          couponCode: cmsForm.promoCouponCode,
          discountTag: cmsForm.promoDiscountTag,
          features: cmsForm.promoFeaturesText.split('\n').map((s: string) => s.trim()).filter(Boolean),
        },
        businessInfo: { name: 'Quick Solutions For U', domain: 'quicksolutionsforu.in', phone: cmsForm.businessPhone, email: cmsForm.businessEmail, whatsapp: cmsForm.businessPhone, address: cmsForm.businessAddress, gstin: cmsForm.businessGstin, footerText: cmsForm.footerText },
        dealOfTheDay: {
          active: cmsForm.dealActive,
          badge: cmsForm.dealBadge,
          title: cmsForm.dealTitle,
          subtitle: cmsForm.dealSubtitle,
          productId: cmsForm.dealProductId || undefined,
          productSlug: cmsForm.dealProductSlug,
          originalPrice: Number(cmsForm.dealOriginalPrice),
          dealPrice: Number(cmsForm.dealPrice),
          discountPercentage: Number(cmsForm.dealDiscountPercentage),
          image: cmsForm.dealImage,
          endTime: cmsForm.dealEndTime ? new Date(cmsForm.dealEndTime) : undefined,
          ctaText: cmsForm.dealCtaText,
          ctaLink: cmsForm.dealCtaLink,
        },
        shippingConfig: shippingForm,
      });
      show('Website content and Deal of the Day updated successfully!');
    } catch (err: any) {
      show(err.response?.data?.message || 'Error updating website content', 'error');
    } finally {
      setSavingCMS(false);
    }
  };

  // ── Dedicated Shipping Handlers ──
  const handleSaveShipping = async (customConfig?: typeof shippingForm) => {
    const configToSave = customConfig || shippingForm;
    setSavingShipping(true);
    try {
      await axios.put('/api/admin/cms', {
        shippingConfig: configToSave,
      });
      show('Shipping settings saved successfully!');
      fetchDashboardData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Error updating shipping settings', 'error');
    } finally {
      setSavingShipping(false);
    }
  };

  const handleToggleAllFreeShipping = async () => {
    const updated = {
      ...shippingForm,
      allProductsFreeShipping: !shippingForm.allProductsFreeShipping,
    };
    setShippingForm(updated);
    await handleSaveShipping(updated);
  };

  const handleBulkDeliveryCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBulkDelivery(true);
    try {
      const res = await axios.put('/api/admin/products/bulk/delivery-charge', {
        deliveryCharge: Number(bulkDeliveryCharge),
        categoryId: bulkDeliveryCategory || undefined,
      });
      show(res.data.message || `Delivery charge updated on ${res.data.modifiedCount} products!`);
      setShowBulkDeliveryChargeModal(false);
      fetchDashboardData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Error updating delivery charges', 'error');
    } finally {
      setUpdatingBulkDelivery(false);
    }
  };

  const handleSetAllProductsFreeDelivery = async () => {
    if (!window.confirm('Are you sure you want to set ₹0 Delivery Charge (Free Delivery) on all products?')) return;
    setUpdatingBulkDelivery(true);
    try {
      const res = await axios.put('/api/admin/products/bulk/delivery-charge', {
        deliveryCharge: 0,
      });
      show(res.data.message || `Free delivery set for ${res.data.modifiedCount} products!`);
      fetchDashboardData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Error updating products', 'error');
    } finally {
      setUpdatingBulkDelivery(false);
    }
  };

  const handleExportOrders = async () => {
    setExportingOrders(true);
    try {
      const res = await axios.get('/api/admin/export/orders', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QuickSolutions_Sales_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      show('Sales report exported to Excel successfully!');
    } catch {
      show('Failed to export sales report', 'error');
    } finally {
      setExportingOrders(false);
    }
  };

  const handleExportCustomers = async () => {
    setExportingCustomers(true);
    try {
      const res = await axios.get('/api/admin/export/customers', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QuickSolutions_Customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      show('Customers directory exported to Excel successfully!');
    } catch {
      show('Failed to export customers', 'error');
    } finally {
      setExportingCustomers(false);
    }
  };

  const handleUpdateCategory = async (catId: string) => {
    const draft = categoryDrafts[catId];
    if (!draft) return;
    setSavingCategoryId(catId);
    try {
      const res = await axios.put(`/api/admin/categories/${catId}`, draft);
      if (res.data.success) {
        show(`Category "${draft.name}" updated successfully!`);
        setCategories(prev => prev.map(c => c._id === catId ? res.data.category : c));
      }
    } catch (err: any) {
      show(err.response?.data?.message || 'Error updating category', 'error');
    } finally {
      setSavingCategoryId(null);
    }
  };

  // ── Coupon Handlers ──
  const handleOpenAddCoupon = () => {
    setEditingCouponId(null);
    setCouponForm({ ...initialCouponState });
    setShowCouponModal(true);
  };

  const handleOpenEditCoupon = (c: any) => {
    setEditingCouponId(c._id);
    setCouponForm({
      code: c.code || '',
      discountType: c.discountType || 'percentage',
      discountValue: c.discountValue || 10,
      minOrderValue: c.minOrderValue || 0,
      maxDiscountAmount: c.maxDiscountAmount || 0,
      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0, 10) : '',
      usageLimit: c.usageLimit || 100,
      usageLimitPerUser: c.usageLimitPerUser || 1,
      isActive: c.isActive !== false,
    });
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      show('Please enter a coupon code', 'error');
      return;
    }
    setSavingCoupon(true);
    try {
      if (editingCouponId) {
        const res = await axios.put(`/api/admin/coupons/${editingCouponId}`, couponForm);
        if (res.data.success) {
          show(`Coupon ${couponForm.code.toUpperCase()} updated successfully!`);
          setCoupons(prev => prev.map(c => c._id === editingCouponId ? res.data.coupon : c));
          setShowCouponModal(false);
        }
      } else {
        const res = await axios.post('/api/admin/coupons', couponForm);
        if (res.data.success) {
          show(`Coupon ${couponForm.code.toUpperCase()} created successfully!`);
          setCoupons(prev => [res.data.coupon, ...prev]);
          setShowCouponModal(false);
        }
      }
    } catch (err: any) {
      show(err.response?.data?.message || 'Failed to save coupon', 'error');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (c: any) => {
    try {
      const res = await axios.put(`/api/admin/coupons/${c._id}`, { isActive: !c.isActive });
      if (res.data.success) {
        show(`Coupon ${c.code} ${!c.isActive ? 'activated' : 'deactivated'}!`);
        setCoupons(prev => prev.map(item => item._id === c._id ? res.data.coupon : item));
      }
    } catch (err: any) {
      show(err.response?.data?.message || 'Failed to toggle coupon status', 'error');
    }
  };

  const handleDeleteCoupon = async (c: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${c.code}"?`)) return;
    try {
      const res = await axios.delete(`/api/admin/coupons/${c._id}`);
      if (res.data.success) {
        show(`Coupon ${c.code} deleted.`);
        setCoupons(prev => prev.filter(item => item._id !== c._id));
      }
    } catch (err: any) {
      show(err.response?.data?.message || 'Failed to delete coupon', 'error');
    }
  };

  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers(customers);
    } else {
      const q = customerSearch.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.includes(q)
        )
      );
    }
  }, [customerSearch, customers]);

  const handleBulkShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.put('/api/admin/products/bulk/shipping', { shippingText });
      show(`Updated ${res.data.modifiedCount} products!`);
      setShowShippingModal(false);
      fetchDashboardData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Error updating dispatch time', 'error');
    }
  };

  const handleBulkWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warrantyText.trim()) return;
    try {
      const res = await axios.put('/api/admin/products/bulk/warranty', { warrantyText });
      show(`Updated warranty on ${res.data.modifiedCount} products!`);
      setShowWarrantyModal(false);
      setWarrantyText('');
      fetchDashboardData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Error updating warranties', 'error');
    }
  };

  const handleBulkCod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.put('/api/admin/products/bulk/cod', { isCODEnabled: codEnabled });
      show(`COD ${codEnabled ? 'enabled' : 'disabled'} on ${res.data.modifiedCount} products!`);
      setShowCodModal(false);
      fetchDashboardData();
    } catch (err: any) {
      show(err.response?.data?.message || 'Error updating COD', 'error');
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-semibold text-sm">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingCount = orders.filter(o => ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.orderStatus)).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 transition-all ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-brand-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 text-white rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
          <div>
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Admin Command Center</span>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Quick Solutions Dashboard</h1>
            <p className="text-slate-400 text-xs mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowWarrantyModal(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition border border-white/10"
            >
              <Edit className="w-3.5 h-3.5" /> Bulk Warranty
            </button>
            <button
              onClick={() => setShowCodModal(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition border border-white/10"
            >
              <DollarSign className="w-3.5 h-3.5" /> Bulk COD
            </button>
            <button
              onClick={() => setShowShippingModal(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition border border-white/10"
            >
              <Truck className="w-3.5 h-3.5" /> Dispatch Time
            </button>
            <button
              onClick={() => setShowBulkDeliveryChargeModal(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition border border-white/10"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Shipping Charges
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
            <button onClick={fetchDashboardData} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition" title="Refresh">
              <RefreshCw className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Revenue', value: `₹${(stats?.totalSales || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
            { label: "Today's Sales", value: `₹${(stats?.todaySales || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950/40' },
            { label: 'Total Orders', value: stats?.totalOrders || 0, sub: `${pendingCount} pending`, icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40' },
            { label: 'Low Stock Items', value: stats?.lowStockCount || 0, sub: 'Need restock', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-800 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
              {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <AdminTabsNav
          tabs={[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'products', label: `Products (${products.length})`, icon: Package },
            { key: 'orders', label: `Orders (${orders.length})`, icon: ShoppingCart },
            { key: 'customers', label: `Customers (${customers.length})`, icon: Users },
            { key: 'deals', label: 'Deal of the Day', icon: Sparkles },
            { key: 'promo', label: 'Promo Banner', icon: Tag },
            { key: 'coupons', label: `Coupons (${coupons.length})`, icon: Ticket },
            { key: 'shipping', label: 'Shipping & Delivery', icon: Truck },
            { key: 'reviews', label: `Feedback (${reviews.length})`, icon: MessageSquare },
            { key: 'cms', label: 'Website CMS', icon: Settings },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* ══════════════════════════════════════════════════════ */}
        {/* OVERVIEW TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Orders */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2"><Clock className="w-4 h-4 text-brand-500" /> Recent Orders</h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs text-brand-600 font-semibold hover:underline">View all →</button>
              </div>
              <AdminTableScroll minWidth="650px" tableTitle="Recent Orders">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Order</th>
                      <th className="px-4 py-2.5 text-left">Customer</th>
                      <th className="px-4 py-2.5 text-left">Amount</th>
                      <th className="px-4 py-2.5 text-left">Status</th>
                      <th className="px-4 py-2.5 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {recentOrders.slice(0, 6).map(ord => (
                      <tr key={ord._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-bold text-brand-600">#{ord.orderNumber}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{ord.shippingAddress?.fullName}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">₹{ord.totalPrice?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[ord.orderStatus] || 'bg-slate-100 text-slate-600'}`}>{ord.orderStatus}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{new Date(ord.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No orders yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </AdminTableScroll>
            </div>

            {/* Low Stock */}
            {lowStock.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Low Inventory Alerts ({lowStock.length} items)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStock.map(prod => (
                    <div key={prod._id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center gap-3 text-xs">
                      <img src={prod.images?.[0]} alt={prod.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{prod.name}</p>
                        <p className="text-amber-600 font-semibold">{prod.stock} units left</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* PRODUCTS TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'products' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2"><Package className="w-4 h-4 text-brand-500" /> Product Catalog</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <button onClick={handleOpenAddModal} className="px-3 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 whitespace-nowrap">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
            <AdminTableScroll minWidth="880px" tableTitle="Products Inventory">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Price / MRP</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Options</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredProducts.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.images?.[0]} alt={p.name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0 border border-slate-100 dark:border-slate-800" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{p.name}</p>
                            <p className="text-[10px] text-brand-500 font-medium">{p.brand}</p>
                            <p className="text-[10px] text-slate-400">{p.warranty}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.SKU}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">₹{p.sellingPrice?.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-400 line-through">₹{p.mrp?.toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${p.stock <= (p.lowStockThreshold || 5) ? 'text-amber-500' : 'text-emerald-600'}`}>{p.stock} pcs</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {p.isCODEnabled && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded">COD</span>}
                          {p.isReturnable && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">Return</span>}
                          {p.featured && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded">Featured</span>}
                          {p.bestSeller && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded">Best</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenEditModal(p)} className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p._id, p.name)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No products found.</td></tr>
                  )}
                </tbody>
              </table>
            </AdminTableScroll>
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ORDERS TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-brand-500" /> Orders & Logistics</h3>
                <button
                  onClick={handleExportOrders}
                  disabled={exportingOrders}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm"
                >
                  {exportingOrders ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Export Sales (.xlsx)
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Search by order #, name or phone..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <AdminTableScroll minWidth="960px" tableTitle="Orders & Logistics">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Update</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredOrders.map(ord => (
                    <tr key={ord._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <p className="font-bold text-brand-600">#{ord.orderNumber}</p>
                        <p className="text-[10px] text-slate-400">{new Date(ord.createdAt).toLocaleDateString('en-IN')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{ord.shippingAddress?.fullName}</p>
                        <p className="text-[10px] text-slate-400">{ord.shippingAddress?.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{ord.paymentMethod}</p>
                        <p className={`text-[10px] font-bold ${ord.paymentInfo?.status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{ord.paymentInfo?.status || 'Pending'}</p>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white">₹{ord.totalPrice?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColors[ord.orderStatus] || 'bg-slate-100 text-slate-600'}`}>{ord.orderStatus}</span>
                      </td>
                      <td className="px-4 py-3">
                        {updatingOrderId === ord._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                        ) : (
                          <select
                            defaultValue={ord.orderStatus}
                            onChange={e => handleUpdateOrderStatus(ord._id, e.target.value)}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
                          >
                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            title="View items"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setInvoiceModalOrder(ord)}
                            className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition"
                            title="View & Print Tax Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </AdminTableScroll>
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* CUSTOMERS TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-500" /> Customer Management Directory
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">View customer contact details, saved addresses, purchase history and total spending.</p>
                  </div>
                  <button
                    onClick={handleExportCustomers}
                    disabled={exportingCustomers}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm"
                  >
                    {exportingCustomers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Export Customers (.xlsx)
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    placeholder="Search by name, email, or phone number..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <AdminTableScroll minWidth="920px" tableTitle="Customer Directory">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Saved Addresses</th>
                      <th className="px-4 py-3">Orders Placed</th>
                      <th className="px-4 py-3">Total Spend</th>
                      <th className="px-4 py-3">Joined Date</th>
                      <th className="px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredCustomers.map(cust => (
                      <tr key={cust._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{cust.name}</p>
                          <p className="text-[11px] text-slate-400">{cust.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                          {cust.phone || <span className="text-slate-400 italic">Not set</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3 h-3 text-brand-500" />
                            {cust.addresses?.length || 0} address{cust.addresses?.length === 1 ? '' : 'es'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {cust.orderCount || 0}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">
                          ₹{(cust.totalSpend || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {new Date(cust.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition"
                            title="View Customer Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          No customers found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </AdminTableScroll>
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                Showing {filteredCustomers.length} of {customers.length} registered customers
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* DEAL OF THE DAY TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'deals' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Column */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Deal of the Day Campaign
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Control the featured flash deal shown with live countdown timer on the homepage.</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>Active</span>
                  <input
                    type="checkbox"
                    checked={cmsForm.dealActive}
                    onChange={e => setCmsForm(prev => ({ ...prev, dealActive: e.target.checked }))}
                    className="w-5 h-5 text-brand-600 rounded accent-brand-600 cursor-pointer"
                  />
                </label>
              </div>

              {/* Select Product */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Product for Flash Deal
                </label>
                <select
                  value={cmsForm.dealProductId}
                  onChange={e => {
                    const prod = products.find(p => p._id === e.target.value);
                    if (prod) {
                      const disc = prod.mrp > prod.sellingPrice ? Math.round(((prod.mrp - prod.sellingPrice) / prod.mrp) * 100) : 10;
                      setCmsForm(prev => ({
                        ...prev,
                        dealProductId: prod._id,
                        dealProductSlug: prod.slug,
                        dealTitle: prod.name,
                        dealOriginalPrice: prod.mrp || prod.sellingPrice,
                        dealPrice: prod.sellingPrice,
                        dealDiscountPercentage: disc,
                        dealImage: prod.images?.[0] || prev.dealImage,
                        dealCtaLink: `/product/${prod.slug}`,
                      }));
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">-- Choose a product from catalog --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (₹{p.sellingPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Campaign Badge</label>
                  <input
                    type="text"
                    value={cmsForm.dealBadge}
                    onChange={e => setCmsForm(prev => ({ ...prev, dealBadge: e.target.value }))}
                    placeholder="e.g. FLASH DEAL OF THE DAY"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deal Headline / Title</label>
                  <input
                    type="text"
                    value={cmsForm.dealTitle}
                    onChange={e => setCmsForm(prev => ({ ...prev, dealTitle: e.target.value }))}
                    placeholder="Deal headline"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subtitle / Marketing Description</label>
                <textarea
                  rows={2}
                  value={cmsForm.dealSubtitle}
                  onChange={e => setCmsForm(prev => ({ ...prev, dealSubtitle: e.target.value }))}
                  placeholder="Compelling offer subtitle..."
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Pricing Controls */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={cmsForm.dealOriginalPrice}
                    onChange={e => {
                      const orig = Number(e.target.value);
                      const dp = cmsForm.dealPrice;
                      const disc = orig > dp && orig > 0 ? Math.round(((orig - dp) / orig) * 100) : 0;
                      setCmsForm(prev => ({ ...prev, dealOriginalPrice: orig, dealDiscountPercentage: disc }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deal Price (₹)</label>
                  <input
                    type="number"
                    value={cmsForm.dealPrice}
                    onChange={e => {
                      const dp = Number(e.target.value);
                      const orig = cmsForm.dealOriginalPrice;
                      const disc = orig > dp && orig > 0 ? Math.round(((orig - dp) / orig) * 100) : 0;
                      setCmsForm(prev => ({ ...prev, dealPrice: dp, dealDiscountPercentage: disc }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={cmsForm.dealDiscountPercentage}
                    onChange={e => setCmsForm(prev => ({ ...prev, dealDiscountPercentage: Number(e.target.value) }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* Deal Expiry Countdown Settings */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-500" /> Countdown Expiration Date & Time
                  </label>
                  <span className="text-[11px] text-slate-400">Timer counts down to this moment</span>
                </div>
                <input
                  type="datetime-local"
                  value={cmsForm.dealEndTime}
                  onChange={e => setCmsForm(prev => ({ ...prev, dealEndTime: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Presets:</span>
                  {[
                    { label: '+12 Hours', hours: 12 },
                    { label: '+24 Hours', hours: 24 },
                    { label: '+48 Hours', hours: 48 },
                    { label: '+7 Days', hours: 168 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const target = new Date(Date.now() + preset.hours * 60 * 60 * 1000).toISOString().slice(0, 16);
                        setCmsForm(prev => ({ ...prev, dealEndTime: target }));
                      }}
                      className="px-2.5 py-1 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-500 transition text-slate-700 dark:text-slate-300"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image URL & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deal Image URL</label>
                  <input
                    type="url"
                    value={cmsForm.dealImage}
                    onChange={e => setCmsForm(prev => ({ ...prev, dealImage: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    value={cmsForm.dealCtaText}
                    onChange={e => setCmsForm(prev => ({ ...prev, dealCtaText: e.target.value }))}
                    placeholder="Grab Deal Now"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveCMS()}
                disabled={savingCMS}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
              >
                {savingCMS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingCMS ? 'Saving Campaign...' : 'Publish Deal of the Day Changes'}
              </button>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Storefront Live Preview</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cmsForm.dealActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {cmsForm.dealActive ? '● Live on Storefront' : '○ Disabled'}
                  </span>
                </div>

                {/* Banner Mini Preview */}
                <div className="rounded-2xl p-5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-xl relative overflow-hidden">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-widest mb-2">
                    {cmsForm.dealBadge || 'FLASH DEAL'}
                  </span>
                  <h3 className="text-lg font-black leading-tight mb-1">{cmsForm.dealTitle || 'Special Promotion'}</h3>
                  <p className="text-xs text-white/80 mb-3 line-clamp-2">{cmsForm.dealSubtitle}</p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-black">₹{cmsForm.dealPrice?.toLocaleString('en-IN')}</span>
                    {cmsForm.dealOriginalPrice > cmsForm.dealPrice && (
                      <span className="text-xs line-through text-white/70">₹{cmsForm.dealOriginalPrice?.toLocaleString('en-IN')}</span>
                    )}
                    <span className="px-1.5 py-0.5 bg-yellow-400 text-slate-950 font-black text-[10px] rounded">
                      {cmsForm.dealDiscountPercentage}% OFF
                    </span>
                  </div>

                  {cmsForm.dealImage && (
                    <img
                      src={cmsForm.dealImage}
                      alt="Deal Preview"
                      className="w-full h-36 object-contain rounded-xl bg-white/10 p-2 mb-3"
                    />
                  )}

                  <div className="text-center bg-black/30 rounded-xl py-2 font-bold text-xs">
                    {cmsForm.dealCtaText || 'Grab Deal Now'} →
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* PROMO BANNER TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'promo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Controls Column (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand-500" /> Promotional Banner & Coupon Campaign
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live interactive storefront banner with real-time countdown, 1-click coupon copy, and WhatsApp quotation hotline.
                  </p>
                </div>
                {/* Active / Inactive Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setCmsForm(prev => ({ ...prev, promoActive: !prev.promoActive }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    cmsForm.promoActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cmsForm.promoActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                  {cmsForm.promoActive ? 'Banner Active' : 'Banner Disabled'}
                </button>
              </div>

              {/* Badge & Discount Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Badge (Top Pill)
                  </label>
                  <input
                    type="text"
                    value={cmsForm.promoBadge}
                    onChange={e => setCmsForm(prev => ({ ...prev, promoBadge: e.target.value }))}
                    placeholder="e.g. FLASH SALE • LIMITED TIME"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Highlight Tag
                  </label>
                  <input
                    type="text"
                    value={cmsForm.promoDiscountTag}
                    onChange={e => setCmsForm(prev => ({ ...prev, promoDiscountTag: e.target.value }))}
                    placeholder="e.g. FLAT ₹500 OFF or 50% SAVINGS"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              {/* Headline & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Main Campaign Title / Headline
                  </label>
                  <input
                    type="text"
                    value={cmsForm.promoTitle}
                    onChange={e => setCmsForm(prev => ({ ...prev, promoTitle: e.target.value }))}
                    placeholder="e.g. Mega Savings on CCTV Security & Alkaline RO Purifiers"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Campaign Description
                  </label>
                  <textarea
                    rows={3}
                    value={cmsForm.promoDescription}
                    onChange={e => setCmsForm(prev => ({ ...prev, promoDescription: e.target.value }))}
                    placeholder="Describe the offer, bundles, and value proposition..."
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              {/* Coupon Code & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-brand-500" />
                    Coupon Code (1-Click Copy on Site)
                  </label>
                  <input
                    type="text"
                    value={cmsForm.promoCouponCode}
                    onChange={e => setCmsForm(prev => ({ ...prev, promoCouponCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. QUICK500"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 focus:ring-2 focus:ring-brand-500/30"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Visitors can copy this code directly with 1 tap to paste at checkout.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-brand-500" />
                    Showcase Image URL
                  </label>
                  <input
                    type="url"
                    value={cmsForm.promoImage}
                    onChange={e => setCmsForm(prev => ({ ...prev, promoImage: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">High-definition product or combo preview image.</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={cmsForm.promoCtaText}
                    onChange={e => setCmsForm(prev => ({ ...prev, promoCtaText: e.target.value }))}
                    placeholder="Shop Promotional Deals"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Button Link
                  </label>
                  <input
                    type="text"
                    value={cmsForm.promoCtaLink}
                    onChange={e => setCmsForm(prev => ({ ...prev, promoCtaLink: e.target.value }))}
                    placeholder="/shop"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              {/* Feature Highlights (Trust Deck) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Trust Deck Checklist (One feature per line)
                </label>
                <textarea
                  rows={4}
                  value={cmsForm.promoFeaturesText}
                  onChange={e => setCmsForm(prev => ({ ...prev, promoFeaturesText: e.target.value }))}
                  placeholder="Free Doorstep Site Inspection&#10;Same-Day Insured Dispatch Across India&#10;2-Year Official Brand Warranty&#10;Cash On Delivery (COD) Available"
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={() => handleSaveCMS()}
                disabled={savingCMS}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
              >
                {savingCMS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingCMS ? 'Saving Campaign...' : 'Publish Promo Banner Changes'}
              </button>
            </div>

            {/* Live Storefront Preview Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-4 sticky top-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-brand-500" /> Real-Time Live Preview
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cmsForm.promoActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'}`}>
                    {cmsForm.promoActive ? '● Live on Storefront' : '○ Disabled'}
                  </span>
                </div>

                {/* Live Mini Storefront Card */}
                <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-950 via-brand-950 to-slate-900 text-white shadow-xl border border-brand-500/30 space-y-4 relative overflow-hidden">
                  {/* Status & Discount Pill */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/20 border border-brand-400/40 text-brand-300 text-[10px] font-black uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {cmsForm.promoBadge || 'FLASH DEAL'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      {cmsForm.promoDiscountTag || 'FLAT ₹500 OFF'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-base font-black leading-tight text-white line-clamp-2">
                      {cmsForm.promoTitle || 'Campaign Headline'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {cmsForm.promoDescription}
                    </p>
                  </div>

                  {/* Real-time Coupon Code Preview */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1 text-brand-300 font-semibold">
                        <Tag className="w-3 h-3 text-brand-400" /> Online Coupon
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">1-Click Copy</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                      <span className="font-mono text-sm font-black text-amber-300 tracking-wider">
                        {cmsForm.promoCouponCode || 'QUICK500'}
                      </span>
                      <span className="text-[10px] font-bold bg-white text-slate-900 px-2 py-0.5 rounded">
                        Copy Code
                      </span>
                    </div>
                  </div>

                  {/* Image Preview with limited badge */}
                  <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-slate-900 border border-white/10">
                    <img
                      src={cmsForm.promoImage || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80'}
                      alt="Promo Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-white" />
                      LIMITED COMBO
                    </div>
                  </div>

                  {/* Parsed features checklist */}
                  <div className="space-y-1.5 pt-1">
                    {cmsForm.promoFeaturesText.split('\n').filter(Boolean).slice(0, 3).map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="text-center bg-brand-600 rounded-lg py-2 font-bold text-xs text-white">
                      {cmsForm.promoCtaText || 'Shop Deals'} →
                    </div>
                    <div className="text-center bg-emerald-600 rounded-lg py-2 font-bold text-xs text-white">
                      WhatsApp Enquiry
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Changes typed in the editor reflect here immediately in real-time. Click <strong>"Publish Promo Banner Changes"</strong> to save live to MongoDB.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* COUPONS CONTROL SYSTEM TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            {/* Header + Stats Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5" /> Discount Engine
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Coupon Codes & Promotion Control
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create, configure, and monitor discount codes for shopping cart and checkout promotions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenAddCoupon}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition"
                >
                  <Plus className="w-4 h-4" /> Create New Coupon
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Coupons</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{coupons.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Active Now</p>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  {coupons.filter(c => c.isActive && new Date(c.expiryDate) >= new Date()).length}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Expired / Inactive</p>
                <p className="text-xl font-black text-red-500 mt-1">
                  {coupons.filter(c => !c.isActive || new Date(c.expiryDate) < new Date()).length}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Redemptions</p>
                <p className="text-xl font-black text-purple-600 mt-1">
                  {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
                </p>
              </div>
            </div>

            {/* Search Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="text"
                value={couponSearch}
                onChange={e => setCouponSearch(e.target.value)}
                placeholder="Search coupon code or discount type..."
                className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
              />
            </div>

            {/* Coupons Grid / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons
                .filter(c => !couponSearch.trim() || c.code.toLowerCase().includes(couponSearch.toLowerCase()))
                .map(coupon => {
                  const isExpired = new Date(coupon.expiryDate) < new Date();
                  const isLive = coupon.isActive && !isExpired;

                  return (
                    <div
                      key={coupon._id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 shadow-sm space-y-4 hover:border-brand-300 dark:hover:border-brand-700 transition"
                    >
                      {/* Top Bar: Code + Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800/80">
                            <span className="font-mono text-sm font-black text-brand-600 dark:text-brand-400 tracking-wider">
                              {coupon.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Min Order: ₹{coupon.minOrderValue?.toLocaleString('en-IN') || 0}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isLive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : isExpired
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {isLive ? '● Active' : isExpired ? '⚠️ Expired' : '○ Inactive'}
                        </span>
                      </div>

                      {/* Discount details */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Discount Benefit:</span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue?.toLocaleString('en-IN')} FLAT`}
                          </span>
                        </div>
                        {coupon.discountType === 'percentage' && coupon.maxDiscountAmount ? (
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Max Savings Cap:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              ₹{coupon.maxDiscountAmount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Expiry Date:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Usage counter */}
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Usage Count:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {coupon.usedCount || 0} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'uses'}
                          </span>
                        </div>
                        {coupon.usageLimit ? (
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-brand-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((coupon.usedCount || 0) / coupon.usageLimit) * 100)}%` }}
                            />
                          </div>
                        ) : null}
                      </div>

                      {/* Control Actions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(coupon)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            coupon.isActive
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCoupon(coupon)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                            title="Edit Coupon"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-500 transition"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {coupons.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
                  <Ticket className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-500">No coupons found.</p>
                  <button
                    type="button"
                    onClick={handleOpenAddCoupon}
                    className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Your First Coupon
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* REVIEWS TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-brand-500" /> Customer Feedback Moderation</h3>
              <p className="text-xs text-slate-500 mt-0.5">Approve feedback before it appears publicly on the site.</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reviews.map(rev => (
                <div key={rev._id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{rev.user?.name || 'Unknown User'}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rev.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {rev.isApproved ? '✓ Published' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 stroke-none' : 'stroke-slate-300'}`} />
                      ))}
                      <span className="text-[10px] text-slate-400 ml-1">{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{rev.comment}"</p>
                  </div>
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={async () => { await axios.put('/api/admin/reviews/' + rev._id + '/approve', { isApproved: !rev.isApproved }); fetchDashboardData(); show(rev.isApproved ? 'Approval revoked' : 'Published on site!'); }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap ${rev.isApproved ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'} transition`}
                    >
                      {rev.isApproved ? 'Revoke' : 'Approve & Publish'}
                    </button>
                    <button
                      onClick={async () => { if(window.confirm('Delete this feedback permanently?')) { await axios.delete('/api/admin/reviews/' + rev._id); fetchDashboardData(); show('Feedback deleted'); } }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No customer feedback submitted yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* SHIPPING & DELIVERY TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brand-500" /> Shipping & Free Delivery Manager
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Control storewide free shipping promotions, minimum order thresholds, standard shipping rates, and product delivery charges.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveShipping()}
                    disabled={savingShipping}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {savingShipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Shipping Settings
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="mt-5">
                {shippingForm.allProductsFreeShipping ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                          Storewide 100% Free Shipping Active
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full text-[10px] font-bold">
                          All Orders Free
                        </span>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Free shipping is applied to all products and orders nationwide with ₹0 shipping fee, regardless of cart value.
                      </p>
                    </div>
                  </div>
                ) : shippingForm.enabled ? (
                  <div className="p-4 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs uppercase tracking-wider text-brand-700 dark:text-brand-300">
                          Threshold-Based Free Shipping Active
                        </span>
                        <span className="px-2 py-0.5 bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 rounded-full text-[10px] font-bold">
                          Free Above ₹{shippingForm.freeShippingThreshold.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">
                        Orders of ₹{shippingForm.freeShippingThreshold.toLocaleString('en-IN')} or more unlock Free Express Delivery. Orders below this threshold are charged a flat ₹{shippingForm.defaultShippingFee} delivery fee.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        Free Shipping Rules Disabled
                      </span>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Threshold free shipping is turned off. All orders are charged standard ₹{shippingForm.defaultShippingFee} shipping fee.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Controls Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: All Products Free Shipping Control */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        🎁
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">All Products Free Shipping</h4>
                        <p className="text-[11px] text-slate-400">Master toggle for sitewide free delivery</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={handleToggleAllFreeShipping}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        shippingForm.allProductsFreeShipping ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          shippingForm.allProductsFreeShipping ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                    <p>
                      Turn this <strong className="text-slate-800 dark:text-slate-200">ON</strong> to make shipping 100% free for every customer, regardless of their order total.
                    </p>
                    <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-500">
                      <li>Overrides order thresholds and sets delivery cost to ₹0.</li>
                      <li>Cart drawer dynamically shows &ldquo;Free Express Delivery active on all items&rdquo;.</li>
                      <li>Checkout shows ₹0 / FREE shipping fee automatically.</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Current Status:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    shippingForm.allProductsFreeShipping
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {shippingForm.allProductsFreeShipping ? 'ENABLED (All Free)' : 'DISABLED (Using Thresholds)'}
                  </span>
                </div>
              </div>

              {/* Card 2: Amount Control System */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                    ⚙️
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Amount Control System</h4>
                    <p className="text-[11px] text-slate-400">Configure thresholds and standard rates</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Threshold Control */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Free Shipping Order Threshold (₹)
                      </label>
                      <span className="text-[11px] text-brand-600 font-bold">
                        ₹{shippingForm.freeShippingThreshold.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={shippingForm.freeShippingThreshold}
                      onChange={e => setShippingForm({ ...shippingForm, freeShippingThreshold: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-bold"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 self-center mr-1">Presets:</span>
                      {[499, 999, 1499, 1999, 2000, 2499, 2999, 4999].map(amount => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setShippingForm({ ...shippingForm, freeShippingThreshold: amount })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                            shippingForm.freeShippingThreshold === amount
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                          }`}
                        >
                          ₹{amount.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Standard Shipping Fee Control */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Standard Shipping Fee (₹)
                      </label>
                      <span className="text-[11px] text-brand-600 font-bold">
                        ₹{shippingForm.defaultShippingFee}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={shippingForm.defaultShippingFee}
                      onChange={e => setShippingForm({ ...shippingForm, defaultShippingFee: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-bold"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 self-center mr-1">Presets:</span>
                      {[0, 49, 79, 99, 149, 199].map(fee => (
                        <button
                          key={fee}
                          type="button"
                          onClick={() => setShippingForm({ ...shippingForm, defaultShippingFee: fee })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                            shippingForm.defaultShippingFee === fee
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                          }`}
                        >
                          {fee === 0 ? '₹0 (Free)' : `₹${fee}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Free Shipping System Active Toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shippingForm.enabled}
                        onChange={e => setShippingForm({ ...shippingForm, enabled: e.target.checked })}
                        className="w-4 h-4 text-brand-600 rounded accent-brand-600"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Enable Free Shipping Rule (Threshold promotion)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Customer Preview Simulator & Catalog Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Simulator Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    🛍️
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Customer Checkout Simulator</h4>
                    <p className="text-[11px] text-slate-400">See how rules calculate live in customer's cart</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Simulate Cart Subtotal:</label>
                      <span className="font-extrabold text-sm text-brand-600">₹{simulatedCartAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={5000}
                      step={50}
                      value={simulatedCartAmount}
                      onChange={e => setSimulatedCartAmount(Number(e.target.value))}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>₹100</span>
                      <span>₹2,500</span>
                      <span>₹5,000</span>
                    </div>
                  </div>

                  {/* Simulator Calculations */}
                  {(() => {
                    const isAllFree = shippingForm.allProductsFreeShipping;
                    const qualifies = isAllFree || (shippingForm.enabled && simulatedCartAmount >= shippingForm.freeShippingThreshold);
                    const simShipping = qualifies ? 0 : shippingForm.defaultShippingFee;
                    const simTotal = simulatedCartAmount + simShipping;
                    const progress = isAllFree ? 100 : Math.min((simulatedCartAmount / (shippingForm.freeShippingThreshold || 1)) * 100, 100);
                    const remaining = Math.max(0, shippingForm.freeShippingThreshold - simulatedCartAmount);

                    return (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Cart Subtotal</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">₹{simulatedCartAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Calculated Shipping</span>
                          <span>
                            {simShipping === 0 ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-extrabold rounded-md">
                                FREE
                              </span>
                            ) : (
                              <span className="font-bold text-slate-800 dark:text-slate-200">₹{simShipping}</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span>Order Total</span>
                          <span className="text-brand-600">₹{simTotal.toLocaleString('en-IN')}</span>
                        </div>

                        {/* Customer Cart Progress Bar Preview */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                          <p className="text-[11px] font-semibold text-slate-500">Cart Drawer Bar Preview:</p>
                          {isAllFree ? (
                            <p className="text-xs text-emerald-600 font-bold">🎉 Free Express Delivery active on all items!</p>
                          ) : qualifies ? (
                            <p className="text-xs text-emerald-600 font-bold">🎉 You've unlocked FREE shipping!</p>
                          ) : (
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Add <span className="font-bold text-brand-600">₹{remaining.toLocaleString('en-IN')}</span> more for free shipping
                            </p>
                          )}
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Bulk Product Delivery Charges Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      📦
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Product Catalog Delivery Charges</h4>
                      <p className="text-[11px] text-slate-400">Bulk apply delivery charge to products in MongoDB</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                    <p>
                      Products can optionally have their own item-specific delivery charge stored in the database.
                    </p>
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Products</span>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">{products.length}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Free Delivery Items</span>
                        <span className="text-base font-extrabold text-emerald-600">
                          {products.filter(p => !p.deliveryCharge || p.deliveryCharge === 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleSetAllProductsFreeDelivery}
                    disabled={updatingBulkDelivery}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updatingBulkDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Set All Catalog Products to ₹0 Delivery Charge
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkDeliveryChargeModal(true)}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Custom Delivery Charges by Category...
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* CMS TAB */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'cms' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2"><Settings className="w-4 h-4 text-brand-500" /> Website Content Manager</h3>
              <p className="text-xs text-slate-500 mt-1">Edit your site's hero, announcements, promo banners, and business info without touching any code.</p>
            </div>

            <form onSubmit={handleSaveCMS} className="space-y-5 text-xs">
              {/* Announcement */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-brand-600 dark:text-brand-400 text-sm">📢 Announcement Bar</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newText = shippingForm.allProductsFreeShipping
                          ? 'Free Express Delivery on ALL Orders across India!'
                          : `Free Express Delivery on Orders Over ₹${shippingForm.freeShippingThreshold.toLocaleString('en-IN')} across India!`;
                        setCmsForm({ ...cmsForm, announcementText: newText });
                        show('Announcement bar synced with shipping policy!');
                      }}
                      className="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> Sync with Shipping Policy
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('shipping')}
                      className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                    >
                      Shipping Settings →
                    </button>
                  </div>
                </div>
                <input type="text" required value={cmsForm.announcementText} onChange={e => setCmsForm({ ...cmsForm, announcementText: e.target.value })} placeholder="Announcement text..." className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
              </div>

              {/* Hero Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-brand-600 dark:text-brand-400 text-sm">🖼️ Hero Banner</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Title', key: 'heroTitle', placeholder: 'Hero heading...' },
                    { label: 'CTA Button Text', key: 'heroCtaText', placeholder: 'Shop Now' },
                    { label: 'Image URL', key: 'heroImage', placeholder: 'https://...' },
                    { label: 'CTA Button Link', key: 'heroCtaLink', placeholder: '/shop' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                      <input type="text" value={(cmsForm as any)[key]} onChange={e => setCmsForm({ ...cmsForm, [key]: e.target.value })} placeholder={placeholder} className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Subtitle</label>
                  <textarea rows={2} value={cmsForm.heroSubtitle} onChange={e => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })} className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                </div>
              </div>

              {/* Business Info */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-brand-600 dark:text-brand-400 text-sm">🏢 Business Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Phone / WhatsApp', key: 'businessPhone' },
                    { label: 'Email', key: 'businessEmail' },
                    { label: 'GSTIN', key: 'businessGstin' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                      <input type="text" value={(cmsForm as any)[key]} onChange={e => setCmsForm({ ...cmsForm, [key]: e.target.value })} className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Address</label>
                  <input type="text" value={cmsForm.businessAddress} onChange={e => setCmsForm({ ...cmsForm, businessAddress: e.target.value })} className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Footer Description</label>
                  <textarea rows={2} value={cmsForm.footerText} onChange={e => setCmsForm({ ...cmsForm, footerText: e.target.value })} className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30" />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition">
                <Save className="w-4 h-4" /> Save All Website Content
              </button>
            </form>

            {/* ── Product Categories & Visual Assets Manager ── */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-brand-500" /> Product Categories & Visual Cards ({categories.length})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live database categories synced with the homepage and shop navigation. Update category names and image URLs with live MongoDB sync.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => {
                  const draft = categoryDrafts[cat._id] || { name: cat.name, image: cat.image, description: cat.description || '' };
                  const isSaving = savingCategoryId === cat._id;
                  return (
                    <div
                      key={cat._id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3"
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border border-slate-300 dark:border-slate-600 relative">
                          <img
                            src={draft.image || cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Category Name</label>
                            <input
                              type="text"
                              value={draft.name}
                              onChange={(e) =>
                                setCategoryDrafts((prev) => ({
                                  ...prev,
                                  [cat._id]: { ...draft, name: e.target.value },
                                }))
                              }
                              className="w-full text-xs font-semibold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Image URL</label>
                            <input
                              type="text"
                              value={draft.image}
                              onChange={(e) =>
                                setCategoryDrafts((prev) => ({
                                  ...prev,
                                  [cat._id]: { ...draft, image: e.target.value },
                                }))
                              }
                              placeholder="https://images.unsplash.com/..."
                              className="w-full text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-mono text-slate-400">slug: /{cat.slug}</span>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleUpdateCategory(cat._id)}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Update Category
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ORDER DETAIL MODAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-lg border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-slate-400">{selectedOrder.shippingAddress?.fullName} · {selectedOrder.shippingAddress?.phone}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <div className="space-y-2">
              {selectedOrder.orderItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                      <p className="text-slate-400">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">₹{(item.price * item.quantity)?.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Shipping:</span>
                <span className="font-semibold">{selectedOrder.shippingAddress?.addressLine}, {selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.pincode}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Total</span>
                <span className="font-extrabold text-base text-brand-600">₹{selectedOrder.totalPrice?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => handleDownloadInvoice(selectedOrder._id, selectedOrder.orderNumber)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition"
            >
              <FileText className="w-4 h-4" /> Download Invoice
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PRODUCT ADD/EDIT MODAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full sm:max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in all required fields marked with *</p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Product Name *', key: 'name', required: true, placeholder: 'e.g. CP Plus 5MP CCTV Camera' },
                  { label: 'Brand *', key: 'brand', required: true, placeholder: 'e.g. CP Plus' },
                  { label: 'SKU (leave blank to auto-generate)', key: 'SKU', required: false, placeholder: 'QS-XXXXX' },
                  { label: 'Custom Slug (leave blank to auto)', key: 'slug', required: false, placeholder: 'auto-generated' },
                ].map(({ label, key, required, placeholder }) => (
                  <div key={key}>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                    <input type="text" required={required} value={(productForm as any)[key]} onChange={e => setProductForm({ ...productForm, [key]: e.target.value })} placeholder={placeholder} className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
                  </div>
                ))}
              </div>

              {/* Category */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                <select required value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'MRP (₹) *', key: 'mrp' },
                  { label: 'Selling Price (₹) *', key: 'sellingPrice' },
                  { label: 'Discount (%)', key: 'discount' },
                  { label: 'GST (%)', key: 'gst' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                    <input type="number" value={(productForm as any)[key]} onChange={e => setProductForm({ ...productForm, [key]: Number(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
                  </div>
                ))}
              </div>

              {/* Stock */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Stock Qty *', key: 'stock' },
                  { label: 'Low Stock Alert Threshold', key: 'lowStockThreshold' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                    <input type="number" required value={(productForm as any)[key]} onChange={e => setProductForm({ ...productForm, [key]: Number(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Cash on Delivery', key: 'isCODEnabled' },
                  { label: 'Product is Returnable', key: 'isReturnable' },
                  { label: 'Featured Product', key: 'featured' },
                  { label: 'Best Seller', key: 'bestSeller' },
                ].map(({ label, key }) => (
                  <label key={key} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brand-400 transition">
                    <input type="checkbox" checked={(productForm as any)[key]} onChange={e => setProductForm({ ...productForm, [key]: e.target.checked })} className="w-4 h-4 text-brand-600 rounded accent-brand-600" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 leading-tight">{label}</span>
                  </label>
                ))}
              </div>

              {/* Descriptions */}
              {[
                { label: 'Short Description', key: 'shortDescription', rows: 2 },
                { label: 'Full Description', key: 'description', rows: 3 },
              ].map(({ label, key, rows }) => (
                <div key={key}>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                  <textarea rows={rows} value={(productForm as any)[key]} onChange={e => setProductForm({ ...productForm, [key]: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
                </div>
              ))}

              {/* Warranty / Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Warranty', key: 'warranty' },
                  { label: 'Return Policy', key: 'returnPolicy' },
                  { label: 'Installation Details', key: 'installationDetails' },
                  { label: 'Shipping Information', key: 'shippingInformation' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                    <input type="text" value={(productForm as any)[key]} onChange={e => setProductForm({ ...productForm, [key]: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
                  </div>
                ))}
              </div>

              {/* Product Delivery Charge Control */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-brand-500" /> Item Delivery Charge (₹)
                  </label>
                  <span className="text-[10px] text-slate-400">Set 0 for Free Delivery on this product</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={productForm.deliveryCharge}
                    onChange={e => setProductForm({ ...productForm, deliveryCharge: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-xs"
                    placeholder="0 for Free Delivery"
                  />
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, deliveryCharge: 0 })}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                      productForm.deliveryCharge === 0
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    Set Free (₹0)
                  </button>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Features (one per line)</label>
                <textarea rows={4} value={productForm.featuresText} onChange={e => setProductForm({ ...productForm, featuresText: e.target.value })} placeholder="Full Color Night Vision&#10;Weatherproof Body&#10;Built-in Audio Mic" className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
              </div>

              {/* Specifications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Specifications</label>
                  <button type="button" onClick={() => setProductForm(prev => ({ ...prev, specifications: [...prev.specifications, { key: '', value: '' }] }))} className="text-brand-600 text-xs font-bold flex items-center gap-1 hover:underline">
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>
                <div className="space-y-2">
                  {productForm.specifications.map((spec, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="text" value={spec.key} onChange={e => { const s = [...productForm.specifications]; s[i] = { ...s[i], key: e.target.value }; setProductForm({ ...productForm, specifications: s }); }} placeholder="e.g. Resolution" className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
                      <input type="text" value={spec.value} onChange={e => { const s = [...productForm.specifications]; s[i] = { ...s[i], value: e.target.value }; setProductForm({ ...productForm, specifications: s }); }} placeholder="e.g. 5MP" className="flex-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
                      <button type="button" onClick={() => setProductForm(prev => ({ ...prev, specifications: prev.specifications.filter((_, j) => j !== i) }))} className="p-1.5 text-red-400 hover:text-red-600 transition flex-shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Image Gallery & Upload */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-brand-500" /> Product Images ({productForm.images.length})
                  </label>
                  <button type="button" onClick={() => setShowImageUrlInput(!showImageUrlInput)} className="text-brand-600 text-xs hover:underline">
                    {showImageUrlInput ? 'Hide URL Input' : '+ Add Image via URL'}
                  </button>
                </div>

                {/* Thumbnail list */}
                {productForm.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-1">
                    {productForm.images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 aspect-square">
                        <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-brand-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                            COVER
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = [...productForm.images];
                                const [target] = newImages.splice(idx, 1);
                                newImages.unshift(target);
                                setProductForm(prev => ({ ...prev, images: newImages }));
                              }}
                              className="px-2 py-0.5 bg-brand-600 text-white rounded text-[10px] font-bold"
                            >
                              Set Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setProductForm(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx),
                              }));
                            }}
                            className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-50 dark:bg-brand-900/30 border-2 border-dashed border-brand-300 dark:border-brand-700 rounded-xl cursor-pointer hover:border-brand-500 transition">
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> : <Upload className="w-4 h-4 text-brand-600" />}
                    <div className="text-center">
                      <span className="text-brand-600 font-semibold block text-xs sm:text-sm">
                        {uploadingImage ? 'Optimizing & Uploading...' : 'Click to Upload 1 or Multiple Images'}
                      </span>
                      <span className="text-[10px] text-slate-400">Auto-compressed to WebP (60-100KB each) with category naming</span>
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} disabled={uploadingImage} />
                  </label>

                  {showImageUrlInput && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                      <input
                        type="url"
                        placeholder="Paste image URL here and click Add..."
                        id="new-img-url-input"
                        className="flex-1 bg-white dark:bg-slate-900 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('new-img-url-input') as HTMLInputElement;
                          if (el && el.value.trim()) {
                            setProductForm(prev => ({ ...prev, images: [...prev.images, el.value.trim()] }));
                            el.value = '';
                          }
                        }}
                        className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-xl"
                      >
                        Add URL
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* HSN */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">HSN Code</label>
                <input type="text" value={productForm.hsn} onChange={e => setProductForm({ ...productForm, hsn: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                  Cancel
                </button>
                <button type="submit" disabled={savingProduct} className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition">
                  {savingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingProduct ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BULK SHIPPING MODAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Bulk Update Dispatch Time</h3>
              <button onClick={() => setShowShippingModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <form onSubmit={handleBulkShipping} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">Select or type dispatch time</label>
                <select value={shippingText} onChange={e => setShippingText(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mb-2">
                  {SHIPPING_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="text" value={shippingText} onChange={e => setShippingText(e.target.value)} placeholder="Or type custom dispatch time..." className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowShippingModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition">Apply to All Products</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BULK WARRANTY MODAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showWarrantyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Bulk Update Warranty</h3>
              <button onClick={() => setShowWarrantyModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <form onSubmit={handleBulkWarranty} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">Enter new warranty text for all products</label>
                <input required type="text" value={warrantyText} onChange={e => setWarrantyText(e.target.value)} placeholder="e.g. 1 Year Manufacturer Warranty" className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowWarrantyModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition">Apply to All Products</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BULK COD MODAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showCodModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Bulk Update COD</h3>
              <button onClick={() => setShowCodModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <form onSubmit={handleBulkCod} className="space-y-4 text-xs">
              <div>
                <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brand-400 transition">
                  <input type="checkbox" checked={codEnabled} onChange={e => setCodEnabled(e.target.checked)} className="w-5 h-5 text-brand-600 rounded accent-brand-600" />
                  <div>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 block">Enable Cash on Delivery</span>
                    <span className="text-slate-500">Apply this setting to all products in your catalog.</span>
                  </div>
                </label>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCodModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition">Apply to All Products</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BULK DELIVERY CHARGE MODAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showBulkDeliveryChargeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-500" /> Bulk Update Delivery Charges
                </h3>
                <p className="text-[11px] text-slate-400">Set delivery charge across multiple catalog items</p>
              </div>
              <button onClick={() => setShowBulkDeliveryChargeModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <form onSubmit={handleBulkDeliveryCharge} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Category (Optional)</label>
                <select
                  value={bulkDeliveryCategory}
                  onChange={e => setBulkDeliveryCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="">All Categories ({products.length} Products)</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} ({products.filter(p => (typeof p.category === 'object' ? p.category?._id : p.category) === cat._id).length} products)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Delivery Charge (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  required
                  value={bulkDeliveryCharge}
                  onChange={e => setBulkDeliveryCharge(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0 for Free Shipping"
                  className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800 dark:text-slate-200 font-bold"
                />
                <div className="flex gap-2 mt-2">
                  {[0, 49, 79, 99, 149].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBulkDeliveryCharge(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                        bulkDeliveryCharge === amt
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {amt === 0 ? '₹0 (Free)' : `₹${amt}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDeliveryChargeModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingBulkDelivery}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {updatingBulkDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Apply Charges
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════════ */}
      {/* CUSTOMER DETAILS MODAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-500" /> {selectedCustomer.name}
                </h3>
                <p className="text-xs text-slate-400">{selectedCustomer.email}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Phone</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{selectedCustomer.phone || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Orders</p>
                <p className="text-sm font-extrabold text-brand-600 mt-1">{selectedCustomer.orderCount || 0}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Lifetime Spend</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-1">₹{(selectedCustomer.totalSpend || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Saved Delivery Addresses */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-500" /> Saved Addresses ({selectedCustomer.addresses?.length || 0})
              </h4>
              {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((addr: any, idx: number) => (
                    <div
                      key={addr._id || idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {addr.fullName}
                          {addr.isDefault && (
                            <span className="px-1.5 py-0.2 bg-brand-100 text-brand-700 text-[9px] font-bold rounded">
                              DEFAULT
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-500 font-semibold">{addr.phone}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {addr.city}, {addr.state} - <span className="font-mono font-bold">{addr.pincode}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-center text-xs text-slate-400">
                  No saved addresses found for this customer.
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Close Customer Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* CREATE / EDIT COUPON MODAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-brand-500" />
                  {editingCouponId ? 'Edit Promotional Coupon' : 'Create New Promotional Coupon'}
                </h3>
                <p className="text-xs text-slate-400">Configure discount value, minimum order value, and limits.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponForm.code}
                    onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SUMMER500"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 focus:ring-2 focus:ring-brand-500/30 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={couponForm.discountType}
                    onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30 font-semibold"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="flat">Flat Cash Discount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {couponForm.discountType === 'percentage' ? 'Discount (%) *' : 'Flat Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={couponForm.minOrderValue}
                    onChange={e => setCouponForm({ ...couponForm, minOrderValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                {couponForm.discountType === 'percentage' ? (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Max Discount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={couponForm.maxDiscountAmount || ''}
                      onChange={e => setCouponForm({ ...couponForm, maxDiscountAmount: Number(e.target.value) })}
                      placeholder="e.g. 500"
                      className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={couponForm.expiryDate}
                    onChange={e => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Uses Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={couponForm.usageLimit || ''}
                    onChange={e => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })}
                    placeholder="e.g. 100"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Uses Per Customer
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={couponForm.usageLimitPerUser}
                    onChange={e => setCouponForm({ ...couponForm, usageLimitPerUser: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={couponForm.isActive}
                  onChange={e => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded accent-brand-600"
                />
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                    Coupon is Active & Redeemable
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Customers will be able to apply this code during checkout immediately.
                  </span>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                >
                  {savingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingCouponId ? 'Save Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PROFESSIONAL E-COMMERCE TAX INVOICE MODAL */}
      {/* ══════════════════════════════════════════════════════════ */}
      {invoiceModalOrder && (
        <InvoiceModal order={invoiceModalOrder} onClose={() => setInvoiceModalOrder(null)} />
      )}
    </div>
  );
};





