import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  SKU: string;
  price: number;
  deliveryCharge: number;
  quantity: number;
  isReturnable: boolean;
  isCODEnabled: boolean;
}

export type OrderStatus =
  | 'Pending'
  | 'Payment Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancellation Requested'
  | 'Cancelled'
  | 'Refund Pending'
  | 'Refunded'
  | 'Flagged for Review';

const ORDER_STATUSES: OrderStatus[] = [
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

export interface IStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: 'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'COD';
  paymentInfo: {
    id?: string;
    status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paidAt?: Date;
  };
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  couponCode?: string;
  couponDiscount: number;
  totalPrice: number;
  orderStatus: OrderStatus;
  statusHistory: IStatusHistory[];
  trackingNumber?: string;
  trackingUrl?: string;
  courierPartner?: string;
  cancellationReason?: string;
  refundId?: string;
  flagReason?: string;
  invoicePath?: string;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderItems: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
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
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
