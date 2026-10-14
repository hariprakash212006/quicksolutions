"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.reviewSchema = exports.couponSchema = exports.createOrderSchema = exports.productSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
// ── Auth Schemas ──────────────────────────────────────────────────────────────
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    email: zod_1.z.string().email('Invalid email address').trim().toLowerCase(),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password cannot exceed 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    phone: zod_1.z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (10 digits)'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// ── Product Schema ────────────────────────────────────────────────────────────
exports.productSchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(300),
    brand: zod_1.z.string().min(1),
    mrp: zod_1.z.number().positive(),
    sellingPrice: zod_1.z.number().positive(),
    gst: zod_1.z.number().min(0).max(28).default(18),
    stock: zod_1.z.number().int().min(0).default(0),
    lowStockThreshold: zod_1.z.number().int().min(0).default(5),
    shortDescription: zod_1.z.string().min(10).max(500),
    description: zod_1.z.string().min(20),
    warranty: zod_1.z.string().default('1 Year Manufacturer Warranty'),
    isReturnable: zod_1.z.boolean().default(true),
    isCODEnabled: zod_1.z.boolean().default(true),
    deliveryCharge: zod_1.z.number().min(0).default(0),
    status: zod_1.z.enum(['published', 'draft', 'archived']).default('published'),
});
// ── Order Schema ──────────────────────────────────────────────────────────────
exports.createOrderSchema = zod_1.z.object({
    orderItems: zod_1.z
        .array(zod_1.z.object({
        product: zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
        quantity: zod_1.z.number().int().positive(),
    }))
        .min(1, 'Order must have at least one item'),
    shippingAddressId: zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid address ID').optional(),
    shippingAddress: zod_1.z
        .object({
        fullName: zod_1.z.string().min(2),
        phone: zod_1.z.string().regex(/^[6-9]\d{9}$/),
        addressLine: zod_1.z.string().min(5),
        landmark: zod_1.z.string().optional(),
        city: zod_1.z.string().min(2),
        state: zod_1.z.string().min(2),
        pincode: zod_1.z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    })
        .optional(),
    paymentMethod: zod_1.z.enum(['UPI', 'Card', 'NetBanking', 'Wallet', 'COD']),
    couponCode: zod_1.z.string().nullish(),
}).refine((data) => data.shippingAddressId || data.shippingAddress, { message: 'Either shippingAddressId or shippingAddress is required' });
// ── Coupon Schema ─────────────────────────────────────────────────────────────
exports.couponSchema = zod_1.z.object({
    code: zod_1.z.string().min(3).max(30).toUpperCase(),
    discountType: zod_1.z.enum(['flat', 'percentage']),
    discountValue: zod_1.z.number().positive(),
    minOrderValue: zod_1.z.number().min(0).default(0),
    maxDiscountAmount: zod_1.z.number().positive().optional(),
    expiryDate: zod_1.z.string().datetime(),
    usageLimit: zod_1.z.number().int().positive().optional(),
    usageLimitPerUser: zod_1.z.number().int().positive().default(1),
    isActive: zod_1.z.boolean().default(true),
    applicableCategories: zod_1.z.array(zod_1.z.string()).optional(),
    applicableProducts: zod_1.z.array(zod_1.z.string()).optional(),
});
// ── Review Schema ─────────────────────────────────────────────────────────────
exports.reviewSchema = zod_1.z.object({
    orderId: zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order ID'),
    productId: zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().min(10, 'Review must be at least 10 characters').max(1000),
});
// ── Validation Middleware Factory ─────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const zodError = result.error;
        const messages = zodError.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new errorMiddleware_1.AppError(`Validation Error: ${messages}`, 400));
        return;
    }
    req.body = result.data; // Replace with coerced/sanitized data
    next();
};
exports.validate = validate;
