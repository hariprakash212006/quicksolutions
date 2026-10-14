import { Router } from 'express';
import rateLimit from 'express-rate-limit';

// Controllers
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  getWishlist,
  toggleWishlist,
  googleLogin,
} from '../controllers/authController';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  searchSuggestions,
  createProduct,
  updateProduct,
  updateProductImages,
  deleteProduct,
  restoreProduct,
  bulkUpdateWarranty,
  bulkUpdateShipping,
  bulkUpdateCOD,
  bulkUpdateDeliveryCharge,
} from '../controllers/productController';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  requestCancellation,
  downloadInvoice,
} from '../controllers/orderController';
import {
  createCoupon,
  updateCoupon,
  deactivateCoupon,
  deleteCoupon,
  listCoupons,
  validateCoupon,
} from '../controllers/couponController';
import {
  createReview,
  getApprovedReviews,
  getAllReviewsAdmin,
  approveReview,
  deleteReview,
} from '../controllers/reviewController';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addressController';
import {
  upload,
  uploadProductImages,
  deleteProductImage,
} from '../controllers/uploadController';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../controllers/paymentController';
import { protect } from '../middleware/auth';
import { requireRole } from '../middleware/roleMiddleware';
import { subscribeEmail } from '../controllers/subscriberController';
import { validate, registerSchema, loginSchema, createOrderSchema } from '../utils/validators';
import {
  getAdminDashboardStats,
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminGetCustomers,
  adminExportOrders,
  adminExportCustomers,
  getCMSConfig,
  updateCMSConfig,
} from '../controllers/adminController';
import Category from '../models/Category';

const router = Router();

// ── Rate Limiters (Anti-Brute Force, Anti-DDoS, Anti-Carding) ─────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { success: false, message: 'Too many password reset requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 5,
  message: { success: false, message: 'Too many order requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: { success: false, message: 'Too many payment requests. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const couponLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: { success: false, message: 'Too many coupon checks. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { success: false, message: 'Too many subscription attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminUploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 min
  max: 30,
  message: { success: false, message: 'Upload rate limit reached. Please wait before uploading more images.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Auth Routes ───────────────────────────────────────────────────────────────

router.post('/auth/register', authLimiter, validate(registerSchema), registerUser);
router.post('/auth/login', authLimiter, validate(loginSchema), loginUser);
router.post('/auth/google', authLimiter, googleLogin);
router.get('/auth/me', protect, getMe);
router.put('/auth/profile', protect, updateProfile);
router.post('/auth/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/auth/reset-password/:token', passwordResetLimiter, resetPassword);

router.post('/subscribe', subscribeLimiter, subscribeEmail);

// ── Wishlist ──────────────────────────────────────────────────────────────────

router.get('/auth/wishlist', protect, getWishlist);
router.post('/auth/wishlist/:productId', protect, toggleWishlist);
router.delete('/auth/wishlist/:productId', protect, toggleWishlist);

// ── Address Book ──────────────────────────────────────────────────────────────

router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);
router.put('/addresses/:addressId/default', protect, setDefaultAddress);

// ── Product Storefront Routes ─────────────────────────────────────────────────

router.get('/products', getProducts);
router.get('/products/search', searchSuggestions);
router.get('/products/id/:id', getProductById);
router.get('/products/:slug', getProductBySlug);

// ── Reviews ───────────────────────────────────────────────────────────────────

router.get('/reviews', getApprovedReviews);
router.post('/reviews', protect, createReview);

// ── Categories ────────────────────────────────────────────────────────────────

router.get('/categories', async (_req, res) => {
  try {
    const categories = await Category.find({ status: 'active' });
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Coupons ───────────────────────────────────────────────────────────────────

router.post('/coupons/validate', protect, couponLimiter, validateCoupon);

// ── Orders ────────────────────────────────────────────────────────────────────

router.post('/orders', protect, orderLimiter, validate(createOrderSchema), createOrder);
router.get('/orders/my-orders', protect, getMyOrders);
router.get('/orders/:id', protect, getOrderById);
router.post('/orders/:id/cancel', protect, requestCancellation);
router.get('/orders/:id/invoice', protect, downloadInvoice);

// ── Payments (Razorpay Integration) ───────────────────────────────────────────

router.post('/payments/razorpay/create', protect, paymentLimiter, createRazorpayOrder);
router.post('/payments/razorpay/verify', protect, paymentLimiter, verifyRazorpayPayment);

// ── CMS Public ────────────────────────────────────────────────────────────────

router.get('/cms', getCMSConfig);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN & STAFF ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// Dashboard (admin only)
router.get('/admin/dashboard', protect, requireRole('admin'), getAdminDashboardStats);

// Products (admin only)
router.post('/admin/products', protect, requireRole('admin'), createProduct);
router.put('/admin/products/:id', protect, requireRole('admin'), updateProduct);
router.put('/admin/products/:id/images', protect, requireRole('admin'), updateProductImages);
router.delete('/admin/products/:id', protect, requireRole('admin'), deleteProduct);
router.put('/admin/products/:id/restore', protect, requireRole('admin'), restoreProduct);
router.put('/admin/products/bulk/warranty', protect, requireRole('admin'), bulkUpdateWarranty);
router.put('/admin/products/bulk/shipping', protect, requireRole('admin'), bulkUpdateShipping);
router.put('/admin/products/bulk/cod', protect, requireRole('admin'), bulkUpdateCOD);
router.put('/admin/products/bulk/delivery-charge', protect, requireRole('admin'), bulkUpdateDeliveryCharge);

// Image uploads (admin only)
router.post('/admin/upload', protect, requireRole('admin'), adminUploadLimiter, upload.array('images', 10), uploadProductImages);
router.delete('/admin/upload/:filename', protect, requireRole('admin'), deleteProductImage);

// Orders (admin and staff)
router.get('/admin/orders', protect, requireRole('admin', 'staff'), getAllOrders);
router.put('/admin/orders/:id/status', protect, requireRole('admin', 'staff'), updateOrderStatus);
router.get('/admin/export/orders', protect, requireRole('admin'), adminExportOrders);
router.get('/admin/customers', protect, requireRole('admin'), adminGetCustomers);
router.get('/admin/export/customers', protect, requireRole('admin'), adminExportCustomers);

// Coupons (admin only)
router.get('/admin/coupons', protect, requireRole('admin'), listCoupons);
router.post('/admin/coupons', protect, requireRole('admin'), createCoupon);
router.put('/admin/coupons/:id', protect, requireRole('admin'), updateCoupon);
router.put('/admin/coupons/:id/deactivate', protect, requireRole('admin'), deactivateCoupon);
router.delete('/admin/coupons/:id', protect, requireRole('admin'), deleteCoupon);

// Categories (admin only)
router.get('/admin/categories', protect, requireRole('admin'), adminGetCategories);
router.post('/admin/categories', protect, requireRole('admin'), adminCreateCategory);
router.put('/admin/categories/:id', protect, requireRole('admin'), adminUpdateCategory);
router.delete('/admin/categories/:id', protect, requireRole('admin'), adminDeleteCategory);

// CMS (admin only)
router.put('/admin/cms', protect, requireRole('admin'), updateCMSConfig);

// Reviews Moderation (admin and staff)
router.put('/admin/reviews/:id/approve', protect, requireRole('admin'), approveReview);
router.get('/admin/reviews', protect, requireRole('admin'), getAllReviewsAdmin);
router.delete('/admin/reviews/:id', protect, requireRole('admin'), deleteReview);

export default router;
