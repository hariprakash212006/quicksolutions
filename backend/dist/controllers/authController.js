"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = exports.toggleWishlist = exports.getWishlist = exports.resetPassword = exports.forgotPassword = exports.updateProfile = exports.getMe = exports.loginUser = exports.registerUser = void 0;
const axios_1 = __importDefault(require("axios"));
const google_auth_library_1 = require("google-auth-library");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const notificationService_1 = require("../utils/notificationService");
const security_1 = require("../utils/security");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, (0, security_1.getJwtSecret)(), {
        expiresIn: '7d',
    });
};
const formatUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    addresses: user.addresses,
    wishlist: user.wishlist,
});
// ── Register ──────────────────────────────────────────────────────────────────
exports.registerUser = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { name, email, password, phone } = req.body;
    const userExists = await User_1.default.findOne({ email: email.toLowerCase() });
    if (userExists) {
        throw new errorMiddleware_1.AppError('An account with this email already exists.', 400);
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    const user = await User_1.default.create({
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
exports.loginUser = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await bcryptjs_1.default.compare(password, user.password || ''))) {
        throw new errorMiddleware_1.AppError('Invalid email or password.', 401);
    }
    const token = generateToken(user._id.toString());
    res.json({ success: true, token, user: formatUser(user) });
});
// ── Get Current User ──────────────────────────────────────────────────────────
exports.getMe = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user?._id);
    if (!user)
        throw new errorMiddleware_1.AppError('User not found.', 404);
    res.json({ success: true, user: formatUser(user) });
});
// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user?._id).select('+password');
    if (!user)
        throw new errorMiddleware_1.AppError('User not found.', 404);
    if (req.body.name)
        user.name = req.body.name;
    if (req.body.phone)
        user.phone = req.body.phone;
    if (req.body.newPassword) {
        if (!req.body.currentPassword) {
            throw new errorMiddleware_1.AppError('Current password is required to set a new password.', 400);
        }
        const isMatch = await bcryptjs_1.default.compare(req.body.currentPassword, user.password || '');
        if (!isMatch)
            throw new errorMiddleware_1.AppError('Current password is incorrect.', 401);
        user.password = await bcryptjs_1.default.hash(req.body.newPassword, 12);
    }
    const updated = await user.save();
    res.json({ success: true, user: formatUser(updated) });
});
// ── Forgot Password ───────────────────────────────────────────────────────────
exports.forgotPassword = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findOne({ email: req.body.email?.toLowerCase() });
    // Always respond 200 to avoid email enumeration
    if (!user) {
        res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
        return;
    }
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await (0, notificationService_1.sendPasswordReset)(user.email, user.name, resetUrl);
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});
// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const hashedToken = crypto_1.default.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User_1.default.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user)
        throw new errorMiddleware_1.AppError('Reset token is invalid or has expired.', 400);
    user.password = await bcryptjs_1.default.hash(req.body.password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    const token = generateToken(user._id.toString());
    res.json({ success: true, token, user: formatUser(user) });
});
// ── Wishlist ──────────────────────────────────────────────────────────────────
exports.getWishlist = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user?._id).populate({
        path: 'wishlist',
        match: { isDeleted: false, status: 'published' },
        select: 'name slug SKU mrp sellingPrice discount images brand stock averageRating numOfReviews',
    });
    if (!user)
        throw new errorMiddleware_1.AppError('User not found.', 404);
    res.json({ success: true, wishlist: user.wishlist || [] });
});
exports.toggleWishlist = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user?._id);
    if (!user)
        throw new errorMiddleware_1.AppError('User not found.', 404);
    const productId = req.params.productId;
    const idx = user.wishlist.findIndex((id) => id.toString() === productId);
    let isAdded = false;
    if (idx > -1) {
        user.wishlist.splice(idx, 1);
        isAdded = false;
    }
    else {
        user.wishlist.push(productId);
        isAdded = true;
    }
    await user.save();
    res.json({ success: true, isAdded, wishlist: user.wishlist });
});
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const { token } = req.body;
    if (!token)
        throw new errorMiddleware_1.AppError("No Google token provided.", 400);
    let email, name, sub;
    try {
        const googleRes = await axios_1.default.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${token}` }
        });
        email = googleRes.data.email;
        name = googleRes.data.name;
        sub = googleRes.data.sub;
    }
    catch (err) {
        throw new errorMiddleware_1.AppError("Invalid Google token or unable to fetch profile.", 401);
    }
    if (!email)
        throw new errorMiddleware_1.AppError("Invalid Google profile", 401);
    let user = await User_1.default.findOne({ email });
    if (!user) {
        user = await User_1.default.create({
            name: name || "Google User",
            email: email,
            phone: "0000000000",
            password: await bcryptjs_1.default.hash(crypto_1.default.randomBytes(16).toString("hex"), 10),
        });
    }
    const jwtToken = generateToken(user._id.toString());
    res.json({ success: true, token: jwtToken, user: formatUser(user) });
});
