"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadInvoice = exports.getAllOrders = exports.updateOrderStatus = exports.requestCancellation = exports.getOrderById = exports.getMyOrders = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const User_1 = __importDefault(require("../models/User"));
const CMSConfig_1 = __importDefault(require("../models/CMSConfig"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const invoiceGenerator_1 = require("../services/invoiceGenerator");
const notificationService_1 = require("../utils/notificationService");
const security_1 = require("../utils/security");
// ── Helpers ───────────────────────────────────────────────────────────────────
const generateOrderNumber = () => {
    const ts = Date.now().toString().slice(-8);
    const rand = Math.floor(100 + Math.random() * 900);
    return `QS-${ts}-${rand}`;
};
// ── Create Order (Atomic Stock + Server-Authoritative Pricing) ────────────────
exports.createOrder = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { orderItems, shippingAddress, shippingAddressId, paymentMethod, couponCode } = req.body;
    // Resolve shipping address
    let resolvedAddress = shippingAddress;
    if (shippingAddressId) {
        const user = await User_1.default.findById(req.user?._id);
        const addr = user?.addresses?.id(shippingAddressId);
        if (!addr)
            throw new errorMiddleware_1.AppError('Shipping address not found.', 404);
        resolvedAddress = addr;
    }
    if (!resolvedAddress)
        throw new errorMiddleware_1.AppError('Shipping address is required.', 400);
    let itemsPrice = 0;
    let shippingPrice = 0;
    let codBlocked = false;
    const validatedItems = [];
    const reservedStocks = [];
    try {
        for (const item of orderItems) {
            // Atomic stock reservation: findOneAndUpdate is atomic at the document level —
            // no replica-set session/transaction required for this operation.
            const product = await Product_1.default.findOneAndUpdate({ _id: item.product, stock: { $gte: item.quantity }, isDeleted: false, status: 'published' }, { $inc: { stock: -item.quantity } }, { new: true });
            if (!product) {
                const existing = await Product_1.default.findById(item.product);
                if (!existing)
                    throw new errorMiddleware_1.AppError(`Product not found: ${item.product}`, 404);
                throw new errorMiddleware_1.AppError(`Insufficient stock for "${existing.name}". Only ${existing.stock} unit(s) available.`, 400);
            }
            reservedStocks.push({ productId: product._id, quantity: item.quantity });
            if (!product.isCODEnabled)
                codBlocked = true;
            itemsPrice += product.sellingPrice * item.quantity;
            validatedItems.push({
                product: product._id,
                name: product.name,
                image: product.images[0],
                SKU: product.SKU,
                price: product.sellingPrice,
                deliveryCharge: product.deliveryCharge,
                quantity: item.quantity,
                isReturnable: product.isReturnable,
                isCODEnabled: product.isCODEnabled,
            });
        }
        if (paymentMethod === 'COD' && codBlocked) {
            throw new errorMiddleware_1.AppError('Cash on Delivery is not available for one or more items in your order.', 400);
        }
        // ── Server-Side Coupon Validation ──────────────────────────────────────────
        let couponDiscount = 0;
        let couponDoc = null;
        if (couponCode) {
            couponDoc = await Coupon_1.default.findOne({ code: couponCode.toUpperCase(), isActive: true });
            if (!couponDoc)
                throw new errorMiddleware_1.AppError('Invalid or inactive coupon code.', 400);
            if (new Date() > couponDoc.expiryDate)
                throw new errorMiddleware_1.AppError('This coupon has expired.', 400);
            if (itemsPrice < couponDoc.minOrderValue) {
                throw new errorMiddleware_1.AppError(`Minimum order value of ₹${couponDoc.minOrderValue} required for this coupon.`, 400);
            }
            if (couponDoc.usageLimit && couponDoc.usedCount >= couponDoc.usageLimit) {
                throw new errorMiddleware_1.AppError('This coupon has reached its usage limit.', 400);
            }
            const userId = req.user?._id?.toString();
            if (userId) {
                const userUsage = couponDoc.usedBy.find((u) => u.userId.toString() === userId);
                if (userUsage && userUsage.usedCount >= couponDoc.usageLimitPerUser) {
                    throw new errorMiddleware_1.AppError('You have already used this coupon the maximum allowed times.', 400);
                }
            }
            if (couponDoc.discountType === 'flat') {
                couponDiscount = couponDoc.discountValue;
            }
            else {
                couponDiscount = (itemsPrice * couponDoc.discountValue) / 100;
                if (couponDoc.maxDiscountAmount)
                    couponDiscount = Math.min(couponDiscount, couponDoc.maxDiscountAmount);
            }
            couponDiscount = Math.round(couponDiscount * 100) / 100;
        }
        // ── Dynamic Shipping Price Calculation ──────────────────────────────────────
        const cmsConfig = await CMSConfig_1.default.findOne().lean();
        const shippingSettings = cmsConfig?.shippingConfig || {
            allProductsFreeShipping: false,
            freeShippingThreshold: 2000,
            defaultShippingFee: 99,
            enabled: true,
        };
        if (shippingSettings.allProductsFreeShipping) {
            shippingPrice = 0;
        }
        else if (!shippingSettings.enabled) {
            shippingPrice = shippingSettings.defaultShippingFee ?? 99;
        }
        else if (itemsPrice >= (shippingSettings.freeShippingThreshold ?? 2000)) {
            shippingPrice = 0;
        }
        else {
            const totalItemDeliveryCharge = validatedItems.reduce((sum, item) => sum + ((item.deliveryCharge || 0) * (item.quantity || 1)), 0);
            shippingPrice = totalItemDeliveryCharge > 0 ? totalItemDeliveryCharge : (shippingSettings.defaultShippingFee ?? 99);
        }
        const taxPrice = 0;
        const totalPrice = Math.max(0, itemsPrice + shippingPrice - couponDiscount);
        const FLAG_THRESHOLD = Number(process.env.ORDER_FLAG_THRESHOLD) || 50000;
        const isFlagged = totalPrice > FLAG_THRESHOLD;
        const isOnlinePayment = paymentMethod !== 'COD';
        // Real-Time Shopping Protection: Online payments start in 'Payment Pending'.
        // Only COD orders are immediately placed in Confirmed status.
        const initialOrderStatus = isOnlinePayment
            ? 'Payment Pending'
            : isFlagged
                ? 'Flagged for Review'
                : 'Confirmed';
        const [createdOrder] = await Order_1.default.create([
            {
                orderNumber: generateOrderNumber(),
                user: req.user?._id,
                orderItems: validatedItems,
                shippingAddress: resolvedAddress,
                paymentMethod,
                itemsPrice,
                taxPrice,
                shippingPrice,
                couponCode: couponDoc?.code,
                couponDiscount,
                totalPrice,
                paymentInfo: { status: 'Pending' },
                orderStatus: initialOrderStatus,
                flagReason: isFlagged ? `Order value ₹${totalPrice} exceeds threshold` : undefined,
                statusHistory: [
                    {
                        status: initialOrderStatus,
                        timestamp: new Date(),
                        note: isOnlinePayment
                            ? 'Order initiated. Awaiting online payment verification'
                            : 'COD order placed by customer',
                    },
                ],
            },
        ]);
        // Only consume coupon and send confirmation email immediately for Cash on Delivery.
        // Online payments consume coupon and send email in verifyRazorpayPayment upon cryptographic verification.
        if (!isOnlinePayment) {
            if (couponDoc) {
                await Coupon_1.default.findByIdAndUpdate(couponDoc._id, {
                    $inc: { usedCount: 1 },
                    $push: { usedBy: { userId: req.user?._id, usedCount: 1 } },
                });
            }
            // ── Send Confirmation Email (non-blocking) ─────────────────────────────────
            const customer = await User_1.default.findById(req.user?._id);
            if (customer) {
                (0, notificationService_1.sendOrderConfirmation)(customer.email, customer.name, createdOrder.orderNumber, totalPrice).catch(console.error);
            }
        }
        res.status(201).json({ success: true, order: createdOrder });
    }
    catch (err) {
        // Compensate: restore reserved stock if order creation failed
        for (const { productId, quantity } of reservedStocks) {
            await Product_1.default.findByIdAndUpdate(productId, { $inc: { stock: quantity } }).catch(console.error);
        }
        throw err;
    }
});
// ── Get My Orders ─────────────────────────────────────────────────────────────
exports.getMyOrders = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;
    const [orders, total] = await Promise.all([
        Order_1.default.find({ user: req.user?._id }).sort('-createdAt').skip(skip).limit(limitNum),
        Order_1.default.countDocuments({ user: req.user?._id }),
    ]);
    res.json({
        success: true,
        orders,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
});
// ── Get Order By ID ───────────────────────────────────────────────────────────
exports.getOrderById = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const order = await Order_1.default.findById(req.params.id).populate('user', 'name email phone');
    if (!order)
        throw new errorMiddleware_1.AppError('Order not found.', 404);
    const isOwner = order.user._id?.toString() === req.user?._id?.toString();
    const isPrivileged = ['staff', 'admin'].includes(req.user?.role || '');
    if (!isOwner && !isPrivileged)
        throw new errorMiddleware_1.AppError('Not authorized to view this order.', 403);
    res.json({ success: true, order });
});
// ── User: Request Cancellation ────────────────────────────────────────────────
exports.requestCancellation = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const order = await Order_1.default.findById(req.params.id);
    if (!order)
        throw new errorMiddleware_1.AppError('Order not found.', 404);
    if (order.user.toString() !== req.user?._id?.toString())
        throw new errorMiddleware_1.AppError('Not authorized.', 403);
    const cancellableStatuses = ['Confirmed', 'Processing', 'Payment Pending'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
        throw new errorMiddleware_1.AppError(`Cannot cancel an order with status "${order.orderStatus}". Please contact support.`, 400);
    }
    order.orderStatus = 'Cancellation Requested';
    order.cancellationReason = req.body.reason || 'Requested by customer';
    order.statusHistory.push({
        status: 'Cancellation Requested',
        timestamp: new Date(),
        note: order.cancellationReason,
    });
    await order.save();
    res.json({ success: true, message: 'Cancellation request submitted. We will process it shortly.', order });
});
// ── Admin: Update Order Status ────────────────────────────────────────────────
exports.updateOrderStatus = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { status, note, trackingNumber, trackingUrl, courierPartner, refundId } = req.body;
    const order = await Order_1.default.findById(req.params.id).populate('user', 'name email phone');
    if (!order)
        throw new errorMiddleware_1.AppError('Order not found.', 404);
    const prevStatus = order.orderStatus;
    order.orderStatus = status;
    order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status}`,
        updatedBy: req.user?._id,
    });
    if (trackingNumber)
        order.trackingNumber = trackingNumber;
    if (trackingUrl)
        order.trackingUrl = trackingUrl;
    if (courierPartner)
        order.courierPartner = courierPartner;
    if (refundId)
        order.refundId = refundId;
    if (status === 'Delivered')
        order.deliveredAt = new Date();
    if (status === 'Cancelled')
        order.cancelledAt = new Date();
    await order.save();
    const user = order.user;
    // ── Trigger notification per status ───────────────────────────────────────
    if (user?.email) {
        try {
            if (status === 'Shipped') {
                await (0, notificationService_1.sendOrderShipped)(user.email, user.name, order.orderNumber, courierPartner || 'Courier', trackingNumber || 'N/A', trackingUrl);
            }
            else if (status === 'Delivered') {
                await (0, notificationService_1.sendOrderDelivered)(user.email, user.name, order.orderNumber);
            }
            else if (status === 'Cancelled') {
                await (0, notificationService_1.sendOrderCancelled)(user.email, user.name, order.orderNumber, order.cancellationReason || 'Cancelled by store');
                // ── Restore stock on cancellation ──────────────────────────────────
                if (['Confirmed', 'Processing', 'Cancellation Requested'].includes(prevStatus)) {
                    for (const item of order.orderItems) {
                        await Product_1.default.findByIdAndUpdate(item.product, {
                            $inc: { stock: item.quantity },
                        });
                    }
                }
                // ── Roll back coupon usage on cancellation ─────────────────────────
                if (order.couponCode) {
                    const userId = order.user._id;
                    await Coupon_1.default.findOneAndUpdate({ code: order.couponCode }, {
                        $inc: { usedCount: -1 },
                        $pull: { usedBy: { userId } },
                    });
                }
            }
            else if (status === 'Refunded' && refundId) {
                await (0, notificationService_1.sendRefundProcessed)(user.email, user.name, order.orderNumber, order.totalPrice, refundId);
            }
        }
        catch (mailErr) {
            console.error('[Notification] Failed:', mailErr);
        }
    }
    res.json({ success: true, order });
});
// ── Admin: List All Orders ────────────────────────────────────────────────────
exports.getAllOrders = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { status, page = '1', limit = '20', sort = '-createdAt', keyword, } = req.query;
    const query = {};
    if (status)
        query.orderStatus = status;
    if (keyword)
        query.orderNumber = { $regex: (0, security_1.escapeRegex)(keyword), $options: 'i' };
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;
    const [orders, total] = await Promise.all([
        Order_1.default.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate('user', 'name email phone'),
        Order_1.default.countDocuments(query),
    ]);
    res.json({
        success: true,
        orders,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
});
// ── Download Invoice ──────────────────────────────────────────────────────────
exports.downloadInvoice = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const order = await Order_1.default.findById(req.params.id).populate('user', 'name email phone');
    if (!order)
        throw new errorMiddleware_1.AppError('Order not found.', 404);
    const isOwner = order.user._id?.toString() === req.user?._id?.toString();
    const isPrivileged = ['staff', 'admin'].includes(req.user?.role || '');
    if (!isOwner && !isPrivileged)
        throw new errorMiddleware_1.AppError('Not authorized.', 403);
    // ── High-Level Security: Invoice strictly locked until verified payment ──────
    if (order.paymentMethod !== 'COD' && order.paymentInfo?.status !== 'Paid') {
        throw new errorMiddleware_1.AppError('Security Restriction: Official tax invoice is only accessible and generated after successful payment verification.', 403);
    }
    if (order.orderStatus === 'Cancelled') {
        throw new errorMiddleware_1.AppError('Invoice is not available for cancelled orders.', 400);
    }
    const pdfBuffer = await (0, invoiceGenerator_1.generateInvoicePDF)(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice-${order.orderNumber}.pdf`);
    res.send(pdfBuffer);
});
