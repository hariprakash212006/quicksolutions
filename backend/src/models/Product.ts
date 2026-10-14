import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  label: string;   // e.g. "2MP" or "White"
  sku: string;
  stock: number;
  mrp: number;
  sellingPrice: number;
  images?: string[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  SKU: string;
  category: mongoose.Types.ObjectId;
  subcategory?: string;
  brand: string;
  mrp: number;
  sellingPrice: number;
  discount: number;
  gst: number;
  hsn: string;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  shortDescription: string;
  description: string;
  specifications: Map<string, string>;
  features: string[];
  variants: IProductVariant[];
  warranty: string;
  installationDetails?: string;
  shippingInformation?: string;
  // ── Granular Shop-Owner Controls ──
  isReturnable: boolean;
  returnWindowDays: number;
  isCODEnabled: boolean;
  deliveryCharge: number;
  freeDeliveryAbove?: number;
  // ── Status ──
  returnPolicy?: string;
  tags: string[];
  featured: boolean;
  bestSeller: boolean;
  status: 'published' | 'draft' | 'archived';
  isDeleted: boolean;
  // ── SEO ──
  seoTitle?: string;
  seoDescription?: string;
  // ── Ratings ──
  averageRating: number;
  numOfReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema({
  label: { type: String, required: true },
  sku: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  mrp: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  images: [{ type: String }],
});

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    SKU: { type: String, required: true, unique: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategory: { type: String },
    brand: { type: String, required: true, index: true },
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true, index: true },
    discount: { type: Number, default: 0 },
    gst: { type: Number, default: 18 },
    hsn: { type: String, default: '8525' },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    images: [{ type: String, required: true }],
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    specifications: { type: Map, of: String },
    features: [{ type: String }],
    variants: [VariantSchema],
    warranty: { type: String, default: '1 Year Manufacturer Warranty' },
    installationDetails: { type: String },
    shippingInformation: { type: String, default: 'Dispatched within 24–48 hours' },
    // ── Granular Controls ──
    isReturnable: { type: Boolean, default: true },
    returnWindowDays: { type: Number, default: 7 },
    isCODEnabled: { type: Boolean, default: true },
    deliveryCharge: { type: Number, default: 0 },
    freeDeliveryAbove: { type: Number },
    returnPolicy: { type: String, default: '7-Day Replacement Policy' },
    tags: [{ type: String }],
    featured: { type: Boolean, default: false, index: true },
    bestSeller: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    seoTitle: { type: String },
    seoDescription: { type: String },
    averageRating: { type: Number, default: 0 },
    numOfReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-compute discount % before save
ProductSchema.pre('save', function (next) {
  const p = this as any;
  if (p.mrp > 0 && p.sellingPrice < p.mrp) {
    p.discount = Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100);
  }
  next();
});

// Full-text index for search
ProductSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);
