"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const errorMiddleware_1 = require("./errorMiddleware");
/**
 * Middleware to restrict access to specific roles.
 * Usage: router.use(requireRole('admin')) or router.use(requireRole('admin', 'staff'))
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return next(new errorMiddleware_1.AppError('Not authenticated. Please log in.', 401));
        }
        if (!roles.includes(user.role)) {
            return next(new errorMiddleware_1.AppError(`Access denied. Required role: ${roles.join(' or ')}. Your role: ${user.role}`, 403));
        }
        next();
    };
};
exports.requireRole = requireRole;
