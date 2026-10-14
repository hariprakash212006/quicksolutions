"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminExportCustomers = exports.adminExportOrders = exports.adminGetCustomers = exports.updateCMSConfig = exports.getCMSConfig = exports.adminGetCoupons = exports.adminCreateCoupon = exports.adminDeleteCategory = exports.adminUpdateCategory = exports.adminCreateCategory = exports.adminGetCategories = exports.adminUpdateOrderStatus = exports.adminGetAllOrders = exports.adminDeleteProduct = exports.adminUpdateProduct = exports.adminCreateProduct = exports.getAdminDashboardStats = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const XLSX = __importStar(require("xlsx"));
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const Category_1 = __importDefault(require("../models/Category"));
const User_1 = __importDefault(require("../models/User"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const CMSConfig_1 = __importDefault(require("../models/CMSConfig"));
const security_1 = require("../utils/security");
// Dashboard Analytics
const getAdminDashboardStats = async (req, res) => {
    try {
        const totalSalesAgg = await Order_1.default.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);
        const totalSales = totalSalesAgg[0]?.total || 0;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todaySalesAgg = await Order_1.default.aggregate([
            { $match: { createdAt: { $gte: startOfToday }, orderStatus: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);
        const todaySales = todaySalesAgg[0]?.total || 0;
        const totalOrders = await Order_1.default.countDocuments();
        const pendingOrders = await Order_1.default.countDocuments({ orderStatus: { $in: ['Pending', 'Processing', 'Packed'] } });
        const totalCustomers = await User_1.default.countDocuments({ role: 'user' });
        const totalProducts = await Product_1.default.countDocuments({ status: 'published' });
        const lowStockProducts = await Product_1.default.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).select('name SKU stock lowStockThreshold images');
        const recentOrders = await Order_1.default.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email');
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAdminDashboardStats = getAdminDashboardStats;
// Admin Product CRUD
const adminCreateProduct = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
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
            const defaultCategory = await Category_1.default.findOne();
            if (defaultCategory)
                req.body.category = defaultCategory._id;
        }
        const product = await Product_1.default.create(req.body);
        res.status(201).json({ success: true, product });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.adminCreateProduct = adminCreateProduct;
const adminUpdateProduct = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            res.json({ success: true, product: { _id: req.params.id, ...req.body } });
            return;
        }
        const product = await Product_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        res.json({ success: true, product });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.adminUpdateProduct = adminUpdateProduct;
const adminDeleteProduct = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            res.json({ success: true, message: 'Product deleted successfully' });
            return;
        }
        const product = await Product_1.default.findByIdAndDelete(req.params.id);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminDeleteProduct = adminDeleteProduct;
// Admin Order Management
const adminGetAllOrders = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};
        if (status)
            query.orderStatus = status;
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
                { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
            ];
        }
        const orders = await Order_1.default.find(query).sort({ createdAt: -1 }).populate('user', 'name email phone');
        res.json({ success: true, count: orders.length, orders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminGetAllOrders = adminGetAllOrders;
const adminUpdateOrderStatus = async (req, res) => {
    try {
        const { orderStatus, trackingNumber, courierPartner } = req.body;
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            res.status(404).json({ success: false, message: 'Order not found' });
            return;
        }
        if (orderStatus)
            order.orderStatus = orderStatus;
        if (trackingNumber)
            order.trackingNumber = trackingNumber;
        if (courierPartner)
            order.courierPartner = courierPartner;
        if (orderStatus === 'Delivered')
            order.deliveredAt = new Date();
        if (orderStatus === 'Cancelled') {
            order.cancelledAt = new Date();
            // Restore stock on cancellation
            for (const item of order.orderItems) {
                await Product_1.default.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            }
        }
        await order.save();
        res.json({ success: true, order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminUpdateOrderStatus = adminUpdateOrderStatus;
// Admin Categories
const adminGetCategories = async (req, res) => {
    try {
        const categories = await Category_1.default.find().sort({ name: 1 });
        res.json({ success: true, categories });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminGetCategories = adminGetCategories;
const adminCreateCategory = async (req, res) => {
    try {
        const category = await Category_1.default.create(req.body);
        res.status(201).json({ success: true, category });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.adminCreateCategory = adminCreateCategory;
const adminUpdateCategory = async (req, res) => {
    try {
        const category = await Category_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!category) {
            res.status(404).json({ success: false, message: 'Category not found' });
            return;
        }
        res.json({ success: true, category });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.adminUpdateCategory = adminUpdateCategory;
const adminDeleteCategory = async (req, res) => {
    try {
        await Category_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Category deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminDeleteCategory = adminDeleteCategory;
// Admin Coupons
const adminCreateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon_1.default.create(req.body);
        res.status(201).json({ success: true, coupon });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.adminCreateCoupon = adminCreateCoupon;
const adminGetCoupons = async (req, res) => {
    try {
        const coupons = await Coupon_1.default.find().sort({ createdAt: -1 });
        res.json({ success: true, coupons });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminGetCoupons = adminGetCoupons;
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
const getCMSConfig = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            res.json({ success: true, cms: inMemoryCMS });
            return;
        }
        let cms = await CMSConfig_1.default.findOne();
        if (!cms) {
            cms = await CMSConfig_1.default.create(inMemoryCMS);
        }
        res.json({ success: true, cms });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCMSConfig = getCMSConfig;
const updateCMSConfig = async (req, res) => {
    try {
        if (mongoose_1.default.connection.readyState !== 1) {
            inMemoryCMS = { ...inMemoryCMS, ...req.body };
            res.json({ success: true, cms: inMemoryCMS });
            return;
        }
        let cms = await CMSConfig_1.default.findOne();
        if (cms) {
            cms = await CMSConfig_1.default.findByIdAndUpdate(cms._id, req.body, { new: true });
        }
        else {
            cms = await CMSConfig_1.default.create(req.body);
        }
        res.json({ success: true, cms });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateCMSConfig = updateCMSConfig;
// ── Admin Customers ───────────────────────────────────────────────────────────
const adminGetCustomers = async (req, res) => {
    try {
        const { search } = req.query;
        const query = { role: { $in: ['customer', 'user'] } };
        if (search) {
            const cleanSearch = (0, security_1.escapeRegex)(search);
            query.$or = [
                { name: { $regex: cleanSearch, $options: 'i' } },
                { email: { $regex: cleanSearch, $options: 'i' } },
                { phone: { $regex: cleanSearch, $options: 'i' } },
            ];
        }
        const users = await User_1.default.find(query).sort({ createdAt: -1 });
        const customerSummaries = await Promise.all(users.map(async (u) => {
            const orderStats = await Order_1.default.aggregate([
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
        }));
        res.json({ success: true, count: customerSummaries.length, customers: customerSummaries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminGetCustomers = adminGetCustomers;
// ── Admin Export Orders to Excel ─────────────────────────────────────────────
const adminExportOrders = async (req, res) => {
    try {
        const { status, search } = req.query;
        const query = {};
        if (status)
            query.orderStatus = status;
        if (search) {
            const cleanSearch = (0, security_1.escapeRegex)(search);
            query.$or = [
                { orderNumber: { $regex: cleanSearch, $options: 'i' } },
                { 'shippingAddress.fullName': { $regex: cleanSearch, $options: 'i' } },
                { 'shippingAddress.phone': { $regex: cleanSearch, $options: 'i' } },
            ];
        }
        const orders = await Order_1.default.find(query).sort({ createdAt: -1 }).populate('user', 'name email phone');
        const orderRows = orders.map((order) => {
            const itemsDesc = (order.orderItems || [])
                .map((item) => `${item.name} (x${item.quantity}) - ₹${item.price}`)
                .join('; ');
            const addr = order.shippingAddress || {};
            const fullAddr = [addr.addressLine, addr.landmark, addr.city, addr.state, addr.pincode]
                .filter(Boolean)
                .join(', ');
            return {
                'Order Number': order.orderNumber,
                'Date': new Date(order.createdAt).toLocaleDateString('en-IN') + ' ' + new Date(order.createdAt).toLocaleTimeString('en-IN'),
                'Customer Name': addr.fullName || order.user?.name || 'Guest',
                'Customer Email': order.user?.email || 'N/A',
                'Customer Phone': addr.phone || order.user?.phone || 'N/A',
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminExportOrders = adminExportOrders;
// ── Admin Export Customers to Excel ──────────────────────────────────────────
const adminExportCustomers = async (req, res) => {
    try {
        const users = await User_1.default.find({ role: { $in: ['customer', 'user'] } }).sort({ createdAt: -1 });
        const rows = await Promise.all(users.map(async (u) => {
            const orderStats = await Order_1.default.aggregate([
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
        }));
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminExportCustomers = adminExportCustomers;
