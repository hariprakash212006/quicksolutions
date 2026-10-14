"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const errorMiddleware_1 = require("./errorMiddleware");
const security_1 = require("../utils/security");
/**
 * Protect middleware — verifies JWT and attaches user to req.
 * No mock fallback. Fails fast if DB is down.
 */
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        next(new errorMiddleware_1.AppError('Authentication required. Please log in.', 401));
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, (0, security_1.getJwtSecret)());
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            next(new errorMiddleware_1.AppError('The account associated with this token no longer exists.', 401));
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(new errorMiddleware_1.AppError('Invalid or expired token. Please log in again.', 401));
    }
};
exports.protect = protect;
/**
 * Legacy alias kept for backward compatibility with any remaining adminOnly usage.
 * Prefer requireRole('admin') from roleMiddleware for new routes.
 */
const adminOnly = (req, res, next) => {
    if (req.user?.role === 'admin') {
        next();
    }
    else {
        next(new errorMiddleware_1.AppError('Access denied. Admin privileges required.', 403));
    }
};
exports.adminOnly = adminOnly;
