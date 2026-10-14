"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = exports.xssSanitizeMiddleware = exports.sanitizeValue = exports.sanitizeString = exports.escapeRegex = void 0;
/**
 * Escapes special characters for use in regular expressions to prevent ReDoS
 * and MongoDB regex syntax injection attacks.
 */
const escapeRegex = (str) => {
    if (typeof str !== 'string')
        return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
exports.escapeRegex = escapeRegex;
/**
 * Sanitizes a single string by stripping dangerous scripts, event attributes,
 * javascript: protocol, and poison null bytes to prevent XSS.
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string')
        return str;
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
exports.sanitizeString = sanitizeString;
/**
 * Recursively sanitizes objects and arrays.
 */
const sanitizeValue = (val) => {
    if (typeof val === 'string') {
        return (0, exports.sanitizeString)(val);
    }
    if (Array.isArray(val)) {
        return val.map(exports.sanitizeValue);
    }
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        const cleaned = {};
        for (const key of Object.keys(val)) {
            // Prevent prototype pollution
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            cleaned[key] = (0, exports.sanitizeValue)(val[key]);
        }
        return cleaned;
    }
    return val;
};
exports.sanitizeValue = sanitizeValue;
/**
 * Express middleware that automatically sanitizes incoming request body, query, and params.
 */
const xssSanitizeMiddleware = (req, _res, next) => {
    if (req.body) {
        req.body = (0, exports.sanitizeValue)(req.body);
    }
    if (req.query) {
        req.query = (0, exports.sanitizeValue)(req.query);
    }
    if (req.params) {
        req.params = (0, exports.sanitizeValue)(req.params);
    }
    next();
};
exports.xssSanitizeMiddleware = xssSanitizeMiddleware;
/**
 * Validates and provides the JWT signing secret.
 * Enforces production safety checks so weak default secrets are blocked in production.
 */
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'change_this_secret_in_production' || secret === 'change_this_in_production') {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CRITICAL SECURITY ERROR: Strong JWT_SECRET must be configured in production environment variables.');
        }
        return 'quick_solutions_dev_secure_jwt_secret_key_2026_9876543210';
    }
    return secret;
};
exports.getJwtSecret = getJwtSecret;
