import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AppError } from './errorMiddleware';
import { getJwtSecret } from '../utils/security';

export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Protect middleware — verifies JWT and attaches user to req.
 * No mock fallback. Fails fast if DB is down.
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    next(new AppError('Authentication required. Please log in.', 401));
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      next(new AppError('The account associated with this token no longer exists.', 401));
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
};

/**
 * Legacy alias kept for backward compatibility with any remaining adminOnly usage.
 * Prefer requireRole('admin') from roleMiddleware for new routes.
 */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    next(new AppError('Access denied. Admin privileges required.', 403));
  }
};
