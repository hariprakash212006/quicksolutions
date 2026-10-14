import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorMiddleware';

// ── Auth Schemas ──────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (10 digits)'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Product Schema ────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(3).max(300),
  brand: z.string().min(1),
  mrp: z.number().positive(),
  sellingPrice: z.number().positive(),
  gst: z.number().min(0).max(28).default(18),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  shortDescription: z.string().min(10).max(500),
  description: z.string().min(20),
  warranty: z.string().default('1 Year Manufacturer Warranty'),
  isReturnable: z.boolean().default(true),
  isCODEnabled: z.boolean().default(true),
  deliveryCharge: z.number().min(0).default(0),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
});

// ── Order Schema ──────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  orderItems: z
    .array(
      z.object({
        product: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'Order must have at least one item'),
  shippingAddressId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid address ID').optional(),
  shippingAddress: z
    .object({
      fullName: z.string().min(2),
      phone: z.string().regex(/^[6-9]\d{9}$/),
      addressLine: z.string().min(5),
      landmark: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    })
    .optional(),
  paymentMethod: z.enum(['UPI', 'Card', 'NetBanking', 'Wallet', 'COD']),
  couponCode: z.string().nullish(),
}).refine(
  (data) => data.shippingAddressId || data.shippingAddress,
  { message: 'Either shippingAddressId or shippingAddress is required' }
);

// ── Coupon Schema ─────────────────────────────────────────────────────────────

export const couponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  discountType: z.enum(['flat', 'percentage']),
  discountValue: z.number().positive(),
  minOrderValue: z.number().min(0).default(0),
  maxDiscountAmount: z.number().positive().optional(),
  expiryDate: z.string().datetime(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
});

// ── Review Schema ─────────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  orderId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid order ID'),
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(1000),
});

// ── Validation Middleware Factory ─────────────────────────────────────────────

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const zodError = result.error as z.ZodError;
      const messages = zodError.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('; ');
      next(new AppError(`Validation Error: ${messages}`, 400));
      return;
    }
    req.body = result.data; // Replace with coerced/sanitized data
    next();
  };
