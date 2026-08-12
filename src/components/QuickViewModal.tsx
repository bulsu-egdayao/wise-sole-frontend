import React, { useEffect } from "react";
import type { Product } from "../types/product";
import { peso, isOnSale, discountPercent } from "./ProductCard";

const API_URL = import.meta.env.VITE_API_URL as string;
const STORAGE_URL = API_URL.replace(/\/api\/?$/, "");

function quickViewImage(product: Product): string {
  const primary =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  if (primary) {
    const path = primary.image_path;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${STORAGE_URL}/storage/${path}`;
  }
  return `https://picsum.photos/seed/wsp${product.id}/900/1100`;
}

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = product ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  const waLink = `https://wa.me/639560929925?text=${encodeURIComponent(
    `Hi Wise Sole! I'm interested in ${product.name} (${isOnSale(product) ? peso(product.sale_price!) : peso(product.price)}). Is this still available?`
  )}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-[820px] max-h-[90vh] overflow-y-auto shadow-xl">
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center bg-white/90 hover:bg-white transition-colors duration-200 text-[18px]"
        >
          ×
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative aspect-[4/5] bg-[#F5F5F5]">
            <img
              src={quickViewImage(product)}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
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

          <div className="p-6 md:p-8 flex flex-col">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">
              {product.category?.name}
            </p>
            <h2 className="text-[20px] md:text-[24px] font-semibold tracking-tight mb-2">
              {product.name}
            </h2>
            {isOnSale(product) ? (
              <div className="flex items-center gap-3 mb-4">
                <p className="text-[13px] text-[#6B6B6B] line-through">{peso(product.price)}</p>
                <p className="text-[16px] font-medium text-red-600">{peso(product.sale_price!)}</p>
                <span className="bg-red-600 text-white text-[10px] tracking-[0.1em] uppercase px-2 py-0.5">
                  -{discountPercent(product)}%
                </span>
              </div>
            ) : (
              <p className="text-[16px] font-medium mb-4">{peso(product.price)}</p>
            )}

            {product.description && (
              <p className="text-[13px] text-[#6B6B6B] leading-relaxed mb-5 line-clamp-4">
                {product.description}
              </p>
            )}

            <div className="flex items-center gap-2 mb-6">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  product.is_available ? "bg-black" : "bg-[#EAEAEA]"
                }`}
              />
              <span className="text-[12px] text-[#6B6B6B]">
                {product.is_available ? `In stock — ${product.stock} available` : "Currently out of stock"}
              </span>
            </div>

            <div className="mt-auto flex flex-col gap-2.5">
              <a
                href={`/product/${product.slug}`}
                className="text-center border border-black text-[11px] tracking-[0.12em] uppercase py-3.5 hover:bg-black hover:text-white transition-colors duration-200"
              >
                View Full Details
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="text-center bg-black text-white text-[11px] tracking-[0.12em] uppercase py-3.5 hover:bg-[#1a1a1a] transition-colors duration-200"
              >
                Inquire via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}