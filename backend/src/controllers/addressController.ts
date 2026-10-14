import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorMiddleware';

// ── Get All Addresses ─────────────────────────────────────────────────────────

export const getAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new AppError('User not found.', 404);
  res.json({ success: true, addresses: user.addresses });
});

// ── Add Address ───────────────────────────────────────────────────────────────

export const addAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new AppError('User not found.', 404);

  const { label, fullName, phone, addressLine, landmark, city, state, pincode, isDefault } = req.body;

  // If this is set as default, clear others
  if (isDefault) user.addresses.forEach((a) => (a.isDefault = false));

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

export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new AppError('User not found.', 404);

  const address = (user.addresses as any).id(req.params.addressId);
  if (!address) throw new AppError('Address not found.', 404);

  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));

  Object.assign(address, req.body);
  await user.save();

  res.json({ success: true, addresses: user.addresses });
});

// ── Delete Address ────────────────────────────────────────────────────────────

export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new AppError('User not found.', 404);

  const address = (user.addresses as any).id(req.params.addressId);
  if (!address) throw new AppError('Address not found.', 404);

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

export const setDefaultAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new AppError('User not found.', 404);

  user.addresses.forEach((a) => (a.isDefault = a._id?.toString() === req.params.addressId));

  const found = user.addresses.find((a) => a.isDefault);
  if (!found) throw new AppError('Address not found.', 404);

  await user.save();
  res.json({ success: true, addresses: user.addresses });
});
