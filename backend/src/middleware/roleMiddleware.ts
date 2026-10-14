import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorMiddleware';

type Role = 'customer' | 'staff' | 'admin';

/**
 * Middleware to restrict access to specific roles.
 * Usage: router.use(requireRole('admin')) or router.use(requireRole('admin', 'staff'))
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    if (!roles.includes(user.role as Role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${user.role}`,
          403
        )
      );
    }

    next();
  };
};
