"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CMSConfigSchema = new mongoose_1.Schema({
    announcementBar: {
        text: { type: String, default: "Free Express Delivery on Orders Over 12,000 across India!" },
        link: { type: String, default: "/shop" },
        active: { type: Boolean, default: true },
    },
    heroBanners: [
        {
            title: { type: String, required: true },
            subtitle: { type: String, required: true },
            image: { type: String, required: true },
            ctaText: { type: String, default: "Shop Now" },
            ctaLink: { type: String, default: "/shop" },
            warpSettings: {
                color: { type: String, default: "#ffffff" },
                warpStrength: { type: Number, default: 0.08 },
                warpScale: { type: Number, default: 1.7 },
                speed: { type: Number, default: 0.55 },
                pointerInfluence: { type: Number, default: 0.42 },
                pointerStrength: { type: Number, default: 0.38 },
                refraction: { type: Number, default: 0.018 },
                fontSize: { type: String, default: "clamp(2rem, 8vw, 4.5rem)" },
            }
        },
    ],
    promoBanner: {
        active: { type: Boolean, default: true },
        badge: { type: String, default: "FLASH SALE • LIMITED TIME" },
        title: { type: String, default: "Mega Savings on CCTV Security Systems & Alkaline RO Purifiers" },
        description: { type: String, default: "Get complete security cabling, DVR setup & 14-stage RO installation at your doorstep with certified technicians." },
        image: { type: String, default: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1000&auto=format&fit=crop&q=80" },
        ctaText: { type: String, default: "Shop Promotional Deals" },
        ctaLink: { type: String, default: "/shop" },
        couponCode: { type: String, default: "QUICK500" },
        discountTag: { type: String, default: "FLAT ₹500 OFF" },
        countdownHours: { type: Number, default: 24 },
        endTime: { type: Date },
        features: { type: [String], default: ["Free Onsite Inspection", "Same-Day Dispatch Across India", "2 Years Official Warranty"] },
        warpSettings: {
            color: { type: String, default: "#ffffff" },
            warpStrength: { type: Number, default: 0.06 },
            warpScale: { type: Number, default: 1.5 },
            speed: { type: Number, default: 0.4 },
            pointerInfluence: { type: Number, default: 0.3 },
            pointerStrength: { type: Number, default: 0.2 },
            refraction: { type: Number, default: 0.015 },
            fontSize: { type: String, default: "clamp(1.8rem, 6vw, 3.5rem)" },
        }
    },
    dealOfTheDay: {
        active: { type: Boolean, default: true },
        badge: { type: String, default: 'Deal of the Day' },
        title: { type: String, default: 'CP Plus 4MP Smart Wi-Fi PTZ Camera' },
        subtitle: { type: String, default: '360° Vision, Color Night Vision, Two-Way Audio. Secure your home instantly with AI motion tracking.' },
        productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
        productSlug: { type: String, default: '' },
        originalPrice: { type: Number, default: 4999 },
        dealPrice: { type: Number, default: 2499 },
        discountPercentage: { type: Number, default: 50 },
        image: { type: String, default: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600' },
        endTime: { type: Date },
        ctaText: { type: String, default: 'Grab the Deal' },
        ctaLink: { type: String, default: '/shop' },
    },
    trustPoints: [
        {
            icon: { type: String, required: true },
            title: { type: String, required: true },
            description: { type: String, required: true },
        },
    ],
    faqs: [
        {
            question: { type: String, required: true },
            answer: { type: String, required: true },
            category: { type: String, default: 'General' },
        },
    ],
    businessInfo: {
        name: { type: String, default: 'Quick Solutions For U' },
        domain: { type: String, default: 'quicksolutionsforu.in' },
        phone: { type: String, default: '+91 98765 43210' },
        email: { type: String, default: 'support@quicksolutionsforu.in' },
        whatsapp: { type: String, default: '+91 98765 43210' },
        address: { type: String, default: 'Plot 42, Tech Park, Main Ring Road, New Delhi 110001' },
        gstin: { type: String, default: '07AAAAA0000A1Z5' },
        footerText: { type: String, default: 'Quick Solutions For U is India’s authorized dealer & distributor of Hikvision, CP Plus, Dahua CCTV cameras & Copper RO Water Purifiers.' },
    },
    shippingConfig: {
        allProductsFreeShipping: { type: Boolean, default: false },
        freeShippingThreshold: { type: Number, default: 2000 },
        defaultShippingFee: { type: Number, default: 99 },
        enabled: { type: Boolean, default: true },
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model('CMSConfig', CMSConfigSchema);
