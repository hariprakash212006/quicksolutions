"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateDeliveryCharge = exports.bulkUpdateShipping = exports.bulkUpdateWarranty = exports.bulkUpdateCOD = exports.restoreProduct = exports.deleteProduct = exports.updateProductImages = exports.updateProduct = exports.createProduct = exports.searchSuggestions = exports.getProductById = exports.getProductBySlug = exports.getProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Product_1 = __importDefault(require("../models/Product"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const security_1 = require("../utils/security");
// ── List / Search (User-Facing & Admin) ─────────────────────────────────────
exports.getProducts = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { keyword, category, brand, minPrice, maxPrice, featured, bestSeller, status, page = '1', limit = '12', sort = '-createdAt', includeDeleted = 'false', } = req.query;
    const query = {};
    if (includeDeleted !== 'true')
        query.isDeleted = false;
    if (keyword)
        query.$text = { $search: keyword };
    if (category) {
        const Category = mongoose_1.default.model('Category');
        const catDoc = await Category.findOne({ slug: category });
        if (catDoc)
            query.category = catDoc._id;
    }
    if (brand)
        query.brand = { $regex: (0, security_1.escapeRegex)(brand), $options: 'i' };
    if (featured === 'true')
        query.featured = true;
    if (bestSeller === 'true')
        query.bestSeller = true;
    if (status)
        query.status = status;
    else
        query.status = 'published'; // default to published for customers
    if (minPrice || maxPrice) {
        query.sellingPrice = {};
        if (minPrice)
            query.sellingPrice.$gte = Number(minPrice);
        if (maxPrice)
            query.sellingPrice.$lte = Number(maxPrice);
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(48, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;
    // Map user-friendly sort keys to MongoDB sort criteria
    const sortMap = {
        'newest': { createdAt: -1 },
        '-createdAt': { createdAt: -1 },
        'price-low-high': { sellingPrice: 1 },
        'price-high-low': { sellingPrice: -1 },
        'highest-rated': { averageRating: -1, numOfReviews: -1 },
        'best-selling': { bestSeller: -1, createdAt: -1 },
        'discount': { discount: -1 },
        'name-a-z': { name: 1 },
        'name-z-a': { name: -1 },
    };
    const sortCriteria = sortMap[sort] || (sort.startsWith('-') || sort.startsWith('+') ? sort : { createdAt: -1 });
    const [products, total] = await Promise.all([
        Product_1.default.find(query).sort(sortCriteria).skip(skip).limit(limitNum).populate('category', 'name slug'),
        Product_1.default.countDocuments(query),
    ]);
    res.json({
        success: true,
        products,
        total,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        },
    });
});
// ── Get Single Product ────────────────────────────────────────────────────────
exports.getProductBySlug = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const product = await Product_1.default.findOne({ slug: req.params.slug, isDeleted: false }).populate('category', 'name slug');
    if (!product)
        throw new errorMiddleware_1.AppError('Product not found.', 404);
    const relatedProducts = await Product_1.default.find({
        category: product.category,
        _id: { $ne: product._id },
        isDeleted: false,
        status: 'published'
    }).limit(4);
    res.json({ success: true, product, relatedProducts });
});
exports.getProductById = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const product = await Product_1.default.findById(req.params.id).populate('category', 'name slug');
    if (!product)
        throw new errorMiddleware_1.AppError('Product not found.', 404);
    res.json({ success: true, product });
});
// ── Search Suggestions ────────────────────────────────────────────────────────
exports.searchSuggestions = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const q = req.query.q || '';
    if (q.length < 2) {
        res.json({ success: true, suggestions: [] });
        return;
    }
    const suggestions = await Product_1.default.find({ $text: { $search: q }, status: 'published', isDeleted: false }, { score: { $meta: 'textScore' }, name: 1, slug: 1, images: 1, sellingPrice: 1, brand: 1 })
        .sort({ score: { $meta: 'textScore' } })
        .limit(8);
    res.json({ success: true, suggestions });
});
// ── Admin: Create Product ─────────────────────────────────────────────────────
exports.createProduct = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const slugBase = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now()}`;
    const SKU = `QS-${Date.now()}`;
    const product = await Product_1.default.create({ ...req.body, slug, SKU });
    res.status(201).json({ success: true, product });
});
// ── Admin: Update Product ─────────────────────────────────────────────────────
exports.updateProduct = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const product = await Product_1.default.findById(req.params.id);
    if (!product)
        throw new errorMiddleware_1.AppError('Product not found.', 404);
    // Protect slug and SKU from being changed arbitrarily
    const { slug, SKU, ...updateData } = req.body;
    Object.assign(product, updateData);
    const updated = await product.save();
    res.json({ success: true, product: updated });
});
// ── Admin: Update Product Images ──────────────────────────────────────────────
exports.updateProductImages = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const product = await Product_1.default.findById(req.params.id);
    if (!product)
        throw new errorMiddleware_1.AppError('Product not found.', 404);
    const { images, primaryIndex = 0 } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
        throw new errorMiddleware_1.AppError('At least one image is required.', 400);
    }
    // Ensure primary image is first
    const sorted = [...images];
    if (primaryIndex > 0 && primaryIndex < sorted.length) {
        const [primary] = sorted.splice(primaryIndex, 1);
        sorted.unshift(primary);
    }
    product.images = sorted;
    await product.save();
    res.json({ success: true, images: product.images });
});
// ── Admin: Soft Delete ────────────────────────────────────────────────────────
exports.deleteProduct = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const product = await Product_1.default.findById(req.params.id);
    if (!product)
        throw new errorMiddleware_1.AppError('Product not found.', 404);
    product.isDeleted = true;
    product.status = 'archived';
    await product.save();
    res.json({ success: true, message: 'Product archived successfully.' });
});
// ── Admin: Restore Soft-Deleted Product ───────────────────────────────────────
exports.restoreProduct = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const product = await Product_1.default.findById(req.params.id);
    if (!product)
        throw new errorMiddleware_1.AppError('Product not found.', 404);
    product.isDeleted = false;
    product.status = 'draft';
    await product.save();
    res.json({ success: true, message: 'Product restored. Remember to publish it.' });
});
// ── Admin: Bulk Update Warranty ───────────────────────────────────────────────
exports.bulkUpdateCOD = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { isCODEnabled } = req.body;
    if (isCODEnabled === undefined)
        throw new errorMiddleware_1.AppError('isCODEnabled boolean is required.', 400);
    const query = { isDeleted: false };
    const result = await Product_1.default.updateMany(query, { isCODEnabled });
    res.json({
        success: true,
        message: `Cash on Delivery ${isCODEnabled ? 'enabled' : 'disabled'} for ${result.modifiedCount} products.`,
        modifiedCount: result.modifiedCount,
    });
});
exports.bulkUpdateWarranty = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { categoryId, warrantyText } = req.body;
    if (!warrantyText)
        throw new errorMiddleware_1.AppError('Warranty text is required.', 400);
    const query = { isDeleted: false };
    if (categoryId)
        query.category = categoryId;
    const result = await Product_1.default.updateMany(query, { warranty: warrantyText });
    res.json({
        success: true,
        message: `Warranty updated for ${result.modifiedCount} products.`,
        modifiedCount: result.modifiedCount
    });
});
// ── Admin: Bulk Update Dispatch / Delivery Duration ───────────────────────────
exports.bulkUpdateShipping = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { categoryId } = req.body;
    const shippingText = String(req.body.shippingText || '').trim();
    if (!shippingText)
        throw new errorMiddleware_1.AppError('Dispatch/delivery text is required.', 400);
    if (shippingText.length > 120)
        throw new errorMiddleware_1.AppError('Text must be 120 characters or fewer.', 400);
    const query = { isDeleted: false };
    if (categoryId)
        query.category = categoryId;
    const result = await Product_1.default.updateMany(query, { shippingInformation: shippingText });
    res.json({
        success: true,
        message: `Dispatch time updated for ${result.modifiedCount} products.`,
        modifiedCount: result.modifiedCount,
    });
});
// ── Admin: Bulk Update Delivery Charges / Free Shipping ────────────────────────
exports.bulkUpdateDeliveryCharge = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { categoryId, deliveryCharge } = req.body;
    const charge = Number(deliveryCharge);
    if (isNaN(charge) || charge < 0) {
        throw new errorMiddleware_1.AppError('Valid delivery charge (greater than or equal to 0) is required.', 400);
    }
    const query = { isDeleted: false };
    if (categoryId)
        query.category = categoryId;
    const result = await Product_1.default.updateMany(query, { deliveryCharge: charge });
    res.json({
        success: true,
        message: charge === 0
            ? `Free Delivery (₹0 charge) enabled for ${result.modifiedCount} products.`
            : `Delivery charge set to ₹${charge} for ${result.modifiedCount} products.`,
        modifiedCount: result.modifiedCount,
    });
});
