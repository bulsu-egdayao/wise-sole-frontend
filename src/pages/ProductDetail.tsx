import React, { useEffect, useState } from "react";
import type { Product } from "../types/product";
import { getProductBySlug, getRelatedProducts } from "../services/productDetail";
import { submitInquiry } from "../services/inquiries";
import ProductCard, { peso, isOnSale, discountPercent } from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import { useFavorites } from "../hooks/useFavorites";

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

export default function ProductDetail({ slug }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addAddon, setAddAddon] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
        return getRelatedProducts(p.category.slug, p.id);
      })
      .then(setRelated)
      .catch(() => setError("Product not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  const goHome = () => {
    window.location.href = "/";
  };

  const goToProduct = (p: Product) => {
    window.location.href = `/product/${p.slug}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmitError(null);

    if (!name.trim() || !contact.trim() || !message.trim()) {
      setSubmitError("Please fill in your name, contact info, and message.");
      return;
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setSubmitError("Please select a size before sending your inquiry.");
      return;
    }

    const parts = [message.trim()];
    if (selectedSize) parts.push(`(Size: ${selectedSize})`);
    if (addAddon && product.addon_name) parts.push(`+ Add-on: ${product.addon_name} (${peso(product.addon_price!)})`);
    const finalMessage = parts.join(" ");

    setSubmitting(true);
    try {
      await submitInquiry({
        product_id: product.id,
        name: name.trim(),
        contact: contact.trim(),
        message: finalMessage,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to send inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  const currentPrice = product && isOnSale(product) ? peso(product.sale_price!) : product ? peso(product.price) : "";
  const needsSizeSelection = !!product && product.sizes && product.sizes.length > 0 && !selectedSize;

  const basePriceNum = product ? parseFloat(isOnSale(product) ? product.sale_price! : product.price) : 0;
  const addonPriceNum = product && product.addon_price ? parseFloat(product.addon_price) : 0;
  const totalWithAddon = basePriceNum + addonPriceNum;

  const waLink = product
    ? `https://wa.me/639560929925?text=${encodeURIComponent(
        `Hi Wise Sole! I'm interested in ${product.name}${
          selectedSize ? `, size ${selectedSize},` : ""
        } (${currentPrice})${
          addAddon && product.addon_name ? ` plus the ${product.addon_name} add-on (${peso(product.addon_price!)}) — total ${peso(totalWithAddon)}` : ""
        }. Is this still available?`
      )}`
    : "#";

  if (loading) {
    return (
      <div
        style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
        className="min-h-screen bg-white flex items-center justify-center"
      >
        <p className="text-[13px] text-[#6B6B6B]">Loading product…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
        className="min-h-screen bg-white flex flex-col items-center justify-center gap-4"
      >
        <p className="text-[15px] text-black">{error || "Product not found."}</p>
        <button
          onClick={goHome}
          className="text-[11px] tracking-[0.12em] uppercase border-b border-black pb-0.5 hover:opacity-60 transition-opacity"
        >
          Back to Homepage
        </button>
      </div>
    );
  }

  const images = [...(product.images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const hasRealImages = images.length > 0;
  const seed = `wsp${product.id}`;

  const mainImageSrc = hasRealImages
    ? imageUrl(images[activeImageIndex]?.image_path, seed)
    : imageUrl("", seed);

  const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL"];

  function sizeOrderIndex(size: string): number {
    return SIZE_ORDER.indexOf(size.trim().toUpperCase());
  }

  const sortedSizes = product.sizes
    ? [...product.sizes].sort((a, b) => {
        const numA = parseFloat(a.size);
        const numB = parseFloat(b.size);
        const bothNumeric = !isNaN(numA) && !isNaN(numB);
        if (bothNumeric) return numA - numB;

        const orderA = sizeOrderIndex(a.size);
        const orderB = sizeOrderIndex(b.size);
        if (orderA !== -1 && orderB !== -1) return orderA - orderB;
        if (orderA !== -1) return -1;
        if (orderB !== -1) return 1;

        return a.size.localeCompare(b.size);
      })
    : [];

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="bg-white text-black min-h-screen w-full">
      <header className="sticky top-0 z-50 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10">
          <div className="flex items-center justify-between h-[64px] md:h-[76px]">
            <button onClick={goHome} className="text-[15px] font-semibold tracking-[0.08em]">
              WISE SOLE
            </button>
            <div className="flex items-center gap-5">
              <a href="/favorites" className="text-[11px] tracking-[0.12em] uppercase text-[#6B6B6B] hover:text-black transition-colors duration-200">
                Favorites{favorites.length > 0 ? ` (${favorites.length})` : ""}
              </a>
              <button
                onClick={goHome}
                className="text-[11px] tracking-[0.12em] uppercase text-[#6B6B6B] hover:text-black transition-colors duration-200"
              >
                ← Back to Shop
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <div className="relative bg-[#F5F5F5] mb-3">
              <img
                src={mainImageSrc}
                alt={product.name}
                className="block w-full h-auto"
              />
              {product.is_new && (
                <span className="absolute top-4 left-4 bg-black text-white text-[10px] tracking-[0.15em] uppercase px-2.5 py-1">
                  New
                </span>
              )}
              {!product.is_available && (
                <span className="absolute top-4 left-4 bg-white text-black text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 border border-[#EAEAEA]">
                  Sold Out
                </span>
              )}
              {isOnSale(product) && (
                <span
                  className={`absolute left-4 bg-red-600 text-white text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 ${
                    product.is_new || !product.is_available ? "top-12" : "top-4"
                  }`}
                >
                  -{discountPercent(product)}% Off
                </span>
              )}
            </div>

            {hasRealImages && images.length > 1 && (
              <div className="grid grid-cols-5 gap-2.5">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative aspect-square overflow-hidden bg-[#F5F5F5] transition-opacity duration-200 ${
                      i === activeImageIndex ? "opacity-100 ring-1 ring-black" : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    <img src={imageUrl(img.image_path, seed)} alt="" loading="lazy" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
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
              <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-6 max-w-[440px]">
                {product.description}
              </p>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-2.5">
                  Select Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {sortedSizes.map((s) => {
                    const outOfStock = s.stock <= 0;
                    const active = selectedSize === s.size;
                    return (
                      <button
                        key={s.id}
                        onClick={() => !outOfStock && setSelectedSize(s.size)}
                        disabled={outOfStock}
                        className={`text-[12px] px-4 py-2.5 border transition-colors duration-200 ${
                          active
                            ? "bg-black text-white border-black"
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
                  <p className="text-[11px] text-[#6B6B6B] mt-2">
                    {product.sizes.find((s) => s.size === selectedSize)?.stock} in stock — size {selectedSize}
                  </p>
                )}
              </div>
            )}

            {product.addon_name && product.addon_price && (
              <div className="mb-6 border border-[#EAEAEA] p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addAddon}
                    onChange={(e) => setAddAddon(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-black shrink-0"
                  />
                  <span className="text-[13px]">
                    Add <span className="font-medium">{product.addon_name}</span> for{" "}
                    <span className="font-medium">{peso(product.addon_price)}</span>
                  </span>
                </label>
                {addAddon && (
                  <p className="text-[13px] font-medium mt-3 pt-3 border-t border-[#EAEAEA]">
                    Total: {peso(totalWithAddon)}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mb-8">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  product.is_available ? "bg-black" : "bg-[#EAEAEA]"
                }`}
              />
              <span className="text-[12px] text-[#6B6B6B]">
                {product.sizes && product.sizes.length > 0
                  ? product.is_available
                    ? "In stock — select a size above"
                    : "Currently out of stock"
                  : product.is_available
                  ? `In stock — ${product.stock} available`
                  : "Currently out of stock"}
              </span>
            </div>

            <a
              href={needsSizeSelection ? undefined : waLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                if (needsSizeSelection) {
                  e.preventDefault();
                  alert("Please select a size first.");
                }
              }}
              className={`block text-center text-[11px] tracking-[0.12em] uppercase py-4 mb-3 transition-colors duration-200 ${
                needsSizeSelection
                  ? "bg-[#EAEAEA] text-[#6B6B6B] cursor-not-allowed"
                  : "bg-black text-white hover:bg-[#1a1a1a]"
              }`}
            >
              Inquire via WhatsApp
            </a>

            <button
              onClick={() => toggleFavorite(product.id)}
              className="w-full border border-[#EAEAEA] text-[11px] tracking-[0.12em] uppercase py-4 mb-10 hover:border-black transition-colors duration-200"
            >
              {favorites.includes(product.id) ? "♥ Saved to Favorites" : "♡ Add to Favorites"}
            </button>

            <div className="border-t border-[#EAEAEA] pt-8">
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">Or send a message</p>
              <h2 className="text-[16px] font-semibold mb-5">Ask about this product</h2>

              {submitted ? (
                <div className="border border-[#EAEAEA] p-5">
                  <p className="text-[13.5px]">
                    Thanks, {name.split(" ")[0]}! Your inquiry has been sent — Wise Sole will get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                      Contact (WhatsApp / Email)
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      placeholder="0912 345 6789"
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      required
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200 resize-none"
                    />
                  </div>

                  {submitError && <p className="text-[13px] text-red-600">{submitError}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="border border-black text-[11px] tracking-[0.12em] uppercase py-3.5 hover:bg-black hover:text-white transition-colors duration-200 disabled:opacity-50"
                  >
                    {submitting ? "Sending…" : "Send Inquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-[#EAEAEA]">
          <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-16 md:py-24">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">You Might Also Like</p>
            <h2 className="text-[22px] md:text-[26px] font-semibold tracking-tight mb-8">
              More from {product.category.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8">
              {related.map((p) => (
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
    </div>
  );
}