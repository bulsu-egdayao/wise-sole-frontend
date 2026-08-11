import React, { useEffect, useState, useCallback } from "react";
import type { Product, Category } from "../types/product";
import { getShopProducts, getShopCategories, getAvailableSizes } from "../services/shop";
import type { SortOption } from "../services/shop";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import ProductFilters from "../components/ProductFilters";
import { useFavorites } from "../hooks/useFavorites";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "featured", label: "Featured" },
];

function readInitialFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category") || "",
    search: params.get("search") || "",
    sort: (params.get("sort") as SortOption) || "newest",
    minPrice: params.get("min_price") || "",
    maxPrice: params.get("max_price") || "",
    size: params.get("size") || "",
    onSale: params.get("on_sale") === "1",
    inStock: params.get("in_stock") === "1",
  };
}

export default function Shop() {
  const initial = readInitialFilters();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { favorites, toggleFavorite } = useFavorites();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>(initial.category);
  const [searchInput, setSearchInput] = useState<string>(initial.search);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initial.search);
  const [sort, setSort] = useState<SortOption>(initial.sort);
  const [minPrice, setMinPrice] = useState<string>(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState<string>(initial.maxPrice);
  const [selectedSize, setSelectedSize] = useState<string>(initial.size);
  const [onSale, setOnSale] = useState<boolean>(initial.onSale);
  const [inStock, setInStock] = useState<boolean>(initial.inStock);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  // Load categories once
  useEffect(() => {
    getShopCategories().then(setCategories).catch(() => {});
  }, []);

  // Reload the available sizes list whenever the category changes
  // (so you never see a size filter for a category that has none)
  useEffect(() => {
    getAvailableSizes(activeCategory || undefined)
      .then(setAvailableSizes)
      .catch(() => setAvailableSizes([]));
  }, [activeCategory]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Debounce price inputs so typing doesn't fire a request on every keystroke
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(minPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(maxPrice);
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 500);
    return () => clearTimeout(t);
  }, [minPrice, maxPrice]);

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, debouncedSearch, sort, debouncedMinPrice, debouncedMaxPrice, selectedSize, onSale, inStock]);

  const loadProducts = useCallback((page: number) => {
    setLoading(true);
    setError(null);
    getShopProducts({
      category: activeCategory || undefined,
      search: debouncedSearch || undefined,
      sort,
      page,
      minPrice: debouncedMinPrice || undefined,
      maxPrice: debouncedMaxPrice || undefined,
      size: selectedSize || undefined,
      onSale,
      inStock,
    })
      .then((res) => {
        setProducts(res.data);
        setCurrentPage(res.current_page);
        setLastPage(res.last_page);
        setTotal(res.total);
      })
      .catch(() => setError("Failed to load products. Check that the API is running."))
      .finally(() => setLoading(false));
  }, [activeCategory, debouncedSearch, sort, debouncedMinPrice, debouncedMaxPrice, selectedSize, onSale, inStock]);

  useEffect(() => {
    loadProducts(currentPage);
    // Keep the URL shareable/bookmarkable without a full reload
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sort !== "newest") params.set("sort", sort);
    if (debouncedMinPrice) params.set("min_price", debouncedMinPrice);
    if (debouncedMaxPrice) params.set("max_price", debouncedMaxPrice);
    if (selectedSize) params.set("size", selectedSize);
    if (onSale) params.set("on_sale", "1");
    if (inStock) params.set("in_stock", "1");
    const query = params.toString();
    window.history.replaceState({}, "", query ? `/shop?${query}` : "/shop");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, debouncedSearch, sort, debouncedMinPrice, debouncedMaxPrice, selectedSize, onSale, inStock, currentPage]);

  const goHome = () => {
    window.location.href = "/";
  };

  const goToProduct = (p: Product) => {
    window.location.href = `/product/${p.slug}`;
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > lastPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="bg-white text-black min-h-screen w-full">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10">
          <div className="flex items-center justify-between h-[64px] md:h-[76px]">
            <button onClick={goHome} className="text-[15px] font-semibold tracking-[0.08em]">
              WISE SOLE
            </button>
            <div className="flex items-center gap-5">
              <a href="/favorites" className="relative text-[11px] tracking-[0.12em] uppercase text-[#6B6B6B] hover:text-black transition-colors duration-200">
                Favorites{favorites.length > 0 ? ` (${favorites.length})` : ""}
              </a>
              <button
                onClick={goHome}
                className="text-[11px] tracking-[0.12em] uppercase text-[#6B6B6B] hover:text-black transition-colors duration-200"
              >
                ← Home
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-10 md:py-14">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Full Catalog</p>
        <h1 className="text-[26px] md:text-[34px] font-semibold tracking-tight mb-8">Shop</h1>

        {/* SEARCH */}
        <div className="mb-6">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search sneakers, bags, watches…"
            className="w-full md:max-w-[420px] bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[13px] outline-none focus:border-black transition-colors duration-200"
          />
        </div>

        {/* CATEGORY FILTER + SORT */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 pb-6 border-b border-[#EAEAEA]">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("")}
              className={`text-[11px] tracking-[0.08em] uppercase px-4 py-2 border transition-colors duration-200 ${
                activeCategory === ""
                  ? "bg-black text-white border-black"
                  : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black hover:text-black"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className={`text-[11px] tracking-[0.08em] uppercase px-4 py-2 border transition-colors duration-200 ${
                  activeCategory === c.slug
                    ? "bg-black text-white border-black"
                    : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black hover:text-black"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-white border border-[#EAEAEA] px-4 py-2.5 text-[12px] outline-none focus:border-black transition-colors duration-200 self-start md:self-auto"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <ProductFilters
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          availableSizes={availableSizes}
          onSale={onSale}
          onOnSaleChange={setOnSale}
          inStock={inStock}
          onInStockChange={setInStock}
        />

        {/* RESULTS COUNT */}
        {!loading && !error && (
          <p className="text-[12px] text-[#6B6B6B] mb-6">
            {total} product{total === 1 ? "" : "s"}
            {activeCategory && ` in ${categories.find((c) => c.slug === activeCategory)?.name || activeCategory}`}
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </p>
        )}

        {/* GRID */}
        {loading ? (
          <p className="text-[13px] text-[#6B6B6B]">Loading products…</p>
        ) : error ? (
          <p className="text-[13px] text-red-600">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-[13px] text-[#6B6B6B]">No products found. Try a different search or category.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14 mb-14">
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

            {/* PAGINATION */}
            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-[11px] tracking-[0.08em] uppercase px-3 py-2 border border-[#EAEAEA] hover:border-black transition-colors duration-200 disabled:opacity-30 disabled:hover:border-[#EAEAEA]"
                >
                  Previous
                </button>

                {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`text-[11px] w-8 h-8 flex items-center justify-center border transition-colors duration-200 ${
                      page === currentPage
                        ? "bg-black text-white border-black"
                        : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black hover:text-black"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === lastPage}
                  className="text-[11px] tracking-[0.08em] uppercase px-3 py-2 border border-[#EAEAEA] hover:border-black transition-colors duration-200 disabled:opacity-30 disabled:hover:border-[#EAEAEA]"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}