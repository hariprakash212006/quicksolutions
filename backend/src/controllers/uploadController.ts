import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import sharp from 'sharp';
import { asyncHandler, AppError } from '../middleware/errorMiddleware';
import { AuthRequest } from '../middleware/auth';

// ── Storage Config ────────────────────────────────────────────────────────────

const UPLOAD_DIR = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Use memory storage so we can process with sharp before saving
const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file initial limit
});

// ── Upload Images Endpoint ────────────────────────────────────────────────────

export const uploadProductImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    throw new AppError('No images uploaded.', 400);
  }

  const files = req.files as Express.Multer.File[];
  const urls: string[] = [];

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
    const outputPath = path.join(UPLOAD_DIR, filename);

    // Compress and convert to WebP using sharp - saves 70-85% storage space!
    await sharp(file.buffer)
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

export const deleteProductImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { filename } = req.params;

  // Sanitize filename to prevent path traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    throw new AppError('Image file not found.', 404);
  }

  fs.unlinkSync(filePath);
  res.json({ success: true, message: 'Image deleted successfully.' });
});
