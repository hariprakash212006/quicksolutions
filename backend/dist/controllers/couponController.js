"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCoupon = exports.listCoupons = exports.deleteCoupon = exports.deactivateCoupon = exports.updateCoupon = exports.createCoupon = void 0;
const Coupon_1 = __importDefault(require("../models/Coupon"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
// ── Admin: Create Coupon ──────────────────────────────────────────────────────
exports.createCoupon = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const exists = await Coupon_1.default.findOne({ code: req.body.code.toUpperCase() });
    if (exists)
        throw new errorMiddleware_1.AppError('A coupon with this code already exists.', 400);
    const coupon = await Coupon_1.default.create({ ...req.body, code: req.body.code.toUpperCase() });
    res.status(201).json({ success: true, coupon });
});
// ── Admin: Update Coupon ──────────────────────────────────────────────────────
exports.updateCoupon = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const coupon = await Coupon_1.default.findById(req.params.id);
    if (!coupon)
        throw new errorMiddleware_1.AppError('Coupon not found.', 404);
    const { code, usedCount, usedBy, ...updateData } = req.body; // protect usage stats
    Object.assign(coupon, updateData);
    const updated = await coupon.save();
    res.json({ success: true, coupon: updated });
});
// ── Admin: Deactivate Coupon ──────────────────────────────────────────────────
exports.deactivateCoupon = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const coupon = await Coupon_1.default.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!coupon)
        throw new errorMiddleware_1.AppError('Coupon not found.', 404);
    res.json({ success: true, message: 'Coupon deactivated.', coupon });
});
// ── Admin: Delete Coupon ──────────────────────────────────────────────────────
exports.deleteCoupon = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const coupon = await Coupon_1.default.findByIdAndDelete(req.params.id);
    if (!coupon)
        throw new errorMiddleware_1.AppError('Coupon not found.', 404);
    res.json({ success: true, message: 'Coupon deleted successfully.' });
});
// ── Admin: List Coupons with Stats ────────────────────────────────────────────
exports.listCoupons = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const coupons = await Coupon_1.default.find().sort('-createdAt');
    res.json({ success: true, coupons });
});
// ── Public: Validate Coupon ───────────────────────────────────────────────────
exports.validateCoupon = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { code, orderValue, productIds, categoryIds } = req.body;
    const userId = req.user?._id?.toString();
    if (!code || !orderValue)
        throw new errorMiddleware_1.AppError('Code and orderValue are required.', 400);
    const coupon = await Coupon_1.default.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon)
        throw new errorMiddleware_1.AppError('Invalid or inactive coupon code.', 404);
    // Check expiry
    if (new Date() > coupon.expiryDate)
        throw new errorMiddleware_1.AppError('This coupon has expired.', 400);
    // Check min order value
    if (orderValue < coupon.minOrderValue) {
        throw new errorMiddleware_1.AppError(`Minimum order value of ₹${coupon.minOrderValue.toLocaleString('en-IN')} required for this coupon.`, 400);
    }
    // Check global usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new errorMiddleware_1.AppError('This coupon has reached its usage limit.', 400);
    }
    // Check per-user usage
    if (userId) {
        const userUsage = coupon.usedBy.find((u) => u.userId.toString() === userId);
        if (userUsage && userUsage.usedCount >= coupon.usageLimitPerUser) {
            throw new errorMiddleware_1.AppError('You have already used this coupon the maximum number of times.', 400);
        }
    }
    // Check product/category scoping
    if (coupon.applicableProducts.length > 0 && productIds?.length > 0) {
        const applicable = productIds.some((id) => coupon.applicableProducts.map((p) => p.toString()).includes(id));
        if (!applicable)
            throw new errorMiddleware_1.AppError('This coupon is not applicable to items in your cart.', 400);
    }
    if (coupon.applicableCategories.length > 0 && categoryIds?.length > 0) {
        const applicable = categoryIds.some((id) => coupon.applicableCategories.map((c) => c.toString()).includes(id));
        if (!applicable)
            throw new errorMiddleware_1.AppError('This coupon is not applicable to any category in your cart.', 400);
    }
    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'flat') {
        discountAmount = coupon.discountValue;
    }
    else {
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
