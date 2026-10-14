"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.getAddresses = void 0;
const User_1 = __importDefault(require("../models/User"));
const errorMiddleware_1 = require("../middleware/errorMiddleware");
// ── Get All Addresses ─────────────────────────────────────────────────────────
exports.getAddresses = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user?._id);
    if (!user)
        throw new errorMiddleware_1.AppError('User not found.', 404);
    res.json({ success: true, addresses: user.addresses });
});
// ── Add Address ───────────────────────────────────────────────────────────────
exports.addAddress = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user?._id);
    if (!user)
        throw new errorMiddleware_1.AppError('User not found.', 404);
    const { label, fullName, phone, addressLine, landmark, city, state, pincode, isDefault } = req.body;
    // If this is set as default, clear others
    if (isDefault)
        user.addresses.forEach((a) => (a.isDefault = false));
    user.addresses.push({
        label: label || 'Home',
        fullName,
        phone,
        addressLine,
        landmark,
        city,
        state,
        pincode,
        isDefault: isDefault || user.addresses.length === 0, // first address is default
    });
    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
});
// ── Update Address ────────────────────────────────────────────────────────────
exports.updateAddress = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user?._id);
    if (!user)
        throw new errorMiddleware_1.AppError('User not found.', 404);
    const address = user.addresses.id(req.params.addressId);
    if (!address)
        throw new errorMiddleware_1.AppError('Address not found.', 404);
    if (req.body.isDefault)
        user.addresses.forEach((a) => (a.isDefault = false));
    Object.assign(address, req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
});
// ── Delete Address ────────────────────────────────────────────────────────────
exports.deleteAddress = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user?._id);
    if (!user)
        throw new errorMiddleware_1.AppError('User not found.', 404);
    const address = user.addresses.id(req.params.addressId);
    if (!address)
        throw new errorMiddleware_1.AppError('Address not found.', 404);
    const wasDefault = address.isDefault;
    address.deleteOne();
    // Auto-promote another address to default if default was deleted
    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }
    await user.save();
    res.json({ success: true, addresses: user.addresses });
});
// ── Set Default Address ────────────────────────────────────────────────────────
exports.setDefaultAddress = (0, errorMiddleware_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.user?._id);
    if (!user)
        throw new errorMiddleware_1.AppError('User not found.', 404);
    user.addresses.forEach((a) => (a.isDefault = a._id?.toString() === req.params.addressId));
    const found = user.addresses.find((a) => a.isDefault);
    if (!found)
        throw new errorMiddleware_1.AppError('Address not found.', 404);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
});
