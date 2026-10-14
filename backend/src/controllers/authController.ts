import { Request, Response } from 'express';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorMiddleware';
import { sendPasswordReset } from '../utils/notificationService';
import { getJwtSecret } from '../utils/security';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: '7d',
  });
};

const formatUser = (user: any) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  addresses: user.addresses,
  wishlist: user.wishlist,
});

// ── Register ──────────────────────────────────────────────────────────────────

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    throw new AppError('An account with this email already exists.', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    role: 'customer',
  });

  const token = generateToken(user._id.toString());

  res.status(201).json({ success: true, token, user: formatUser(user) });
});

// ── Login ─────────────────────────────────────────────────────────────────────

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password || ''))) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken(user._id.toString());

  res.json({ success: true, token, user: formatUser(user) });
});

// ── Get Current User ──────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new AppError('User not found.', 404);
  res.json({ success: true, user: formatUser(user) });
});

// ── Update Profile ────────────────────────────────────────────────────────────

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id).select('+password');
  if (!user) throw new AppError('User not found.', 404);

  if (req.body.name) user.name = req.body.name;
  if (req.body.phone) user.phone = req.body.phone;

  if (req.body.newPassword) {
    if (!req.body.currentPassword) {
      throw new AppError('Current password is required to set a new password.', 400);
    }
    const isMatch = await bcrypt.compare(req.body.currentPassword, user.password || '');
    if (!isMatch) throw new AppError('Current password is incorrect.', 401);
    user.password = await bcrypt.hash(req.body.newPassword, 12);
  }

  const updated = await user.save();
  res.json({ success: true, user: formatUser(updated) });
});

// ── Forgot Password ───────────────────────────────────────────────────────────

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  // Always respond 200 to avoid email enumeration
  if (!user) {
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  await sendPasswordReset(user.email, user.name, resetUrl);

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// ── Reset Password ────────────────────────────────────────────────────────────

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new AppError('Reset token is invalid or has expired.', 400);

  user.password = await bcrypt.hash(req.body.password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const token = generateToken(user._id.toString());
  res.json({ success: true, token, user: formatUser(user) });
});

// ── Wishlist ──────────────────────────────────────────────────────────────────

export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id).populate({
    path: 'wishlist',
    match: { isDeleted: false, status: 'published' },
    select: 'name slug SKU mrp sellingPrice discount images brand stock averageRating numOfReviews',
  });
  if (!user) throw new AppError('User not found.', 404);

  res.json({ success: true, wishlist: user.wishlist || [] });
});

export const toggleWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new AppError('User not found.', 404);

  const productId = req.params.productId;
  const idx = user.wishlist.findIndex((id) => id.toString() === productId);
  let isAdded = false;

  if (idx > -1) {
    user.wishlist.splice(idx, 1);
    isAdded = false;
  } else {
    user.wishlist.push(productId as any);
    isAdded = true;
  }

  await user.save();
  res.json({ success: true, isAdded, wishlist: user.wishlist });
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) throw new AppError("No Google token provided.", 400);

  let email, name, sub;
  try {
    const googleRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });
    email = googleRes.data.email;
    name = googleRes.data.name;
    sub = googleRes.data.sub;
  } catch (err) {
    throw new AppError("Invalid Google token or unable to fetch profile.", 401);
  }

  if (!email) throw new AppError("Invalid Google profile", 401);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: name || "Google User",
      email: email,
      phone: "0000000000",
      password: await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10),
    });
  }

  const jwtToken = generateToken(user._id.toString());
  res.json({ success: true, token: jwtToken, user: formatUser(user) });
});






