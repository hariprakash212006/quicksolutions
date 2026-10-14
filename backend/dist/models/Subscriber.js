"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const subscriberSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] },
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});
exports.default = mongoose_1.default.model('Subscriber', subscriberSchema);
