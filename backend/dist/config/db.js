"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quicksolutionsforu';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
const connectDB = async () => {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            attempt++;
            console.log(`[DB] Connection attempt ${attempt}/${MAX_RETRIES}...`);
            await mongoose_1.default.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
            console.log(`[DB] ✅ MongoDB connected: ${mongoose_1.default.connection.host}`);
            return;
        }
        catch (err) {
            console.error(`[DB] ❌ Connection failed (attempt ${attempt}): ${err.message}`);
            if (attempt >= MAX_RETRIES) {
                console.error('[DB] All connection attempts failed. Exiting process.');
                process.exit(1);
            }
            console.log(`[DB] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
    }
};
exports.connectDB = connectDB;
mongoose_1.default.connection.on('disconnected', () => console.warn('[DB] ⚠️  MongoDB disconnected.'));
mongoose_1.default.connection.on('reconnected', () => console.log('[DB] ✅ MongoDB reconnected.'));
