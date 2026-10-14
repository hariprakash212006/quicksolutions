"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelRazorpayPayment = exports.verifyRazorpayPayment = exports.createRazorpayOrder = void 0;
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const User_1 = __importDefault(require("../models/User"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const notificationService_1 = require("../utils/notificationService");
// Initialize Razorpay credentials helper
const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey12345';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'mocksecret123456789';
    const isMock = key_id.startsWith('rzp_test_mock') || key_secret.startsWith('mocksecret');
    return {
        key_id,
        key_secret,
        isMock,
        instance: new razorpay_1.default({ key_id, key_secret }),
    };
};
// ── 1. Create Razorpay Order ──────────────────────────────────────────────────
exports.createRazorpayOrder = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.body;
    if (!orderId)
        throw new errorMiddleware_1.AppError('Order ID is required.', 400);
    const order = await Order_1.default.findById(orderId);
    if (!order)
        throw new errorMiddleware_1.AppError('Order not found.', 404);
    // Security: only order owner or admin can initiate payment
    if (order.user.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
        throw new errorMiddleware_1.AppError('Unauthorized access to this order.', 403);
    }
    // Ensure order is not already paid
    if (order.paymentInfo?.status === 'Paid') {
        throw new errorMiddleware_1.AppError('Order has already been paid and verified.', 400);
    }
    if (order.orderStatus === 'Cancelled') {
        throw new errorMiddleware_1.AppError('Cannot initiate payment for a cancelled order.', 400);
    }
    const { key_id, key_secret, isMock, instance } = getRazorpayInstance();
    const amountInPaise = Math.round(order.totalPrice * 100);
    let razorpayOrderId;
    if (isMock) {
        razorpayOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    }
    else {
        try {
            const rzpOrder = await instance.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: order.orderNumber,
                notes: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    userId: req.user?._id?.toString(),
                },
            });
            razorpayOrderId = rzpOrder.id;
        }
        catch (rzpErr) {
            if (process.env.NODE_ENV !== 'production') {
                razorpayOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            }
            else {
                throw new errorMiddleware_1.AppError(`Payment Gateway Error: ${rzpErr.message || 'Unable to create Razorpay order'}`, 502);
            }
        }
    }
    order.paymentInfo.razorpayOrderId = razorpayOrderId;
    order.paymentInfo.status = 'Pending';
    order.orderStatus = 'Payment Pending';
    await order.save();
    res.json({
        success: true,
        keyId: key_id,
        amount: amountInPaise,
        currency: 'INR',
        razorpayOrderId,
        orderNumber: order.orderNumber,
        isMock,
    });
});
// ── 2. Verify Razorpay Payment (Cryptographic HMAC-SHA256) ───────────────────
exports.verifyRazorpayPayment = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new errorMiddleware_1.AppError('Missing payment verification parameters.', 400);
    }
    const order = await Order_1.default.findById(orderId);
    if (!order)
        throw new errorMiddleware_1.AppError('Order not found.', 404);
    if (order.user.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
        throw new errorMiddleware_1.AppError('Unauthorized access to this order.', 403);
    }
    if (order.paymentInfo?.status === 'Paid') {
        res.json({ success: true, message: 'Payment already verified.', order });
        return;
    }
    // Cross-check Razorpay order ID matches the order in DB
    if (order.paymentInfo?.razorpayOrderId && order.paymentInfo.razorpayOrderId !== razorpay_order_id) {
        throw new errorMiddleware_1.AppError('Security Alert: Razorpay Order ID mismatch.', 400);
    }
    const { key_secret, isMock } = getRazorpayInstance();
    const expectedBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto_1.default
        .createHmac('sha256', key_secret)
        .update(expectedBody)
        .digest('hex');
    const isMockDev = isMock && razorpay_order_id.startsWith('order_mock_');
    let isSignatureValid = false;
    if (isMockDev) {
        isSignatureValid = true;
    }
    else {
        try {
            isSignatureValid =
                generatedSignature.length === razorpay_signature.length &&
                    crypto_1.default.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpay_signature));
        }
        catch {
            isSignatureValid = false;
        }
    }
    if (!isSignatureValid) {
        order.paymentInfo.status = 'Failed';
        order.statusHistory.push({
            status: 'Payment Pending',
            timestamp: new Date(),
            note: 'Cryptographic signature verification failed: Possible payment tampering.',
        });
        await order.save();
        throw new errorMiddleware_1.AppError('Cryptographic security check failed: Invalid payment signature.', 400);
    }
    // ── Payment Successfully Verified ──────────────────────────────────────────
    const FLAG_THRESHOLD = Number(process.env.ORDER_FLAG_THRESHOLD) || 50000;
    const isFlagged = order.totalPrice > FLAG_THRESHOLD;
    order.paymentInfo.status = 'Paid';
    order.paymentInfo.id = razorpay_payment_id;
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.razorpayOrderId = razorpay_order_id;
    order.paymentInfo.razorpaySignature = razorpay_signature;
    order.paymentInfo.paidAt = new Date();
    order.orderStatus = isFlagged ? 'Flagged for Review' : 'Confirmed';
    order.statusHistory.push({
        status: order.orderStatus,
        timestamp: new Date(),
        note: `Online payment of ₹${order.totalPrice} verified successfully via Razorpay (Payment ID: ${razorpay_payment_id})`,
    });
    await order.save();
    // Consume coupon now that payment is confirmed
    if (order.couponCode) {
        await Coupon_1.default.findOneAndUpdate({ code: order.couponCode }, {
            $inc: { usedCount: 1 },
            $push: { usedBy: { userId: order.user, usedCount: 1 } },
        }).catch(console.error);
    }
    // Send Order Confirmation Email
    const customer = await User_1.default.findById(order.user);
    if (customer?.email) {
        (0, notificationService_1.sendOrderConfirmation)(customer.email, customer.name, order.orderNumber, order.totalPrice).catch(console.error);
    }
    res.json({
        success: true,
        message: 'Payment verified and order confirmed successfully.',
        order,
    });
});
// ── 3. Cancel / Roll Back Unpaid Order (on modal dismiss or failure) ───────────
exports.cancelRazorpayPayment = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { orderId, reason } = req.body;
    if (!orderId)
        throw new errorMiddleware_1.AppError('Order ID is required.', 400);
    const order = await Order_1.default.findById(orderId);
    if (!order)
        throw new errorMiddleware_1.AppError('Order not found.', 404);
    if (order.user.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
        throw new errorMiddleware_1.AppError('Unauthorized access.', 403);
    }
    // Only cancel if payment has not already been completed
    if (order.paymentInfo?.status === 'Paid') {
        throw new errorMiddleware_1.AppError('Cannot cancel an order that is already paid.', 400);
    }
    // Restore inventory stock back to products
    for (const item of order.orderItems) {
        await Product_1.default.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
        }).catch(console.error);
    }
    order.orderStatus = 'Cancelled';
    order.paymentInfo.status = 'Failed';
    order.cancellationReason = reason || 'Customer cancelled online payment during checkout';
    order.cancelledAt = new Date();
    order.statusHistory.push({
        status: 'Cancelled',
        timestamp: new Date(),
        note: order.cancellationReason,
    });
    await order.save();
    res.json({
        success: true,
        message: 'Unpaid order cancelled and stock released back to inventory.',
    });
});
