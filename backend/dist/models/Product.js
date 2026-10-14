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
const VariantSchema = new mongoose_1.Schema({
    label: { type: String, required: true },
    sku: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    images: [{ type: String }],
});
const ProductSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    SKU: { type: String, required: true, unique: true, index: true },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
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
}, { timestamps: true });
// Auto-compute discount % before save
ProductSchema.pre('save', function (next) {
    const p = this;
    if (p.mrp > 0 && p.sellingPrice < p.mrp) {
        p.discount = Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100);
    }
    next();
});
// Full-text index for search
ProductSchema.index({ name: 'text', brand: 'text', description: 'text', tags: 'text' });
exports.default = mongoose_1.default.model('Product', ProductSchema);
