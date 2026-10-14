export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status: 'active' | 'inactive';
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  SKU: string;
  category: Category | string;
  subcategory?: string;
  brand: string;
  mrp: number;
  sellingPrice: number;
  discount: number;
  gst: number;
  hsn: string;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  shortDescription: string;
  description: string;
  specifications: Record<string, string>;
  features: string[];
  warranty: string;
  installationDetails?: string;
  shippingInformation?: string;
  returnPolicy?: string;
  tags: string[];
  featured: boolean;
  bestSeller: boolean;
  status: 'published' | 'draft' | 'archived';
  averageRating: number;
  numOfReviews: number;
  isCODEnabled?: boolean;
  isReturnable?: boolean;
  deliveryCharge?: number;
  freeDeliveryAbove?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  addresses: Address[];
}

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: User | string;
  orderItems: OrderItem[];
  shippingAddress: Address;
  paymentMethod: 'UPI' | 'Card' | 'NetBanking' | 'Wallet' | 'COD';
  paymentInfo: {
    status: 'Pending' | 'Paid' | 'Failed';
    id?: string;
  };
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  couponDiscount: number;
  totalPrice: number;
  orderStatus:
    | 'Pending'
    | 'Payment Pending'
    | 'Confirmed'
    | 'Processing'
    | 'Packed'
    | 'Shipped'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled'
    | 'Refunded';
  trackingNumber?: string;
  courierPartner?: string;
  createdAt: string;
}

export interface WarpSettings {
  color: string;
  warpStrength: number;
  warpScale: number;
  speed: number;
  pointerInfluence: number;
  pointerStrength: number;
  refraction: number;
  fontSize: string;
}

export interface CMSConfig {
  announcementBar?: {
    text: string;
    link?: string;
    active: boolean;
  };
  heroBanners: Array<{
    title: string;
    subtitle: string;
    image: string;
    warpSettings?: WarpSettings;
    ctaText: string;
    ctaLink: string;
  }>;
  promoBanner?: {
    active?: boolean;
    badge: string;
    title: string;
    description: string;
    image: string;
    warpSettings?: WarpSettings;
    ctaText: string;
    ctaLink: string;
    couponCode?: string;
    discountTag?: string;
    countdownHours?: number;
    endTime?: string;
    features?: string[];
  };
  trustPoints: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    category: string;
  }>;
  businessInfo: {
    name: string;
    domain: string;
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
    gstin?: string;
    footerText?: string;
  };
  shippingConfig?: ShippingConfig;
}

export interface ShippingConfig {
  allProductsFreeShipping: boolean;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  enabled: boolean;
}


