import { Request, Response, NextFunction } from 'express';

/**
 * Escapes special characters for use in regular expressions to prevent ReDoS
 * and MongoDB regex syntax injection attacks.
 */
export const escapeRegex = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitizes a single string by stripping dangerous scripts, event attributes,
 * javascript: protocol, and poison null bytes to prevent XSS.
 */
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\0/g, '') // Strip null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Strip script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Strip iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Strip object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Strip embed tags
    .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '') // Strip inline event handlers (onclick, onerror, onload)
    .replace(/javascript\s*:/gi, '') // Strip javascript: URIs
    .replace(/data\s*:\s*text\/html/gi, '') // Strip data:text/html
    .trim();
};

/**
 * Recursively sanitizes objects and arrays.
 */
export const sanitizeValue = (val: any): any => {
  if (typeof val === 'string') {
    return sanitizeString(val);
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleaned[key] = sanitizeValue(val[key]);
    }
    return cleaned;
  }
  return val;
};

/**
 * Express middleware that automatically sanitizes incoming request body, query, and params.
 */
export const xssSanitizeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};

/**
 * Validates and provides the JWT signing secret.
 * Enforces production safety checks so weak default secrets are blocked in production.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'change_this_secret_in_production' || secret === 'change_this_in_production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: Strong JWT_SECRET must be configured in production environment variables.');
    }
    return 'quick_solutions_dev_secure_jwt_secret_key_2026_9876543210';
  }
  return secret;
};
