import React, { useEffect, useState } from "react";
import type { Product } from "../types/product";
import { getProductById } from "../services/productDetail";
import { useFavorites } from "../hooks/useFavorites";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import SiteHeader from "../components/SiteHeader";

export default function Favorites() {
  const { favorites, toggleFavorite } = useFavorites();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.allSettled(favorites.map((id) => getProductById(id)))
      .then((results) => {
        const found = results
          .filter((r): r is PromiseFulfilledResult<Product> => r.status === "fulfilled")
          .map((r) => r.value);
        setProducts(found);
      })
      .catch(() => setError("Failed to load your favorites."))
      .finally(() => setLoading(false));
  }, [favorites]);

  const goToProduct = (p: Product) => {
    window.location.href = `/product/${p.slug}`;
  };

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="bg-white text-black min-h-screen w-full">
      <SiteHeader />

      <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-14">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Saved For Later</p>
        <h1 className="text-[26px] md:text-[34px] font-semibold tracking-tight mb-8">
          Favorites{products.length > 0 ? ` (${products.length})` : ""}
        </h1>

        {loading ? (
          <p className="text-[13px] text-[#6B6B6B]">Loading your favorites…</p>
        ) : error ? (
          <p className="text-[13px] text-red-600">{error}</p>
        ) : products.length === 0 ? (
          <div className="border border-[#EAEAEA] p-10 text-center max-w-[440px]">
            <p className="text-[14px] mb-2">No favorites yet</p>
            <p className="text-[13px] text-[#6B6B6B] mb-6">
              Tap the heart icon on any product to save it here — no account needed, it's kept right on this device.
            </p>
            <a
              href="/shop"
              className="inline-block bg-black text-white text-[11px] tracking-[0.12em] uppercase px-6 py-3.5 hover:bg-[#1a1a1a] transition-colors duration-200"
            >
              Browse the Shop
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14">
            {products.map((p) => (
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
        )}
      </div>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}