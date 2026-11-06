import React, { useState, useEffect } from "react";
import type { Product } from "../types/product";
import { getProductBySlug, getRelatedProducts } from "../services/productDetail";
import { submitInquiry } from "../services/inquiries";
import { getApprovedVouches } from "../services/legitimacy";
import type { Vouch } from "../services/legitimacy";
import ProductCard, { peso, isOnSale, discountPercent } from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import { useFavorites } from "../hooks/useFavorites";
import SiteHeader from "../components/SiteHeader";
import { useCart } from "../context/CartContext";

const API_URL = import.meta.env.VITE_API_URL as string;
const STORAGE_URL = API_URL.replace(/\/api\/?$/, "");

function imageUrl(path: string, fallbackSeed: string): string {
  if (!path) return `https://picsum.photos/seed/${fallbackSeed}/900/1100`;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STORAGE_URL}/storage/${path}`;
}

interface ProductDetailProps {
  slug: string;
}

// Sizing Chart Data
const SIZING_TABLE = [
  { usMen: "7.0", usWomen: "8.5", eu: "40", cm: "25.0" },
  { usMen: "7.5", usWomen: "9.0", eu: "40.5", cm: "25.5" },
  { usMen: "8.0", usWomen: "9.5", eu: "41", cm: "26.0" },
  { usMen: "8.5", usWomen: "10.0", eu: "42", cm: "26.5" },
  { usMen: "9.0", usWomen: "10.5", eu: "42.5", cm: "27.0" },
  { usMen: "9.5", usWomen: "11.0", eu: "43", cm: "27.5" },
  { usMen: "10.0", usWomen: "11.5", eu: "44", cm: "28.0" },
  { usMen: "10.5", usWomen: "12.0", eu: "44.5", cm: "28.5" },
  { usMen: "11.0", usWomen: "12.5", eu: "45", cm: "29.0" },
  { usMen: "12.0", usWomen: "13.5", eu: "46", cm: "30.0" },
];

export default function ProductDetail({ slug }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addAddon, setAddAddon] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        setActiveImageIndex(0);
        setSelectedSize(null);
        setAddAddon(false);
        setMessage(
          `Hi Wise Sole! I'm interested in ${p.name}. Is this still available?`
        );
        return Promise.all([
          getRelatedProducts(p.category.slug, p.id),
          getApprovedVouches().catch(() => []),
        ]);
      })
      .then(([relData, vouchData]) => {
        setRelated(relData);
        setVouches(vouchData.slice(0, 3));
      })
      .catch(() => setError("Product not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  const images = [...(product?.images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const hasRealImages = images.length > 0;

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (images.length > 1) {
        if (e.key === "ArrowLeft") {
          setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        } else if (e.key === "ArrowRight") {
          setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, images.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-20 text-center text-[#6B6B6B]">
          Loading product...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-20 text-center">
          <p className="text-[18px] mb-4">{error || "Product not found."}</p>
          <a
            href="/shop"
            className="text-[12px] tracking-[0.1em] uppercase underline hover:opacity-60"
          >
            ← Back to Shop
          </a>
        </div>
      </div>
    );
  }

  const mainImageSrc = hasRealImages
    ? imageUrl(images[activeImageIndex].image_path, `prod${product.id}-main`)
    : `https://picsum.photos/seed/prod${product.id}/900/1100`;

  const sortedSizes = [...(product.sizes || [])].sort((a, b) => {
    const numA = parseFloat(a.size);
    const numB = parseFloat(b.size);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.size.localeCompare(b.size);
  });

  const needsSizeSelection = product.sizes && product.sizes.length > 0 && !selectedSize;

  const currentPrice = isOnSale(product)
    ? peso(product.sale_price!)
    : peso(product.price);

  const basePrice = isOnSale(product) ? Number(product.sale_price) : Number(product.price);
  const addonCost = addAddon && product.addon_price ? Number(product.addon_price) : 0;
  const totalWithAddon = basePrice + addonCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const inquiryDetails = selectedSize
      ? `${message}\n\n[Size selected: ${selectedSize}]`
      : message;

    try {
      await submitInquiry({
        name,
        contact,
        message: inquiryDetails,
        product_id: product.id,
      });
      setSubmitted(true);
    } catch {
      setSubmitError("Failed to send inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToProduct = (p: Product) => {
    window.location.href = `/product/${p.slug}`;
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <SiteHeader />

      <section className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-16">
        <a
          href="/shop"
          className="inline-block text-[11px] tracking-[0.1em] uppercase text-[#6B6B6B] hover:text-black transition-colors duration-200 mb-8"
        >
          ← Back to Shop
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-start">
          {/* LEFT: IMAGES */}
          <div className="lg:col-span-7">
            <div
              className={`relative overflow-hidden bg-[#FAFAFA] aspect-square w-full mb-4 border border-[#EAEAEA] ${
                hasRealImages ? "cursor-zoom-in" : ""
              }`}
              onClick={() => hasRealImages && setLightboxOpen(true)}
            >
              <img
                src={mainImageSrc}
                alt={product.name}
                className="w-full h-full object-cover select-none"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(i)}
                    className={`aspect-square overflow-hidden bg-[#FAFAFA] border transition-colors duration-200 ${
                      i === activeImageIndex ? "border-black" : "border-[#EAEAEA] opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imageUrl(img.image_path, `thumb${img.id}`)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: PRODUCT INFO */}
          <div className="lg:col-span-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">
              {product.category.name}
            </p>
            <h1 className="text-[24px] md:text-[30px] font-semibold tracking-tight mb-3">{product.name}</h1>

            {isOnSale(product) ? (
              <div className="flex items-center gap-3 mb-6">
                <p className="text-[15px] text-[#6B6B6B] line-through">{peso(product.price)}</p>
                <p className="text-[20px] font-semibold text-red-600">{peso(product.sale_price!)}</p>
                <span className="bg-red-600 text-white text-[10px] tracking-[0.12em] uppercase px-2.5 py-1">
                  -{discountPercent(product)}% Off
                </span>
              </div>
            ) : (
              <p className="text-[18px] font-medium mb-6">{peso(product.price)}</p>
            )}

            {product.description && (
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {/* SIZES + SIZE GUIDE BUTTON (RECO #1) */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B]">
                    Select Size
                  </p>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[11px] uppercase tracking-wider text-black underline hover:opacity-60 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    <span>Size Guide &amp; Fit</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {sortedSizes.map((s) => {
                    const stockNum = Number(s.stock);
                    const outOfStock = !Number.isFinite(stockNum) || stockNum <= 0;
                    const active = selectedSize === s.size;
                    return (
                      <button
                        key={s.id}
                        onClick={() => !outOfStock && setSelectedSize(s.size)}
                        disabled={outOfStock}
                        className={`text-[12px] px-4 py-2.5 border transition-colors duration-200 ${
                          active
                            ? "bg-black text-white border-black font-semibold"
                            : outOfStock
                            ? "border-[#EAEAEA] text-[#EAEAEA] cursor-not-allowed line-through"
                            : "border-[#EAEAEA] text-black hover:border-black"
                        }`}
                      >
                        {s.size}
                      </button>
                    );
                  })}
                </div>
                {selectedSize && (
                  <p className="text-[11px] text-green-700 font-medium mt-2">
                    ✓ Selected: Size {selectedSize} • Ready to add to bag
                  </p>
                )}
              </div>
            )}

            {/* ADD-ON CHECKBOX */}
            {product.addon_name && product.addon_price && (
              <div className="mb-6 border border-[#EAEAEA] p-4 bg-[#FAFAFA]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addAddon}
                    onChange={(e) => setAddAddon(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-black shrink-0"
                  />
                  <span className="text-[13px]">
                    Add <span className="font-semibold">{product.addon_name}</span> for{" "}
                    <span className="font-semibold">{peso(product.addon_price)}</span>
                  </span>
                </label>
                {addAddon && (
                  <p className="text-[13px] font-medium mt-3 pt-3 border-t border-[#EAEAEA]">
                    Total: {peso(totalWithAddon)}
                  </p>
                )}
              </div>
            )}

            {/* CONDITION & INCLUSIONS CHECKLIST (RECO #2) */}
            <div className="mb-6 p-4 border border-[#EAEAEA] bg-[#FAFAFA] space-y-2 text-[12px]">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#888] font-semibold mb-1">
                Item Condition &amp; Packaging
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-black">
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Condition: Brand New / Deadstock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Original Box &amp; Packaging</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Extra Laces &amp; Accessories Included</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Accredited Courier Dispatch</span>
                </div>
              </div>
            </div>

            {/* ADD TO SHOPPING BAG BUTTON */}
            <button
              type="button"
              disabled={!product.is_available}
              onClick={() => {
                if (needsSizeSelection) {
                  alert("Please select a size first.");
                  return;
                }
                addToCart(product, selectedSize || null, 1);
              }}
              className={`w-full text-center text-[12px] tracking-[0.14em] uppercase py-4 mb-3 transition-colors duration-200 font-semibold shadow-xs flex items-center justify-center gap-2 ${
                !product.is_available
                  ? "bg-[#EAEAEA] text-[#999] cursor-not-allowed"
                  : "bg-black text-white hover:bg-[#222]"
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>{!product.is_available ? "Sold Out" : "Add to Shopping Bag"}</span>
            </button>

            {/* SUBTLE INQUIRY LINK */}
            <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] py-2 mb-4 px-1 border-b border-[#F0F0F0]">
              <span>Have sizing or pre-order questions?</span>
              <a
                href={`https://wa.me/639692891708?text=${encodeURIComponent(`Hi Wise Sole! Question regarding ${product.name}`)}`}
                target="_blank"
                rel="noreferrer"
                className="text-black font-semibold uppercase tracking-wider hover:underline"
              >
                Chat on WhatsApp →
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <a
                href="https://m.me/61578547474371"
                target="_blank"
                rel="noreferrer"
                className="border border-[#EAEAEA] text-center text-[10px] tracking-[0.08em] uppercase py-3 hover:border-black transition-colors duration-200 flex items-center justify-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.42 3.84 7.02V21l2.88-1.58c1.03.29 2.13.45 3.28.45 5.52 0 10-4.03 10-9s-4.48-9-10-9zm1.06 12.13-2.67-2.85-5.21 2.85 5.73-6.08 2.74 2.85 5.14-2.85-5.73 6.08z" />
                </svg>
                Messenger
              </a>

              <button
                type="button"
                onClick={() => {
                  if (!product) return;
                  const textToCopy = `Wise Sole - ${product.name}\nPrice: ${currentPrice}\nLink: ${window.location.href}`;
                  navigator.clipboard.writeText(textToCopy).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  });
                }}
                className="border border-[#EAEAEA] text-center text-[10px] tracking-[0.08em] uppercase py-3 hover:border-black transition-colors duration-200 flex items-center justify-center gap-1.5"
              >
                {copied ? (
                  <span className="text-black font-semibold">✓ Copied Link!</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => toggleFavorite(product.id)}
              className="w-full border border-[#EAEAEA] text-[11px] tracking-[0.12em] uppercase py-3.5 mb-8 hover:border-black transition-colors duration-200"
            >
              {favorites.includes(product.id) ? "♥ Saved to Favorites" : "♡ Add to Favorites"}
            </button>

            {/* SEND A DIRECT MESSAGE FORM */}
            <div className="border-t border-[#EAEAEA] pt-6">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">Direct Message</p>
              <h2 className="text-[15px] font-semibold mb-4">Inquire About This Piece</h2>

              {submitted ? (
                <div className="border border-green-200 bg-green-50 p-4 text-[13px] text-green-900">
                  Thanks, {name.split(" ")[0]}! Your inquiry has been sent — Wise Sole will get back to you shortly.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Contact (Mobile / Email)"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Questions regarding sizing, availability, or pickup..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      required
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] outline-none focus:border-black resize-none"
                    />
                  </div>

                  {submitError && <p className="text-[12px] text-red-600">{submitError}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="border border-black text-[11px] tracking-[0.12em] uppercase py-3 hover:bg-black hover:text-white transition-colors duration-200 disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Submit Inquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIED BUYER FEEDBACK / VOUCHES SHOWCASE (RECO #5) */}
      {vouches.length > 0 && (
        <section className="border-t border-[#EAEAEA] bg-[#FAFAFA]">
          <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-12 md:py-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">Authentic Community</p>
                <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight">Verified Buyer Vouches</h2>
              </div>
              <a
                href="/legitimacy"
                className="text-[11px] tracking-[0.1em] uppercase text-black underline hover:opacity-60"
              >
                View All Vouches →
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vouches.map((v) => (
                <div key={v.id} className="bg-white p-6 border border-[#EAEAEA] shadow-xs">
                  <div className="flex items-center gap-1 text-amber-500 mb-2">
                    {Array.from({ length: v.rating || 5 }).map((_, idx) => (
                      <span key={idx}>★</span>
                    ))}
                  </div>
                  <p className="text-[13px] text-black italic mb-4 leading-relaxed">
                    "{v.message}"
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#888]">
                    — {v.name} (Verified Purchase)
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COMPLETE THE LOOK / YOU MIGHT ALSO LIKE (RECO #4) */}
      {related.length > 0 && (
        <section className="border-t border-[#EAEAEA]">
          <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-16 md:py-20">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Complete The Look</p>
            <h2 className="text-[22px] md:text-[26px] font-semibold tracking-tight mb-8">
              More from {product.category.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
              {related.slice(0, 4).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onClick={() => goToProduct(p)}
                  onQuickView={(prod) => setQuickViewProduct(prod)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />

      {/* SIZE GUIDE MODAL (RECO #1) */}
      {sizeGuideOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSizeGuideOpen(false)}
        >
          <div
            className="bg-white max-w-lg w-full p-6 md:p-8 border border-[#EAEAEA] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSizeGuideOpen(false)}
              className="absolute top-5 right-5 text-[#888] hover:text-black text-xl leading-none"
            >
              &times;
            </button>

            <p className="text-[10px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-1">Wise Sole Sizing</p>
            <h3 className="text-[20px] font-semibold tracking-tight mb-2">Sneaker Size Conversion Guide</h3>
            <p className="text-[12px] text-[#6B6B6B] mb-5">
              Sizes are generally listed in standard US Men's sizing. If in between sizes or wide-footed, we recommend going half a size up.
            </p>

            <div className="overflow-x-auto border border-[#EAEAEA]">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-[10px] tracking-wider uppercase text-[#888]">
                    <th className="py-2.5 px-3 font-semibold">US Men</th>
                    <th className="py-2.5 px-3 font-semibold">US Women</th>
                    <th className="py-2.5 px-3 font-semibold">EU Size</th>
                    <th className="py-2.5 px-3 font-semibold">CM Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {SIZING_TABLE.map((row) => (
                    <tr key={row.usMen} className="hover:bg-[#F9F9F9]">
                      <td className="py-2 px-3 font-mono font-medium">{row.usMen}</td>
                      <td className="py-2 px-3 font-mono">{row.usWomen}</td>
                      <td className="py-2 px-3 font-mono font-semibold">{row.eu}</td>
                      <td className="py-2 px-3 font-mono text-[#6B6B6B]">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => setSizeGuideOpen(false)}
              className="w-full mt-6 py-3 bg-black text-white text-[11px] uppercase tracking-wider hover:bg-[#222]"
            >
              Close Size Guide
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxOpen && hasRealImages && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 flex flex-col justify-between p-4 md:p-8"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="w-full flex items-center justify-between text-white" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-[14px] font-semibold">{product.name}</p>
              {images.length > 1 && (
                <p className="text-[11px] text-white/60">
                  Photo {activeImageIndex + 1} of {images.length}
                </p>
              )}
            </div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="text-white hover:text-white/70 text-[32px] leading-none p-2"
              aria-label="Close lightbox"
            >
              &times;
            </button>
          </div>

          <div className="relative flex-1 w-full flex items-center justify-center my-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={mainImageSrc}
              alt={product.name}
              className="max-h-[75vh] max-w-full object-contain select-none"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-1 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/60 hover:bg-black text-white text-[24px] transition-colors rounded-full"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-1 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-black/60 hover:bg-black text-white text-[24px] transition-colors rounded-full"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
