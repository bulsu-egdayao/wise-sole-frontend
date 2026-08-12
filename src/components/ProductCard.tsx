import React from "react";
import type { Product } from "../types/product";

const API_URL = import.meta.env.VITE_API_URL as string;
const STORAGE_URL = API_URL.replace(/\/api\/?$/, "");

function resolveImagePath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${STORAGE_URL}/storage/${path}`;
}

function productImage(product: Product, fallbackSeed: string): string {
  const primary =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  if (primary) {
    return resolveImagePath(primary.image_path);
  }
  return `https://picsum.photos/seed/${fallbackSeed}/700/900`;
}

function productImageSecondary(product: Product, fallbackSeed: string): string {
  const sorted = [...(product.images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const secondary = sorted.find((img) => !img.is_primary) || sorted[1];
  if (secondary) {
    return resolveImagePath(secondary.image_path);
  }
  return `https://picsum.photos/seed/${fallbackSeed}b/700/900`;
}

export function peso(price: string | number) {
  const n = typeof price === "string" ? parseFloat(price) : price;
  return "₱" + n.toLocaleString("en-PH");
}

export function isOnSale(product: Product): boolean {
  if (!product.sale_price) return false;
  const sale = parseFloat(product.sale_price);
  const regular = parseFloat(product.price);
  return sale > 0 && sale < regular;
}

export function discountPercent(product: Product): number {
  const sale = parseFloat(product.sale_price || "0");
  const regular = parseFloat(product.price);
  if (!regular || sale <= 0) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}

export function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path d="M12 20.2s-7.5-4.6-9.7-9A5.2 5.2 0 0 1 12 6.4a5.2 5.2 0 0 1 9.7 4.8c-2.2 4.4-9.7 9-9.7 9Z" />
    </svg>
  );
}

interface ProductCardProps {
  product: Product;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  onClick?: () => void;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, favorites, toggleFavorite, onClick, onQuickView }: ProductCardProps) {
  const isFav = favorites.includes(product.id);
  const seed = `wsp${product.id}`;
  const img = productImage(product, seed);
  const img2 = productImageSecondary(product, seed);

  return (
    <div className="group flex flex-col cursor-pointer" onClick={onClick}>
      <div className="relative overflow-hidden bg-[#F5F5F5] aspect-[4/5]">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:opacity-0"
        />
        <img
          src={img2}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-0 scale-[1.04] transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-100"
        />

        {product.is_new && (
          <span className="absolute top-3 left-3 bg-black text-white text-[10px] tracking-[0.15em] uppercase px-2.5 py-1">
            New
          </span>
        )}
        {!product.is_available && (
          <span className="absolute top-3 left-3 bg-white text-black text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 border border-[#EAEAEA]">
            Sold Out
          </span>
        )}
        {isOnSale(product) && (
          <span
            className={`absolute left-3 bg-red-600 text-white text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 ${
              product.is_new || !product.is_available ? "top-11" : "top-3"
            }`}
          >
            -{discountPercent(product)}% Off
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          aria-label="Add to favorites"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-0 transition-transform duration-200 hover:scale-110"
        >
          <HeartIcon className="w-4 h-4" filled={isFav} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="w-full bg-black text-white text-[11px] tracking-[0.15em] uppercase py-3 hover:bg-[#1a1a1a] transition-colors duration-200"
          >
            Quick View
          </button>
        </div>
      </div>

      <div className="pt-3.5 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">{product.category?.name}</p>
          <h3 className="text-[13.5px] font-medium text-black leading-snug">{product.name}</h3>
        </div>
        {isOnSale(product) ? (
          <div className="flex flex-col items-end pt-4">
            <p className="text-[11px] text-[#6B6B6B] line-through">{peso(product.price)}</p>
            <p className="text-[13.5px] font-medium text-red-600 whitespace-nowrap">{peso(product.sale_price!)}</p>
          </div>
        ) : (
          <p className="text-[13.5px] font-medium text-black whitespace-nowrap pt-4">{peso(product.price)}</p>
        )}
      </div>
    </div>
  );
}