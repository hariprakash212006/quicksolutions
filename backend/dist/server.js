"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_1 = require("./config/db");
const api_1 = __importDefault(require("./routes/api"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const seeder_1 = require("./utils/seeder");
const abandonedCartJob_1 = require("./jobs/abandonedCartJob");
const security_1 = require("./utils/security");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// ── Security Headers & Protection ─────────────────────────────────────────────
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://checkout.razorpay.com',
                'https://accounts.google.com',
                'https://apis.google.com',
            ],
            frameSrc: [
                "'self'",
                'https://api.razorpay.com',
                'https://checkout.razorpay.com',
                'https://accounts.google.com',
            ],
            connectSrc: [
                "'self'",
                'https://api.razorpay.com',
                'https://checkout.razorpay.com',
                'https://accounts.google.com',
                'https://www.googleapis.com',
            ],
            imgSrc: ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://*.googleusercontent.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
// Custom security headers
app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.removeHeader('X-Powered-By');
    next();
});
// NoSQL Injection sanitizer
app.use((0, express_mongo_sanitize_1.default)());
// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS: Origin ${origin} not allowed.`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
// ── General API Rate Limiter ──────────────────────────────────────────────────
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', globalLimiter);
// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
// ── Body Parsing & Input Sanitization ─────────────────────────────────────────
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '2mb' }));
app.use(security_1.xssSanitizeMiddleware);
// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// ── Healthcheck ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Quick Solutions For U Backend API',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
    });
});
// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', api_1.default);
// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});
// ── Global Error Middleware ───────────────────────────────────────────────────
app.use(errorMiddleware_1.errorMiddleware);
// ── Start Server ──────────────────────────────────────────────────────────────
const startServer = async () => {
    await (0, db_1.connectDB)(); // Fail fast if DB unreachable
    await (0, seeder_1.seedDatabase)();
    await (0, seeder_1.syncCategoryImages)();
    app.listen(PORT, () => {
        console.log(`\n🚀 Quick Solutions For U API v2.0`);
        console.log(`   URL:  http://localhost:${PORT}`);
        console.log(`   Mode: ${process.env.NODE_ENV || 'development'}\n`);
    });
    // Start background jobs
    (0, abandonedCartJob_1.startAbandonedCartJob)();
};
startServer();
