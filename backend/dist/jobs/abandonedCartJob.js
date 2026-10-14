"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAbandonedCartJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = __importDefault(require("../models/User"));
const Order_1 = __importDefault(require("../models/Order"));
const notificationService_1 = require("../utils/notificationService");
/**
 * Abandoned Cart Reminder Job
 * Runs every hour. Finds users who haven't placed an order in 24h
 * but have active wishlist items (as a proxy for cart abandonment).
 * In production, you'd track cart sessions directly in a Cart model.
 */
const startAbandonedCartJob = () => {
    node_cron_1.default.schedule('0 * * * *', async () => {
        console.log('[AbandonedCart] Running abandoned cart check...');
        try {
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
            // Find users with wishlist items and no recent order
            const users = await User_1.default.find({ 'wishlist.0': { $exists: true } }).select('name email _id');
            for (const user of users) {
                // Check if they placed an order in the last 24h
                const recentOrder = await Order_1.default.findOne({ user: user._id, createdAt: { $gte: cutoff } });
                if (!recentOrder) {
                    await (0, notificationService_1.sendAbandonedCartReminder)(user.email, user.name);
                    console.log(`[AbandonedCart] Reminder sent to ${user.email}`);
                }
            }
        }
        catch (err) {
            console.error('[AbandonedCart] Job failed:', err.message);
        }
    });
    console.log('[AbandonedCart] Scheduler started (runs hourly).');
};
exports.startAbandonedCartJob = startAbandonedCartJob;
