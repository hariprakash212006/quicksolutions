import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import Order from '../models/Order';
import Product from '../models/Product';
import Category from '../models/Category';
import User from '../models/User';
import Coupon from '../models/Coupon';
import CMSConfig from '../models/CMSConfig';
import { escapeRegex } from '../utils/security';

// Dashboard Analytics
export const getAdminDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalSalesAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalSales = totalSalesAgg[0]?.total || 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySalesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday }, orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const todaySales = todaySalesAgg[0]?.total || 0;

    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['Pending', 'Processing', 'Packed'] } });
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments({ status: 'published' });

    const lowStockProducts = await Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).select(
      'name SKU stock lowStockThreshold images'
    );

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email');

    res.json({
      success: true,
      stats: {
        totalSales,
        todaySales,
        totalOrders,
        pendingOrders,
        totalCustomers,
        totalProducts,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts,
      recentOrders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Product CRUD
export const adminCreateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Mock Fallback when MongoDB is offline
      const categoryId = req.body.category || '66c000000000000000000001';
      const mockProduct = {
        _id: 'mock_prod_' + Date.now(),
        ...req.body,
        category: categoryId,
        averageRating: 4.8,
        numOfReviews: 0,
        status: 'published',
        createdAt: new Date(),
      };
      res.status(201).json({ success: true, product: mockProduct });
      return;
    }

    // Auto-assign category if missing or empty string
    if (!req.body.category) {
      const defaultCategory = await Category.findOne();
      if (defaultCategory) req.body.category = defaultCategory._id;
    }

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const adminUpdateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, product: { _id: req.params.id, ...req.body } });
      return;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const adminDeleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'Product deleted successfully' });
      return;
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Order Management
export const adminGetAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const query: any = {};

    if (status) query.orderStatus = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search as string, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search as string, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search as string, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).populate('user', 'name email phone');
    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminUpdateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderStatus, trackingNumber, courierPartner } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierPartner) order.courierPartner = courierPartner;

    if (orderStatus === 'Delivered') order.deliveredAt = new Date();
    if (orderStatus === 'Cancelled') {
      order.cancelledAt = new Date();
      // Restore stock on cancellation
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    await order.save();
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Categories
export const adminGetCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminCreateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const adminUpdateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    res.json({ success: true, category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const adminDeleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Coupons
export const adminCreateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const adminGetCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin CMS Config
let inMemoryCMS = {
  heroBanners: [
    {
      title: 'Next-Gen CCTV & Smart Security Systems',
      subtitle: 'Protect your home and commercial property with 5MP Full-Color Night Vision & AI Detection Cameras.',
      image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&auto=format&fit=crop&q=80',
      ctaText: 'Explore CCTV Cameras',
      ctaLink: '/shop?category=cctv-security',
    },
  ],
  promoBanner: {
    badge: 'FLASH SALE • LIMITED TIME',
    title: 'Mega Savings on CCTV Security Systems & Alkaline RO Purifiers',
    description: 'Get complete security cabling, DVR setup & 14-stage RO installation at your doorstep with certified technicians.',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1000&auto=format&fit=crop&q=80',
    ctaText: 'Shop Promotional Deals',
    ctaLink: '/shop',
    couponCode: 'QUICK500',
    discountTag: 'FLAT ₹500 OFF',
    countdownHours: 24,
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    features: ['Free Onsite Inspection', 'Same-Day Dispatch Across India', '2 Years Official Warranty'],
  },
  dealOfTheDay: {
    active: true,
    badge: 'Deal of the Day',
    title: 'CP Plus 4MP Smart Wi-Fi PTZ Camera',
    subtitle: '360° Vision, Color Night Vision, Two-Way Audio. Secure your home instantly with AI motion tracking.',
    productSlug: '',
    originalPrice: 4999,
    dealPrice: 2499,
    discountPercentage: 50,
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600',
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    ctaText: 'Grab the Deal',
    ctaLink: '/shop',
  },
  trustPoints: [
    { icon: 'ShieldCheck', title: '100% Original Guarantee', description: 'Authorized Dealer of Hikvision, CP Plus & Dahua' },
    { icon: 'Wrench', title: 'Professional Installation', description: 'Expert technicians for doorstep setup & wiring' },
    { icon: 'Headphones', title: 'Dedicated Support', description: 'Lifetime technical assistance & warranty support' },
    { icon: 'Truck', title: 'Fast Delivery', description: 'Insured dispatch across India within 24-48 hours' },
  ],
  faqs: [
    { question: 'Do you offer installation services?', answer: 'Yes! Quick Solutions For U provides professional installation services across select pin codes. Select installation during checkout.', category: 'Services' },
    { question: 'What is the warranty period for CP Plus and Hikvision cameras?', answer: 'All CCTV cameras come with 1 to 2 Years official manufacturer warranty with physical repair & replacement support.', category: 'Warranty' },
  ],
  businessInfo: {
    name: 'Quick Solutions For U',
    domain: 'quicksolutionsforu.in',
    phone: '+91 98765 43210',
    email: 'support@quicksolutionsforu.in',
    whatsapp: '+91 98765 43210',
    address: 'Main Commercial Hub, Ring Road, India',
    gstin: '07AAAAA0000A1Z5',
  },
  shippingConfig: {
    allProductsFreeShipping: false,
    freeShippingThreshold: 2000,
    defaultShippingFee: 99,
    enabled: true,
  },
};

export const getCMSConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, cms: inMemoryCMS });
      return;
    }

    let cms = await CMSConfig.findOne();
    if (!cms) {
      cms = await CMSConfig.create(inMemoryCMS);
    }
    res.json({ success: true, cms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCMSConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      inMemoryCMS = { ...inMemoryCMS, ...req.body };
      res.json({ success: true, cms: inMemoryCMS });
      return;
    }

    let cms = await CMSConfig.findOne();
    if (cms) {
      cms = await CMSConfig.findByIdAndUpdate(cms._id, req.body, { new: true });
    } else {
      cms = await CMSConfig.create(req.body);
    }
    res.json({ success: true, cms });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Admin Customers ───────────────────────────────────────────────────────────

export const adminGetCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const query: any = { role: { $in: ['customer', 'user'] } };

    if (search) {
      const cleanSearch = escapeRegex(search as string);
      query.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { email: { $regex: cleanSearch, $options: 'i' } },
        { phone: { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    const customerSummaries = await Promise.all(
      users.map(async (u) => {
        const orderStats = await Order.aggregate([
          { $match: { user: u._id, orderStatus: { $ne: 'Cancelled' } } },
          { $group: { _id: null, totalSpent: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } },
        ]);
        const stats = orderStats[0] || { totalSpent: 0, orderCount: 0 };
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          addresses: u.addresses || [],
          addressesCount: (u.addresses || []).length,
          orderCount: stats.orderCount,
          totalSpent: stats.totalSpent,
          createdAt: u.createdAt,
        };
      })
    );

    res.json({ success: true, count: customerSummaries.length, customers: customerSummaries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin Export Orders to Excel ─────────────────────────────────────────────

export const adminExportOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const query: any = {};
    if (status) query.orderStatus = status;
    if (search) {
      const cleanSearch = escapeRegex(search as string);
      query.$or = [
        { orderNumber: { $regex: cleanSearch, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: cleanSearch, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: cleanSearch, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).populate('user', 'name email phone');

    const orderRows = orders.map((order) => {
      const itemsDesc = (order.orderItems || [])
        .map((item) => `${item.name} (x${item.quantity}) - ₹${item.price}`)
        .join('; ');

      const addr = order.shippingAddress || ({} as any);
      const fullAddr = [addr.addressLine, addr.landmark, addr.city, addr.state, addr.pincode]
        .filter(Boolean)
        .join(', ');

      return {
        'Order Number': order.orderNumber,
        'Date': new Date(order.createdAt).toLocaleDateString('en-IN') + ' ' + new Date(order.createdAt).toLocaleTimeString('en-IN'),
        'Customer Name': addr.fullName || (order.user as any)?.name || 'Guest',
        'Customer Email': (order.user as any)?.email || 'N/A',
        'Customer Phone': addr.phone || (order.user as any)?.phone || 'N/A',
        'Order Status': order.orderStatus,
        'Payment Mode': order.paymentMethod,
        'Payment Status': order.paymentInfo?.status || 'Pending',
        'Items Count': (order.orderItems || []).reduce((sum, item) => sum + item.quantity, 0),
        'Items Breakdown': itemsDesc,
        'Items Subtotal (INR)': order.itemsPrice,
        'GST Tax (INR)': order.taxPrice,
        'Shipping Fee (INR)': order.shippingPrice,
        'Discount (INR)': order.couponDiscount || 0,
        'Grand Total (INR)': order.totalPrice,
        'Delivery Address': fullAddr,
        'City': addr.city || '',
        'State': addr.state || '',
        'Pincode': addr.pincode || '',
        'Courier Partner': order.courierPartner || 'N/A',
        'Tracking Number': order.trackingNumber || 'N/A',
      };
    });

    const totalRevenue = orders.filter((o) => o.orderStatus !== 'Cancelled').reduce((sum, o) => sum + o.totalPrice, 0);
    const deliveredCount = orders.filter((o) => o.orderStatus === 'Delivered').length;
    const cancelledCount = orders.filter((o) => o.orderStatus === 'Cancelled').length;
    const codCount = orders.filter((o) => o.paymentMethod === 'COD').length;
    const onlineCount = orders.filter((o) => o.paymentMethod !== 'COD').length;

    const summaryRows = [
      { Metric: 'Report Generated At', Value: new Date().toLocaleString('en-IN') },
      { Metric: 'Total Orders in Report', Value: orders.length },
      { Metric: 'Total Net Sales Revenue (INR)', Value: totalRevenue },
      { Metric: 'Delivered Orders Count', Value: deliveredCount },
      { Metric: 'Cancelled Orders Count', Value: cancelledCount },
      { Metric: 'Cash on Delivery (COD) Orders', Value: codCount },
      { Metric: 'Prepaid / Online Orders', Value: onlineCount },
      { Metric: 'Average Order Value (INR)', Value: orders.length ? Math.round(totalRevenue / Math.max(1, orders.length - cancelledCount)) : 0 },
    ];

    const wb = XLSX.utils.book_new();

    const wsOrders = XLSX.utils.json_to_sheet(orderRows);
    wsOrders['!cols'] = [
      { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 26 }, { wch: 16 },
      { wch: 16 }, { wch: 14 }, { wch: 15 }, { wch: 12 }, { wch: 45 },
      { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 15 }, { wch: 18 },
      { wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders & Sales');

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 35 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Sales Overview');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `QuickSolutions_Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin Export Customers to Excel ──────────────────────────────────────────

export const adminExportCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ role: { $in: ['customer', 'user'] } }).sort({ createdAt: -1 });

    const rows = await Promise.all(
      users.map(async (u) => {
        const orderStats = await Order.aggregate([
          { $match: { user: u._id, orderStatus: { $ne: 'Cancelled' } } },
          { $group: { _id: null, totalSpent: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } },
        ]);
        const stats = orderStats[0] || { totalSpent: 0, orderCount: 0 };

        const defaultAddr = u.addresses?.find((a) => a.isDefault) || u.addresses?.[0];
        const formattedDefault = defaultAddr
          ? `${defaultAddr.addressLine}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.pincode}`
          : 'None';

        const allAddresses = (u.addresses || [])
          .map((a) => `[${a.label || 'Addr'}] ${a.addressLine}, ${a.city}, ${a.state} - ${a.pincode}`)
          .join(' | ');

        return {
          'Customer ID': u._id.toString(),
          'Full Name': u.name,
          'Email Address': u.email,
          'Phone Number': u.phone || 'N/A',
          'Role': u.role,
          'Total Orders Placed': stats.orderCount,
          'Total Spent (INR)': stats.totalSpent,
          'Saved Addresses Count': (u.addresses || []).length,
          'Primary Address': formattedDefault,
          'Primary City': defaultAddr?.city || 'N/A',
          'Primary State': defaultAddr?.state || 'N/A',
          'Primary Pincode': defaultAddr?.pincode || 'N/A',
          'All Addresses': allAddresses || 'None',
          'Joined Date': new Date(u.createdAt).toLocaleDateString('en-IN'),
        };
      })
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    ws['!cols'] = [
      { wch: 26 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 12 },
      { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 45 }, { wch: 18 },
      { wch: 18 }, { wch: 16 }, { wch: 50 }, { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Customers Directory');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `QuickSolutions_Customers_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
