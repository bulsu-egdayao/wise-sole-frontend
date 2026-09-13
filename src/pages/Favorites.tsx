import React, { useEffect, useState } from "react";
import type { Product } from "../types/product";
import { getProductById } from "../services/productDetail";
import { useFavorites } from "../hooks/useFavorites";
import ProductCard, { peso, isOnSale } from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import SiteHeader from "../components/SiteHeader";

export default function Favorites() {
  const { favorites, toggleFavorite } = useFavorites();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (favorites.length === 0) {
      setProducts([]);
      setSelectedIds([]);
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
        setSelectedIds(found.map((p) => p.id));
      })
      .catch(() => setError("Failed to load your favorites."))
      .finally(() => setLoading(false));
  }, [favorites]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(products.map((p) => p.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
  const totalAmount = selectedProducts.reduce(
    (sum, p) => sum + parseFloat(isOnSale(p) ? p.sale_price! : p.price),
    0
  );

  const itemList = selectedProducts
    .map(
      (p, i) =>
        `${i + 1}. ${p.name} - ${isOnSale(p) ? peso(p.sale_price!) : peso(p.price)}`
    )
    .join("\n");

  const waBundleLink = `https://wa.me/639560929925?text=${encodeURIComponent(
    `Hi Wise Sole! I'd like to inquire about these ${selectedProducts.length} items from my saved list:\n\n${itemList}\n\nEstimated Total: ${peso(totalAmount)}\n\nAre these still available?`
  )}`;

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
          <>
            {/* BUNDLE INQUIRY BANNER */}
            <div className="border border-[#EAEAEA] p-6 md:p-8 mb-10 bg-[#FAFAFA] flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">
                  Inquire Multiple Items
                </p>
                <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight">
                  Inquire about {selectedProducts.length} saved item{selectedProducts.length === 1 ? "" : "s"} at once
                </h2>
                <p className="text-[13px] text-[#6B6B6B] mt-1">
                  Total Value: <span className="font-semibold text-black">{peso(totalAmount)}</span>
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={selectAll}
                    className="text-[11px] text-[#6B6B6B] hover:text-black underline underline-offset-2"
                  >
                    Select All ({products.length})
                  </button>
                  <span className="text-[#EAEAEA]">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-[11px] text-[#6B6B6B] hover:text-black underline underline-offset-2"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <a
                href={selectedProducts.length > 0 ? waBundleLink : undefined}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (selectedProducts.length === 0) {
                    e.preventDefault();
                    alert("Please select at least 1 item to inquire.");
                  }
                }}
                className={`inline-flex items-center justify-center text-center text-[11px] tracking-[0.12em] uppercase px-8 py-4 transition-colors duration-200 ${
                  selectedProducts.length > 0
                    ? "bg-black text-white hover:bg-[#1a1a1a]"
                    : "bg-[#EAEAEA] text-[#6B6B6B] cursor-not-allowed"
                }`}
              >
                Inquire Bundle on WhatsApp →
              </a>
            </div>

            {/* PRODUCT GRID WITH SELECTION */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14">
              {products.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <div key={p.id} className="relative flex flex-col">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-[12px]">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          className="w-4 h-4 accent-black"
                        />
                        <span className={isSelected ? "font-medium text-black" : "text-[#6B6B6B]"}>
                          Include in inquiry
                        </span>
                      </label>
                    </div>

                    <ProductCard
                      product={p}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                      onClick={() => goToProduct(p)}
                      onQuickView={(prod) => setQuickViewProduct(prod)}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}