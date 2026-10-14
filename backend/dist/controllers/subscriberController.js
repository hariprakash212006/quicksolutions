"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeEmail = void 0;
const Subscriber_1 = __importDefault(require("../models/Subscriber"));
const subscribeEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }
        const existing = await Subscriber_1.default.findOne({ email });
        if (existing) {
            res.status(200).json({ success: true, message: 'Already subscribed' });
            return;
        }
        await Subscriber_1.default.create({ email });
        res.status(201).json({ success: true, message: 'Successfully subscribed' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.subscribeEmail = subscribeEmail;
