import cron from 'node-cron';
import User from '../models/User';
import Order from '../models/Order';
import { sendAbandonedCartReminder } from '../utils/notificationService';

/**
 * Abandoned Cart Reminder Job
 * Runs every hour. Finds users who haven't placed an order in 24h
 * but have active wishlist items (as a proxy for cart abandonment).
 * In production, you'd track cart sessions directly in a Cart model.
 */

export const startAbandonedCartJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[AbandonedCart] Running abandoned cart check...');

    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Find users with wishlist items and no recent order
      const users = await User.find({ 'wishlist.0': { $exists: true } }).select('name email _id');

      for (const user of users) {
        // Check if they placed an order in the last 24h
        const recentOrder = await Order.findOne({ user: user._id, createdAt: { $gte: cutoff } });

        if (!recentOrder) {
          await sendAbandonedCartReminder(user.email, user.name);
          console.log(`[AbandonedCart] Reminder sent to ${user.email}`);
        }
      }
    } catch (err: any) {
      console.error('[AbandonedCart] Job failed:', err.message);
    }
  });

  console.log('[AbandonedCart] Scheduler started (runs hourly).');
};
