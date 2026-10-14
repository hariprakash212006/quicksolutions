import { Request, Response } from 'express';
import Coupon from '../models/Coupon';
import { asyncHandler, AppError } from '../middleware/errorMiddleware';
import { AuthRequest } from '../middleware/auth';

// ── Admin: Create Coupon ──────────────────────────────────────────────────────

export const createCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const exists = await Coupon.findOne({ code: req.body.code.toUpperCase() });
  if (exists) throw new AppError('A coupon with this code already exists.', 400);

  const coupon = await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() });
  res.status(201).json({ success: true, coupon });
});

// ── Admin: Update Coupon ──────────────────────────────────────────────────────

export const updateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new AppError('Coupon not found.', 404);

  const { code, usedCount, usedBy, ...updateData } = req.body; // protect usage stats
  Object.assign(coupon, updateData);
  const updated = await coupon.save();

  res.json({ success: true, coupon: updated });
});

// ── Admin: Deactivate Coupon ──────────────────────────────────────────────────

export const deactivateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!coupon) throw new AppError('Coupon not found.', 404);
  res.json({ success: true, message: 'Coupon deactivated.', coupon });
});

// ── Admin: Delete Coupon ──────────────────────────────────────────────────────

export const deleteCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new AppError('Coupon not found.', 404);
  res.json({ success: true, message: 'Coupon deleted successfully.' });
});

// ── Admin: List Coupons with Stats ────────────────────────────────────────────

export const listCoupons = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, coupons });
});

// ── Public: Validate Coupon ───────────────────────────────────────────────────

export const validateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, orderValue, productIds, categoryIds } = req.body;
  const userId = req.user?._id?.toString();

  if (!code || !orderValue) throw new AppError('Code and orderValue are required.', 400);

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) throw new AppError('Invalid or inactive coupon code.', 404);

  // Check expiry
  if (new Date() > coupon.expiryDate) throw new AppError('This coupon has expired.', 400);

  // Check min order value
  if (orderValue < coupon.minOrderValue) {
    throw new AppError(
      `Minimum order value of ₹${coupon.minOrderValue.toLocaleString('en-IN')} required for this coupon.`,
      400
    );
  }

  // Check global usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('This coupon has reached its usage limit.', 400);
  }

  // Check per-user usage
  if (userId) {
    const userUsage = coupon.usedBy.find((u) => u.userId.toString() === userId);
    if (userUsage && userUsage.usedCount >= coupon.usageLimitPerUser) {
      throw new AppError('You have already used this coupon the maximum number of times.', 400);
    }
  }

  // Check product/category scoping
  if (coupon.applicableProducts.length > 0 && productIds?.length > 0) {
    const applicable = productIds.some((id: string) =>
      coupon.applicableProducts.map((p) => p.toString()).includes(id)
    );
    if (!applicable) throw new AppError('This coupon is not applicable to items in your cart.', 400);
  }

  if (coupon.applicableCategories.length > 0 && categoryIds?.length > 0) {
    const applicable = categoryIds.some((id: string) =>
      coupon.applicableCategories.map((c) => c.toString()).includes(id)
    );
    if (!applicable) throw new AppError('This coupon is not applicable to any category in your cart.', 400);
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'flat') {
    discountAmount = coupon.discountValue;
  } else {
    discountAmount = (orderValue * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  }
  discountAmount = Math.round(discountAmount * 100) / 100;

  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
    },
  });
});
