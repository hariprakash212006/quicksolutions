import mongoose, { Schema, Document } from 'mongoose';

export interface ICouponUsage {
  userId: mongoose.Types.ObjectId;
  usedCount: number;
}

export interface ICoupon extends Document {
  code: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  expiryDate: Date;
  usageLimit?: number;
  usageLimitPerUser: number;
  usedCount: number;
  usedBy: ICouponUsage[];
  isActive: boolean;
  applicableCategories: mongoose.Types.ObjectId[];
  applicableProducts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountType: { type: String, enum: ['flat', 'percentage'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number },
    usageLimitPerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        usedCount: { type: Number, default: 1 },
      },
    ],
    isActive: { type: Boolean, default: true, index: true },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

export default mongoose.model<ICoupon>('Coupon', CouponSchema);
