"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Controllers
const authController_1 = require("../controllers/authController");
const productController_1 = require("../controllers/productController");
const orderController_1 = require("../controllers/orderController");
const couponController_1 = require("../controllers/couponController");
const reviewController_1 = require("../controllers/reviewController");
const addressController_1 = require("../controllers/addressController");
const uploadController_1 = require("../controllers/uploadController");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const subscriberController_1 = require("../controllers/subscriberController");
const validators_1 = require("../utils/validators");
const adminController_1 = require("../controllers/adminController");
const Category_1 = __importDefault(require("../models/Category"));
const router = (0, express_1.Router)();
// ── Rate Limiters (Anti-Brute Force, Anti-DDoS, Anti-Carding) ─────────────────
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10,
    message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5,
    message: { success: false, message: 'Too many password reset requests. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const orderLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 min
    max: 5,
    message: { success: false, message: 'Too many order requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const paymentLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 min
    max: 10,
    message: { success: false, message: 'Too many payment requests. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const couponLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 min
    max: 10,
    message: { success: false, message: 'Too many coupon checks. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const subscribeLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5,
    message: { success: false, message: 'Too many subscription attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const adminUploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 min
    max: 30,
    message: { success: false, message: 'Upload rate limit reached. Please wait before uploading more images.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// ── Auth Routes ───────────────────────────────────────────────────────────────
router.post('/auth/register', authLimiter, (0, validators_1.validate)(validators_1.registerSchema), authController_1.registerUser);
router.post('/auth/login', authLimiter, (0, validators_1.validate)(validators_1.loginSchema), authController_1.loginUser);
router.post('/auth/google', authLimiter, authController_1.googleLogin);
router.get('/auth/me', auth_1.protect, authController_1.getMe);
router.put('/auth/profile', auth_1.protect, authController_1.updateProfile);
router.post('/auth/forgot-password', passwordResetLimiter, authController_1.forgotPassword);
router.post('/auth/reset-password/:token', passwordResetLimiter, authController_1.resetPassword);
router.post('/subscribe', subscribeLimiter, subscriberController_1.subscribeEmail);
// ── Wishlist ──────────────────────────────────────────────────────────────────
router.get('/auth/wishlist', auth_1.protect, authController_1.getWishlist);
router.post('/auth/wishlist/:productId', auth_1.protect, authController_1.toggleWishlist);
router.delete('/auth/wishlist/:productId', auth_1.protect, authController_1.toggleWishlist);
// ── Address Book ──────────────────────────────────────────────────────────────
router.get('/addresses', auth_1.protect, addressController_1.getAddresses);
router.post('/addresses', auth_1.protect, addressController_1.addAddress);
router.put('/addresses/:addressId', auth_1.protect, addressController_1.updateAddress);
router.delete('/addresses/:addressId', auth_1.protect, addressController_1.deleteAddress);
router.put('/addresses/:addressId/default', auth_1.protect, addressController_1.setDefaultAddress);
// ── Product Storefront Routes ─────────────────────────────────────────────────
router.get('/products', productController_1.getProducts);
router.get('/products/search', productController_1.searchSuggestions);
router.get('/products/id/:id', productController_1.getProductById);
router.get('/products/:slug', productController_1.getProductBySlug);
// ── Reviews ───────────────────────────────────────────────────────────────────
router.get('/reviews', reviewController_1.getApprovedReviews);
router.post('/reviews', auth_1.protect, reviewController_1.createReview);
// ── Categories ────────────────────────────────────────────────────────────────
router.get('/categories', async (_req, res) => {
    try {
        const categories = await Category_1.default.find({ status: 'active' });
        res.json({ success: true, categories });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ── Coupons ───────────────────────────────────────────────────────────────────
router.post('/coupons/validate', auth_1.protect, couponLimiter, couponController_1.validateCoupon);
// ── Orders ────────────────────────────────────────────────────────────────────
router.post('/orders', auth_1.protect, orderLimiter, (0, validators_1.validate)(validators_1.createOrderSchema), orderController_1.createOrder);
router.get('/orders/my-orders', auth_1.protect, orderController_1.getMyOrders);
router.get('/orders/:id', auth_1.protect, orderController_1.getOrderById);
router.post('/orders/:id/cancel', auth_1.protect, orderController_1.requestCancellation);
router.get('/orders/:id/invoice', auth_1.protect, orderController_1.downloadInvoice);
// ── Payments (Razorpay Integration) ───────────────────────────────────────────
router.post('/payments/razorpay/create', auth_1.protect, paymentLimiter, paymentController_1.createRazorpayOrder);
router.post('/payments/razorpay/verify', auth_1.protect, paymentLimiter, paymentController_1.verifyRazorpayPayment);
// ── CMS Public ────────────────────────────────────────────────────────────────
router.get('/cms', adminController_1.getCMSConfig);
// ─────────────────────────────────────────────────────────────────────────────
// ADMIN & STAFF ROUTES
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard (admin only)
router.get('/admin/dashboard', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminController_1.getAdminDashboardStats);
// Products (admin only)
router.post('/admin/products', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), productController_1.createProduct);
router.put('/admin/products/:id', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), productController_1.updateProduct);
router.put('/admin/products/:id/images', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), productController_1.updateProductImages);
router.delete('/admin/products/:id', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), productController_1.deleteProduct);
router.put('/admin/products/:id/restore', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), productController_1.restoreProduct);
router.put('/admin/products/bulk/warranty', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), productController_1.bulkUpdateWarranty);
router.put('/admin/products/bulk/shipping', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), productController_1.bulkUpdateShipping);
router.put('/admin/products/bulk/cod', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), productController_1.bulkUpdateCOD);
router.put('/admin/products/bulk/delivery-charge', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), productController_1.bulkUpdateDeliveryCharge);
// Image uploads (admin only)
router.post('/admin/upload', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminUploadLimiter, uploadController_1.upload.array('images', 10), uploadController_1.uploadProductImages);
router.delete('/admin/upload/:filename', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), uploadController_1.deleteProductImage);
// Orders (admin and staff)
router.get('/admin/orders', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin', 'staff'), orderController_1.getAllOrders);
router.put('/admin/orders/:id/status', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin', 'staff'), orderController_1.updateOrderStatus);
router.get('/admin/export/orders', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminController_1.adminExportOrders);
router.get('/admin/customers', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminController_1.adminGetCustomers);
router.get('/admin/export/customers', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminController_1.adminExportCustomers);
// Coupons (admin only)
router.get('/admin/coupons', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), couponController_1.listCoupons);
router.post('/admin/coupons', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), couponController_1.createCoupon);
router.put('/admin/coupons/:id', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), couponController_1.updateCoupon);
router.put('/admin/coupons/:id/deactivate', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), couponController_1.deactivateCoupon);
router.delete('/admin/coupons/:id', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), couponController_1.deleteCoupon);
// Categories (admin only)
router.get('/admin/categories', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminController_1.adminGetCategories);
router.post('/admin/categories', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminController_1.adminCreateCategory);
router.put('/admin/categories/:id', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminController_1.adminUpdateCategory);
router.delete('/admin/categories/:id', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminController_1.adminDeleteCategory);
// CMS (admin only)
router.put('/admin/cms', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), adminController_1.updateCMSConfig);
// Reviews Moderation (admin and staff)
router.put('/admin/reviews/:id/approve', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), reviewController_1.approveReview);
router.get('/admin/reviews', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), reviewController_1.getAllReviewsAdmin);
router.delete('/admin/reviews/:id', auth_1.protect, (0, roleMiddleware_1.requireRole)('admin'), reviewController_1.deleteReview);
exports.default = router;
