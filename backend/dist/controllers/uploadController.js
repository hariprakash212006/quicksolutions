"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductImage = exports.uploadProductImages = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
// ── Storage Config ────────────────────────────────────────────────────────────
const UPLOAD_DIR = path_1.default.join(__dirname, '../../uploads/products');
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
// Use memory storage so we can process with sharp before saving
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file initial limit
});
// ── Upload Images Endpoint ────────────────────────────────────────────────────
exports.uploadProductImages = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        throw new errorMiddleware_1.AppError('No images uploaded.', 400);
    }
    const files = req.files;
    const urls = [];
    // Create clean prefix from product name, slug, or category if provided
    const rawTag = (req.body?.productSlug || req.body?.productName || req.body?.category || 'product')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 35) || 'product';
    for (const file of files) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const filename = `${rawTag}-${uniqueSuffix}.webp`;
        const outputPath = path_1.default.join(UPLOAD_DIR, filename);
        // Compress and convert to WebP using sharp - saves 70-85% storage space!
        await (0, sharp_1.default)(file.buffer)
            .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
        })
            .webp({ quality: 82 })
            .toFile(outputPath);
        urls.push(`/uploads/products/${filename}`);
    }
    res.status(201).json({ success: true, count: urls.length, urls });
});
// ── Delete Image Endpoint ─────────────────────────────────────────────────────
exports.deleteProductImage = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { filename } = req.params;
    // Sanitize filename to prevent path traversal
    const safeFilename = path_1.default.basename(filename);
    const filePath = path_1.default.join(UPLOAD_DIR, safeFilename);
    if (!fs_1.default.existsSync(filePath)) {
        throw new errorMiddleware_1.AppError('Image file not found.', 404);
    }
    fs_1.default.unlinkSync(filePath);
    res.json({ success: true, message: 'Image deleted successfully.' });
});
