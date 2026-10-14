import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingCart, ShieldCheck, Truck, CheckCircle2,
  ChevronRight, Share2, MessageCircle, Zap, AlertTriangle, Heart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/product/ProductCard';

import axios from 'axios';
import type { Product } from '../types';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'warranty'>('specs');
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/products/${slug}`);
        if (res.data.success) {
          setProduct(res.data.product);
          setRelated(res.data.relatedProducts || []);
          setActiveImage(res.data.product.images[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-4 rounded-full w-1/4" />
            <div className="skeleton h-8 rounded-xl w-full" />
            <div className="skeleton h-8 rounded-xl w-4/5" />
            <div className="skeleton h-24 rounded-2xl w-full mt-4" />
            <div className="skeleton h-12 rounded-xl w-full mt-6" />
          </div>
        </div>
      </div>
    );
  }

  const savings = product.mrp - product.sellingPrice;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-10 pb-28 md:pb-8">
      <Helmet>
        <title>{product.name} | Quick Solutions For U</title>
        <meta name="description" content={product.description.substring(0, 160)} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description.substring(0, 160)} />
        <meta property="og:image" content={product.images[0]} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": product.images,
            "description": product.description,
            "sku": product.SKU,
            "brand": {
              "@type": "Brand",
              "name": product.brand
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "INR",
              "price": product.sellingPrice,
              "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "itemCondition": "https://schema.org/NewCondition"
            }
          })}
        </script>
      </Helmet>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-brand-600 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-brand-600 transition">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

        {/* ── Gallery ── */}
        <div className="space-y-4">
          {/* Main Image with zoom-on-hover */}
          <motion.div
            className="relative aspect-square bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 flex items-center justify-center shadow-sm overflow-hidden group"
          >
            <motion.img
              key={activeImage}
              src={activeImage}
              alt={product.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500 cursor-zoom-in"
            />
            {product.discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-extrabold px-3 py-1 rounded-full">
                {product.discount}% OFF
              </span>
            )}
            {lowStock && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-amber-500/90 text-white text-xs font-bold px-3 py-2 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
                Only {product.stock} units left in stock!
              </div>
            )}
          </motion.div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 shrink-0 rounded-xl bg-white dark:bg-slate-900 border-2 p-2 transition ${
                    activeImage === img
                      ? 'border-brand-600 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info Panel ── */}
        <div className="space-y-5">
          {/* Brand + SKU */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800">
              {product.brand}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">SKU: {product.SKU}</span>
              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Copy link"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {product.name}
          </h1>

          {/* Rating removed */}

          {/* Price Box */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                ₹{product.sellingPrice.toLocaleString('en-IN')}
              </span>
              {product.mrp > product.sellingPrice && (
                <span className="text-base text-slate-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
              {product.discount > 0 && (
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {product.discount}% off
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Inclusive of 18% GST (HSN: {product.hsn})
              {savings > 0 && ` • You save ₹${savings.toLocaleString('en-IN')}`}
            </p>
          </div>

          {/* Short Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{product.shortDescription}</p>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {product.stock > 0 ? `In Stock (${product.stock} units available)` : 'Out of Stock'}
            </span>
          </div>

          {/* Qty + CTA - Sticky Mobile Bottom Bar */}
          <div className="fixed md:relative bottom-0 md:bottom-auto left-0 right-0 z-[80] bg-white/95 dark:bg-slate-900/95 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none border-t border-slate-200/80 dark:border-slate-800/80 md:border-none p-3 sm:p-4 md:p-0 flex flex-row items-center gap-2 sm:gap-3 md:pt-1 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] md:shadow-none pb-safe">
            {/* Price on mobile sticky bar */}
            <div className="flex flex-col md:hidden shrink-0 pr-1">
              <span className="text-[10px] text-slate-400 font-semibold leading-tight">Total</span>
              <span className="text-base font-black text-slate-900 dark:text-white leading-tight">
                ₹{(product.sellingPrice * quantity).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-12 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-lg"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-bold text-slate-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-10 h-12 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-lg"
              >
                +
              </button>
            </div>

            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3.5 rounded-xl border flex items-center justify-center transition active:scale-95 shadow-sm ${
                isWishlisted(product._id)
                  ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
              }`}
              title={isWishlisted(product._id) ? 'Remove from Favorites' : 'Add to Favorites'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted(product._id) ? 'fill-rose-500 stroke-rose-500' : ''}`} />
            </button>

            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`flex-1 w-full font-bold py-3.5 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition active:scale-95 ${
                added
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white shadow-brand-600/25 disabled:from-slate-400 disabled:to-slate-400'
              }`}
            >
              {added ? <CheckCircle2 className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
              <span>{added ? '✓ Added to Cart!' : 'Add to Cart'}</span>
            </button>
          </div>

          {/* WhatsApp Order */}
          <a
            href={`https://wa.me/919876543210?text=Hi! I want to order: ${product.name} (₹${product.sellingPrice.toLocaleString('en-IN')})`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold py-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Order via WhatsApp
          </a>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{product.warranty}</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{product.shippingInformation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {(['specs', 'desc', 'warranty'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-sm font-bold py-4 px-6 transition relative ${
                activeTab === tab
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'specs' ? 'Specifications' : tab === 'desc' ? 'Description' : tab === 'warranty' ? 'Warranty & Service' : ''}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 dark:bg-brand-400"
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(product.specifications || {}).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">{key}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-right max-w-[55%]">{val as string}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'desc' && (
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-4">
              <p>{product.description}</p>
              {product.features && product.features.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">Key Features:</h4>
                  <ul className="space-y-1.5">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "warranty" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Warranty & Return Policy</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{product.warranty || "Standard Manufacturer Warranty"}</p>
                </div>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <p>Specific policies for this item:</p>
                <ul className="space-y-1.5 pt-2">
                  <li className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Return Policy: {product.returnPolicy || "7 Days Replacement"}</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Installation Support: {product.brand === "Aqua Fresh" ? "Doorstep installation available" : "Remote assistance via WhatsApp"}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Related Products ── */}
      {related.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Related Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};













