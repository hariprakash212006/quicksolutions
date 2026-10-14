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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ORDER_STATUSES = [
    'Pending',
    'Payment Pending',
    'Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancellation Requested',
    'Cancelled',
    'Refund Pending',
    'Refunded',
    'Flagged for Review',
];
const OrderSchema = new mongoose_1.Schema({
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: [
        {
            product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String, required: true },
            image: { type: String, required: true },
            SKU: { type: String, required: true },
            price: { type: Number, required: true },
            deliveryCharge: { type: Number, default: 0 },
            quantity: { type: Number, required: true },
            isReturnable: { type: Boolean, default: true },
            isCODEnabled: { type: Boolean, default: true },
        },
    ],
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine: { type: String, required: true },
        landmark: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ['UPI', 'Card', 'NetBanking', 'Wallet', 'COD'], required: true },
    paymentInfo: {
        id: { type: String },
        status: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        razorpaySignature: { type: String },
        paidAt: { type: Date },
    },
    itemsPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    shippingPrice: { type: Number, default: 0 },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    orderStatus: {
        type: String,
        enum: ORDER_STATUSES,
        default: 'Confirmed',
        index: true,
    },
    statusHistory: [
        {
            status: { type: String, enum: ORDER_STATUSES, required: true },
            timestamp: { type: Date, default: Date.now },
            note: { type: String },
            updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        },
    ],
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    courierPartner: { type: String },
    cancellationReason: { type: String },
    refundId: { type: String },
    flagReason: { type: String },
    invoicePath: { type: String },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
}, { timestamps: true });
exports.default = mongoose_1.default.model('Order', OrderSchema);
