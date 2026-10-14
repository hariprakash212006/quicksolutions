"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCategoryImages = exports.seedDatabase = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const Category_1 = __importDefault(require("../models/Category"));
const Product_1 = __importDefault(require("../models/Product"));
const Coupon_1 = __importDefault(require("../models/Coupon"));
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quicksolutionsforu';
const seedDatabase = async () => {
    try {
        // ── Guard: Only seed if the database is empty ─────────────────────────────
        const existingAdmin = await User_1.default.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('[Seeder] Database already seeded. Skipping.');
            return;
        }
        console.log('Seeding Database for Quick Solutions For U...');
        // 1. Admin User & Customer User
        const adminPassword = await bcryptjs_1.default.hash('Admin@12345', 10);
        const userPassword = await bcryptjs_1.default.hash('Customer@123', 10);
        await User_1.default.deleteMany({});
        const admin = await User_1.default.create({
            name: 'Quick Solutions Admin',
            email: 'admin@quicksolutionsforu.in',
            password: adminPassword,
            phone: '+91 98765 43210',
            role: 'admin',
            addresses: [
                {
                    fullName: 'Quick Solutions Head Office',
                    phone: '+91 98765 43210',
                    addressLine: 'Plot 42, Tech Park, Main Ring Road',
                    landmark: 'Near Metro Pillar 120',
                    city: 'New Delhi',
                    state: 'Delhi',
                    pincode: '110001',
                    isDefault: true,
                },
            ],
        });
        await User_1.default.create({
            name: 'Rahul Sharma',
            email: 'customer@example.com',
            password: userPassword,
            phone: '+91 99887 76655',
            role: 'customer',
            addresses: [
                {
                    fullName: 'Rahul Sharma',
                    phone: '+91 99887 76655',
                    addressLine: 'B-402, Sunshine Heights, Sector 62',
                    city: 'Noida',
                    state: 'Uttar Pradesh',
                    pincode: '201301',
                    isDefault: true,
                },
            ],
        });
        // 2. Categories
        await Category_1.default.deleteMany({});
        const cctvCat = await Category_1.default.create({
            name: 'CCTV & Security Cameras',
            slug: 'cctv-security',
            description: 'High-definition 4K, Smart IP, Dome, Bullet & Wireless Wi-Fi Security Cameras',
            image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
            status: 'active',
        });
        const dvrCat = await Category_1.default.create({
            name: 'DVR / NVR Systems',
            slug: 'dvr-nvr-systems',
            description: '4, 8, 16 & 32 Channel Ultra-HD Digital & Network Video Recorders',
            image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
            status: 'active',
        });
        const roCat = await Category_1.default.create({
            name: 'Water Purifiers & RO Systems',
            slug: 'water-purifiers-ro',
            description: 'Multi-stage RO + UV + UF + Copper Alkaline mineral water purifiers',
            image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
            status: 'active',
        });
        const accCat = await Category_1.default.create({
            name: 'Security & RO Accessories',
            slug: 'accessories',
            description: 'CCTV Power Supplies, Cables, Hard Drives, RO Filters & Membranes',
            image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&auto=format&fit=crop&q=80',
            status: 'active',
        });
        const serviceCat = await Category_1.default.create({
            name: 'Installation & AMC Services',
            slug: 'installation-services',
            description: 'Doorstep CCTV cabling setup, RO filter servicing & Annual Maintenance Contracts',
            image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
            status: 'active',
        });
        // 3. Products
        await Product_1.default.deleteMany({});
        await Product_1.default.create([
            {
                name: 'CP Plus 5MP Smart Full-Color Night Vision Bullet Camera',
                slug: 'cp-plus-5mp-smart-full-color-bullet-camera',
                SKU: 'CP-UNC-TA50L2-V2',
                category: cctvCat._id,
                brand: 'CP Plus',
                mrp: 4500,
                sellingPrice: 2850,
                discount: 36,
                gst: 18,
                hsn: '85258090',
                stock: 35,
                lowStockThreshold: 5,
                images: [
                    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&auto=format&fit=crop&q=80',
                ],
                shortDescription: '5MP HD lens, 30m Full Color warm light night vision, IP67 weatherproof outdoor bullet camera.',
                description: 'CP Plus Guard-Plus series offers 5MP crystal-clear video clarity with dual-light full-color night vision. Features built-in microphone for audio recording and motion detection alert technology.',
                specifications: {
                    Resolution: '5 Megapixel (2880 x 1620)',
                    'Lens Type': '3.6mm Fixed Lens',
                    'Night Vision': 'Full Color Warm Light up to 30 Meters',
                    Weatherproof: 'IP67 Rated Metal Housing',
                    Audio: 'Built-in High Sensitivity Mic',
                },
                features: [
                    '5MP High Definition Resolution',
                    '24/7 Full-Color Night Vision',
                    'Weatherproof IP67 Metal Body',
                    'Smart Motion Human Detection',
                ],
                warranty: '2 Years Manufacturer Warranty',
                featured: true,
                bestSeller: true,
                averageRating: 4.8,
                numOfReviews: 24,
            },
            {
                name: 'Hikvision AcuSense 4MP ColorVu Outdoor Dome IP Camera',
                slug: 'hikvision-acusense-4mp-colorvu-dome-camera',
                SKU: 'DS-2CD2147G2-USU',
                category: cctvCat._id,
                brand: 'Hikvision',
                mrp: 6800,
                sellingPrice: 4299,
                discount: 37,
                gst: 18,
                hsn: '85258090',
                stock: 18,
                lowStockThreshold: 4,
                images: [
                    'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&auto=format&fit=crop&q=80',
                ],
                shortDescription: 'ColorVu 24/7 vivid color imaging, AcuSense AI false alarm reduction for humans & vehicles.',
                description: 'Hikvision ColorVu technology provides 24/7 vivid colorful images with F1.0 advanced lenses and high performance sensors. AcuSense AI classifies human and vehicle targets from other moving objects.',
                specifications: {
                    Resolution: '4 Megapixel (2688 × 1520)',
                    Aperture: 'F1.0 Super-Aperture Lens',
                    Technology: 'Hikvision AcuSense AI & ColorVu',
                    Audio: 'Built-in Mic with Noise Filter',
                },
                features: [
                    'F1.0 Super Aperture for Ultra Low-Light',
                    'AI Deep Learning Human & Vehicle Classification',
                    'H.265+ Video Compression Format',
                ],
                warranty: '2 Years Replacement Warranty',
                featured: true,
                bestSeller: true,
                averageRating: 4.9,
                numOfReviews: 41,
            },
            {
                name: 'CP Plus 8 Channel 1080P Full HD DVR (Digital Video Recorder)',
                slug: 'cp-plus-8-channel-1080p-full-hd-dvr',
                SKU: 'CP-UVR-0801E1-CS',
                category: dvrCat._id,
                brand: 'CP Plus',
                mrp: 5500,
                sellingPrice: 3499,
                discount: 36,
                gst: 18,
                hsn: '85219090',
                stock: 12,
                lowStockThreshold: 3,
                images: [
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
                ],
                shortDescription: 'Supports up to 8 BNC cameras + 4 IP cameras, H.265+ encoding, 1 SATA port up to 10TB.',
                description: 'CP Plus 8-Channel DVR supports HDCVI/AHD/TVI/CVBS/IP auto-detection input. Easily connect to mobile app (gCMOB) for live viewing anywhere in the world.',
                specifications: {
                    Channels: '8 Channel BNC + 4 Channel IP',
                    'Storage Support': '1 SATA Port up to 10TB HDD',
                    Output: 'HDMI & VGA Simultaneous Output',
                    MobileApp: 'gCMOB (Android & iOS)',
                },
                features: [
                    'H.265+ Dual-stream video compression',
                    'Support HDCVI/AHD/TVI/CVBS/IP video inputs',
                    'Long transmission distance over coax cable',
                ],
                warranty: '2 Years Warranty',
                featured: false,
                bestSeller: true,
                averageRating: 4.7,
                numOfReviews: 19,
            },
            {
                name: 'Aqua Fresh Grand 14-Stage RO + UV + UF + Copper Alkaline Water Purifier',
                slug: 'aqua-fresh-grand-14-stage-ro-purifier',
                SKU: 'AF-GRAND-COPPER-RO',
                category: roCat._id,
                brand: 'Aqua Fresh',
                mrp: 14500,
                sellingPrice: 6999,
                discount: 51,
                gst: 18,
                hsn: '84212190',
                stock: 22,
                lowStockThreshold: 5,
                images: [
                    'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&auto=format&fit=crop&q=80',
                ],
                shortDescription: '12 Liter Storage Capacity, Active Copper Alkaline mineral charger, 100 GPD High-Flow Booster Pump.',
                description: 'Fully automated 14-stage purification process removes TDS up to 2000 ppm. Infuses active copper ions and essential minerals for healthy alkaline drinking water.',
                specifications: {
                    Capacity: '12 Liters Transparent Tank',
                    Purification: 'RO + UV + UF + TDS Controller + Active Copper Filter',
                    'TDS Limit': 'Suitable for borewell, tanker & municipal tap water up to 2000 ppm',
                    'Purification Rate': 'Up to 15 Liters per hour',
                },
                features: [
                    'Active Copper Alkaline Mineral infusion',
                    'Auto shut-off when tank is full',
                    'Food grade ABS unbreakable transparent body',
                    'Includes Free Installation Kit & Sediment pre-filter',
                ],
                warranty: '1 Year Full Electrical Component Warranty',
                featured: true,
                bestSeller: true,
                averageRating: 4.8,
                numOfReviews: 53,
            },
            {
                name: 'Seagate SkyHawk 2TB Surveillance Hard Drive (ST2000VX015)',
                slug: 'seagate-skyhawk-2tb-surveillance-hard-drive',
                SKU: 'ST2000VX015',
                category: accCat._id,
                brand: 'Seagate',
                mrp: 6200,
                sellingPrice: 4799,
                discount: 22,
                gst: 18,
                hsn: '84717020',
                stock: 40,
                lowStockThreshold: 8,
                images: [
                    'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&auto=format&fit=crop&q=80',
                ],
                shortDescription: 'Engineered specifically for 24x7 DVR/NVR surveillance workloads with ImagePerfect firmware.',
                description: 'Built for always-on 24/7 video security systems. SkyHawk ImagePerfect firmware minimizes dropped frames and downtime while supporting up to 64 HD cameras.',
                specifications: {
                    Capacity: '2 TB',
                    FormFactor: '3.5-inch SATA 6Gb/s',
                    Workload: '180 TB/year workload rating',
                    Cache: '256 MB',
                },
                features: [
                    'Optimized for 24/7 DVR & NVR Recording',
                    'Supports up to 64 simultaneous HD cameras',
                    '3-Year Rescue Data Recovery Services included',
                ],
                warranty: '3 Years Seagate Warranty',
                featured: false,
                bestSeller: true,
                averageRating: 4.9,
                numOfReviews: 88,
            },
            {
                name: 'Complete 4-Camera CCTV Cabling & Doorstep Installation Package',
                slug: '4-camera-cctv-installation-service-package',
                SKU: 'SVC-CCTV-4CAM-INST',
                category: serviceCat._id,
                brand: 'Quick Solutions Service',
                mrp: 3500,
                sellingPrice: 1999,
                discount: 42,
                gst: 18,
                hsn: '9987',
                stock: 99,
                lowStockThreshold: 10,
                images: [
                    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
                ],
                shortDescription: 'Professional mounting, BNC connector wiring, DVR configuration & mobile app remote setup.',
                description: 'Get your complete 4-camera security system installed by certified technicians. Includes camera physical mounting, cable clipping/casing, power adapter connections, DVR setup, and mobile phone remote view configuration.',
                specifications: {
                    Coverage: 'Up to 4 Cameras & 1 DVR unit',
                    Inclusions: 'Mounting, BNC & DC connector crimping, Router mobile sync',
                    Technician: 'Certified Field Engineers',
                    ServiceArea: 'Delhi, Noida, Gurgaon, Ghaziabad & Faridabad',
                },
                features: [
                    'Doorstep professional service within 24 hours',
                    'Clean cabling and channel casing setup',
                    'Live mobile application pairing on your Android/iPhone',
                ],
                warranty: '30 Days Service Guarantee',
                featured: true,
                bestSeller: false,
                averageRating: 4.9,
                numOfReviews: 15,
            },
        ]);
        // 4. Coupons
        await Coupon_1.default.deleteMany({});
        await Coupon_1.default.create([
            {
                code: 'WELCOME10',
                discountType: 'percentage',
                discountValue: 10,
                minOrderValue: 1500,
                maxDiscountAmount: 500,
                expiryDate: new Date('2027-12-31'),
                isActive: true,
            },
            {
                code: 'QUICK500',
                discountType: 'flat',
                discountValue: 500,
                minOrderValue: 5000,
                expiryDate: new Date('2027-12-31'),
                isActive: true,
            },
        ]);
        console.log('Database Seeding Completed Successfully!');
    }
    catch (error) {
        console.error('Database Seeding Error:', error);
    }
};
exports.seedDatabase = seedDatabase;
const syncCategoryImages = async () => {
    try {
        const categoryUpdates = [
            {
                slug: 'cctv-security',
                name: 'CCTV & Security Cameras',
                image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
                description: 'High-definition 4K, Smart IP, Dome, Bullet & Wireless Wi-Fi Security Cameras',
            },
            {
                slug: 'water-purifiers-ro',
                name: 'Water Purifiers & RO Systems',
                image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=80',
                description: 'Multi-stage RO + UV + UF + Copper Alkaline mineral water purifiers',
            },
            {
                slug: 'dvr-nvr-systems',
                name: 'DVR / NVR Systems',
                image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
                description: '4, 8, 16 & 32 Channel Ultra-HD Digital & Network Video Recorders',
            },
            {
                slug: 'accessories',
                name: 'Security & RO Accessories',
                image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=800&auto=format&fit=crop&q=80',
                description: 'CCTV Power Supplies, Cables, Hard Drives, RO Filters & Membranes',
            },
            {
                slug: 'installation-services',
                name: 'Installation & AMC Services',
                image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
                description: 'Doorstep CCTV cabling setup, RO filter servicing & Annual Maintenance Contracts',
            },
        ];
        for (const cat of categoryUpdates) {
            await Category_1.default.findOneAndUpdate({ slug: cat.slug }, {
                $set: {
                    name: cat.name,
                    image: cat.image,
                    description: cat.description,
                    status: 'active'
                }
            }, { upsert: true, new: true });
        }
        console.log('[Categories] Verified and synced authentic category images in database.');
    }
    catch (err) {
        console.error('[Categories] Sync error:', err);
    }
};
exports.syncCategoryImages = syncCategoryImages;
