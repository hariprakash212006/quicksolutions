"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAbandonedCartReminder = exports.sendPasswordReset = exports.sendRefundProcessed = exports.sendOrderCancelled = exports.sendOrderDelivered = exports.sendOrderShipped = exports.sendOrderConfirmation = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const getTransporter = () => {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
        // Ethereal / dev preview — no real email sent
        return nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: Number(process.env.SMTP_PORT) || 587,
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
        });
    }
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};
const sendMail = async (options) => {
    try {
        const transporter = getTransporter();
        const info = await transporter.sendMail({
            from: `"Quick Solutions For U" <${process.env.SMTP_FROM || 'noreply@quicksolutionsforu.in'}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        console.log(`[Mailer] Email sent: ${info.messageId}`);
    }
    catch (err) {
        console.error(`[Mailer] Failed to send email to ${options.to}: ${err.message}`);
    }
};
// ── Templates ─────────────────────────────────────────────────────────────────
const baseTemplate = (body) => `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
    <div style="background: #0f172a; padding: 20px 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: #fff; font-size: 22px; margin: 0;">⚡ QUICK SOLUTIONS FOR U</h1>
      <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0;">quicksolutionsforu.in</p>
    </div>
    <div style="background: #fff; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
      ${body}
    </div>
    <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">
      © ${new Date().getFullYear()} Quick Solutions For U. All rights reserved.
    </p>
  </div>
`;
const sendOrderConfirmation = (email, name, orderNumber, total) => sendMail({
    to: email,
    subject: `Order Confirmed: #${orderNumber} | Quick Solutions For U`,
    html: baseTemplate(`
      <h2 style="color: #1e293b;">Hi ${name}, your order is confirmed! 🎉</h2>
      <p style="color: #475569;">Thank you for shopping with us. Your order has been received and is being processed.</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Order Number:</strong> #${orderNumber}</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #334155;"><strong>Total Amount:</strong> ₹${total.toLocaleString('en-IN')}</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/account/orders/${orderNumber}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Track Order</a>
    `),
});
exports.sendOrderConfirmation = sendOrderConfirmation;
const sendOrderShipped = (email, name, orderNumber, courier, tracking, trackingUrl) => sendMail({
    to: email,
    subject: `Your Order is Shipped! #${orderNumber}`,
    html: baseTemplate(`
      <h2 style="color: #1e293b;">Your order is on the way! 🚚</h2>
      <p style="color: #475569;">Hi ${name}, your order <strong>#${orderNumber}</strong> has been shipped.</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Courier:</strong> ${courier}</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #334155;"><strong>Tracking ID:</strong> ${tracking}</p>
      </div>
      ${trackingUrl ? `<a href="${trackingUrl}" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track Shipment</a>` : ''}
    `),
});
exports.sendOrderShipped = sendOrderShipped;
const sendOrderDelivered = (email, name, orderNumber) => sendMail({
    to: email,
    subject: `Delivered! Order #${orderNumber}`,
    html: baseTemplate(`
      <h2 style="color: #1e293b;">Your order has been delivered! ✅</h2>
      <p style="color: #475569;">Hi ${name}, we hope you love your purchase from Quick Solutions For U.</p>
      <p style="color: #475569;">If you faced any issue, please contact us within the return window.</p>
      <a href="${process.env.FRONTEND_URL}/account/orders/${orderNumber}/review" style="display: inline-block; background: #f59e0b; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Write a Review</a>
    `),
});
exports.sendOrderDelivered = sendOrderDelivered;
const sendOrderCancelled = (email, name, orderNumber, reason) => sendMail({
    to: email,
    subject: `Order Cancelled: #${orderNumber}`,
    html: baseTemplate(`
      <h2 style="color: #dc2626;">Order Cancelled 😔</h2>
      <p style="color: #475569;">Hi ${name}, your order <strong>#${orderNumber}</strong> has been cancelled.</p>
      <p style="color: #475569;"><strong>Reason:</strong> ${reason}</p>
      <p style="color: #475569;">If a payment was made, your refund will be processed within 5–7 business days.</p>
    `),
});
exports.sendOrderCancelled = sendOrderCancelled;
const sendRefundProcessed = (email, name, orderNumber, amount, refundId) => sendMail({
    to: email,
    subject: `Refund Processed for Order #${orderNumber}`,
    html: baseTemplate(`
      <h2 style="color: #10b981;">Refund Processed! 💰</h2>
      <p style="color: #475569;">Hi ${name}, your refund for order <strong>#${orderNumber}</strong> has been processed.</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Refund Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #334155;"><strong>Refund ID:</strong> ${refundId}</p>
      </div>
      <p style="color: #64748b; font-size: 13px;">It may take 5–7 business days to reflect in your account depending on your bank.</p>
    `),
});
exports.sendRefundProcessed = sendRefundProcessed;
const sendPasswordReset = (email, name, resetUrl) => sendMail({
    to: email,
    subject: 'Password Reset Request | Quick Solutions For U',
    html: baseTemplate(`
      <h2 style="color: #1e293b;">Reset Your Password</h2>
      <p style="color: #475569;">Hi ${name}, we received a request to reset your password.</p>
      <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Reset Password</a>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">This link expires in 15 minutes. If you didn't request this, please ignore this email.</p>
    `),
});
exports.sendPasswordReset = sendPasswordReset;
const sendAbandonedCartReminder = (email, name) => sendMail({
    to: email,
    subject: 'You left something in your cart! 🛒',
    html: baseTemplate(`
      <h2 style="color: #1e293b;">Hey ${name}, your cart misses you! 🛒</h2>
      <p style="color: #475569;">You left some items in your cart. Complete your purchase before they sell out!</p>
      <a href="${process.env.FRONTEND_URL}/cart" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">Return to Cart</a>
    `),
});
exports.sendAbandonedCartReminder = sendAbandonedCartReminder;
