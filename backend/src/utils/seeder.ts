import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import CMSConfig from '../models/CMSConfig';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quicksolutionsforu';

export const seedDatabase = async () => {
  try {
    // ── Guard: Only seed if the database is empty ─────────────────────────────
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('[Seeder] Database already seeded. Skipping.');
      return;
    }

    console.log('Seeding Database for Quick Solutions For U...');

    // 1. Admin User & Customer User
    const adminPassword = await bcrypt.hash('Admin@12345', 10);
    const userPassword = await bcrypt.hash('Customer@123', 10);

    await User.deleteMany({});
    const admin = await User.create({
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

    await User.create({
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
    await Category.deleteMany({});
    const cctvCat = await Category.create({
      name: 'CCTV & Security Cameras',
      slug: 'cctv-security',
      description: 'High-definition 4K, Smart IP, Dome, Bullet & Wireless Wi-Fi Security Cameras',
      image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
      status: 'active',
    });

    const dvrCat = await Category.create({
      name: 'DVR / NVR Systems',
      slug: 'dvr-nvr-systems',
      description: '4, 8, 16 & 32 Channel Ultra-HD Digital & Network Video Recorders',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      status: 'active',
    });

    const roCat = await Category.create({
      name: 'Water Purifiers & RO Systems',
      slug: 'water-purifiers-ro',
      description: 'Multi-stage RO + UV + UF + Copper Alkaline mineral water purifiers',
      image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80',
      status: 'active',
    });

    const accCat = await Category.create({
      name: 'Security & RO Accessories',
      slug: 'accessories',
      description: 'CCTV Power Supplies, Cables, Hard Drives, RO Filters & Membranes',
      image: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&auto=format&fit=crop&q=80',
      status: 'active',
    });

    const serviceCat = await Category.create({
      name: 'Installation & AMC Services',
      slug: 'installation-services',
      description: 'Doorstep CCTV cabling setup, RO filter servicing & Annual Maintenance Contracts',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
      status: 'active',
    });

    const solarCat = await Category.create({
      name: 'Solar Panels & Systems',
      slug: 'solar-panels',
      description: 'Monocrystalline & Polycrystalline Solar Panels, On-Grid/Off-Grid Inverters & Rooftop Solar Kits',
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=80',
      status: 'active',
    });

    // 3. Products
    await Product.deleteMany({});
    await Product.create([
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
        description:
          'CP Plus Guard-Plus series offers 5MP crystal-clear video clarity with dual-light full-color night vision. Features built-in microphone for audio recording and motion detection alert technology.',
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
        description:
          'Hikvision ColorVu technology provides 24/7 vivid colorful images with F1.0 advanced lenses and high performance sensors. AcuSense AI classifies human and vehicle targets from other moving objects.',
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
        description:
          'CP Plus 8-Channel DVR supports HDCVI/AHD/TVI/CVBS/IP auto-detection input. Easily connect to mobile app (gCMOB) for live viewing anywhere in the world.',
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
        description:
          'Fully automated 14-stage purification process removes TDS up to 2000 ppm. Infuses active copper ions and essential minerals for healthy alkaline drinking water.',
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
        description:
          'Built for always-on 24/7 video security systems. SkyHawk ImagePerfect firmware minimizes dropped frames and downtime while supporting up to 64 HD cameras.',
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
        description:
          'Get your complete 4-camera security system installed by certified technicians. Includes camera physical mounting, cable clipping/casing, power adapter connections, DVR setup, and mobile phone remote view configuration.',
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
      {
        name: 'Waaree 550W Mono PERC Half-Cut Solar Panel',
        slug: 'waaree-550w-mono-perc-solar-panel',
        SKU: 'WR-550-MONO-HC',
        category: solarCat._id,
        brand: 'Waaree',
        mrp: 18500,
        sellingPrice: 14999,
        discount: 19,
        gst: 5,
        hsn: '85414011',
        stock: 25,
        lowStockThreshold: 5,
        images: [
          'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop&q=80',
        ],
        shortDescription: '550W Mono PERC Half-Cut cells with 21.5% efficiency, ideal for residential & commercial rooftop installations.',
        description:
          'Waaree 550W Mono PERC solar panel features half-cut cell technology for superior shade tolerance and higher energy yield. BIS certified, IEC 61215 & IEC 61730 compliant. Perfect for on-grid and off-grid rooftop solar systems.',
        specifications: {
          'Rated Power': '550 Wp',
          'Cell Type': 'Mono PERC Half-Cut (144 Cells)',
          'Efficiency': '21.5%',
          'Dimensions': '2278 × 1134 × 35 mm',
          'Weight': '28.5 kg',
          'Warranty': '25 Years Linear Performance Warranty',
        },
        features: [
          'Half-cut cell technology for better shade performance',
          'Anti-PID, Salt Mist & Ammonia resistant',
          'BIS Certified (IS/IEC 61215 & 61730)',
          'Suitable for On-Grid & Off-Grid installations',
        ],
        warranty: '12 Years Product Warranty + 25 Years Performance Warranty',
        featured: true,
        bestSeller: true,
        averageRating: 4.8,
        numOfReviews: 34,
      },
      {
        name: 'Luminous 3KW On-Grid Solar Inverter with Wi-Fi Monitoring',
        slug: 'luminous-3kw-on-grid-solar-inverter',
        SKU: 'LUM-3KW-ONGRID',
        category: solarCat._id,
        brand: 'Luminous',
        mrp: 42000,
        sellingPrice: 32999,
        discount: 21,
        gst: 12,
        hsn: '85044090',
        stock: 15,
        lowStockThreshold: 3,
        images: [
          'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&auto=format&fit=crop&q=80',
        ],
        shortDescription: '3KW single-phase grid-tied solar inverter with built-in Wi-Fi for real-time generation monitoring via app.',
        description:
          'Luminous NXI 3KW On-Grid Solar Inverter converts DC power from solar panels to AC for home use with net-metering support. Features dual MPPT tracking, IP65 outdoor rating, and built-in Wi-Fi for real-time monitoring through the Luminous Solar app.',
        specifications: {
          'Rated Power': '3 KW',
          'Input Voltage Range': '80V – 500V DC',
          'MPPT Channels': '2 MPPT with 1 string each',
          'Efficiency': '97.6% Peak',
          'Protection': 'IP65 Outdoor Rated',
          'Monitoring': 'Built-in Wi-Fi, Luminous Solar App',
        },
        features: [
          'Dual MPPT for maximum energy harvest',
          'Net metering compatible — sell excess power to grid',
          'IP65 weatherproof for outdoor installation',
          'Real-time monitoring via Luminous Solar mobile app',
        ],
        warranty: '5 Years Comprehensive Warranty',
        featured: true,
        bestSeller: false,
        averageRating: 4.7,
        numOfReviews: 18,
      },
    ]);

    // 4. Coupons
    await Coupon.deleteMany({});
    await Coupon.create([
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
  } catch (error) {
    console.error('Database Seeding Error:', error);
  }
};

export const syncCategoryImages = async () => {
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
      {
        slug: 'solar-panels',
        name: 'Solar Panels & Systems',
        image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop&q=80',
        description: 'Monocrystalline & Polycrystalline Solar Panels, On-Grid/Off-Grid Inverters & Rooftop Solar Kits',
      },
    ];

    for (const cat of categoryUpdates) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { 
          $set: { 
            name: cat.name, 
            image: cat.image, 
            description: cat.description,
            status: 'active' 
          } 
        },
        { upsert: true, new: true }
      );
    }
    console.log('[Categories] Verified and synced authentic category images in database.');
  } catch (err) {
    console.error('[Categories] Sync error:', err);
  }
};

