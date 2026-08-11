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

interface CategoryPageProps {
  slug: string;
}

export default function CategoryPage({ slug }: CategoryPageProps) {
  const { favorites, toggleFavorite } = useFavorites();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [debouncedMinPrice, setDebouncedMinPrice] = useState("");
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [onSale, setOnSale] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  useEffect(() => {
    getShopCategories()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setCategoriesLoaded(true));
  }, []);

  // Sizes available specifically within this category
  useEffect(() => {
    getAvailableSizes(slug)
      .then(setAvailableSizes)
      .catch(() => setAvailableSizes([]));
  }, [slug]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 500);
    return () => clearTimeout(t);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    setCurrentPage(1);
  }, [slug, debouncedSearch, sort, debouncedMinPrice, debouncedMaxPrice, selectedSize, onSale, inStock]);

  const loadProducts = useCallback((page: number) => {
    setLoading(true);
    setError(null);
    getShopProducts({
      category: slug,
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
  }, [slug, debouncedSearch, sort, debouncedMinPrice, debouncedMaxPrice, selectedSize, onSale, inStock]);

  useEffect(() => {
    loadProducts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, debouncedSearch, sort, debouncedMinPrice, debouncedMaxPrice, selectedSize, onSale, inStock, currentPage]);

  const goHome = () => {
    window.location.href = "/";
  };

  const goToProduct = (p: Product) => {
    window.location.href = `/product/${p.slug}`;
  };

  const goToCategory = (categorySlug: string) => {
    window.location.href = `/category/${categorySlug}`;
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > lastPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentCategory = categories.find((c) => c.slug === slug);
  const categoryNotFound = categoriesLoaded && categories.length > 0 && !currentCategory;

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
              <a href="/favorites" className="text-[11px] tracking-[0.12em] uppercase text-[#6B6B6B] hover:text-black transition-colors duration-200">
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
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B] mb-4">
          <a href="/" className="hover:text-black transition-colors duration-200">Home</a>
          <span>/</span>
          <a href="/shop" className="hover:text-black transition-colors duration-200">Shop</a>
          <span>/</span>
          <span className="text-black">{currentCategory?.name || slug}</span>
        </div>

        {categoryNotFound ? (
          <div className="border border-[#EAEAEA] p-10 text-center max-w-[440px]">
            <p className="text-[14px] mb-2">Category not found</p>
            <p className="text-[13px] text-[#6B6B6B] mb-6">
              "{slug}" doesn't match any current category.
            </p>
            <a
              href="/shop"
              className="inline-block bg-black text-white text-[11px] tracking-[0.12em] uppercase px-6 py-3.5 hover:bg-[#1a1a1a] transition-colors duration-200"
            >
              Browse All Products
            </a>
          </div>
        ) : (
          <>
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Category</p>
            <h1 className="text-[26px] md:text-[34px] font-semibold tracking-tight mb-8">
              {currentCategory?.name || slug}
            </h1>

            {/* CATEGORY SWITCHER */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-[#EAEAEA]">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => goToCategory(c.slug)}
                    className={`text-[11px] tracking-[0.08em] uppercase px-4 py-2 border transition-colors duration-200 ${
                      c.slug === slug
                        ? "bg-black text-white border-black"
                        : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black hover:text-black"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {/* SEARCH + SORT */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={`Search within ${currentCategory?.name || slug}…`}
                className="w-full md:max-w-[360px] bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[13px] outline-none focus:border-black transition-colors duration-200"
              />
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

            {!loading && !error && (
              <p className="text-[12px] text-[#6B6B6B] mb-6">
                {total} product{total === 1 ? "" : "s"}
                {debouncedSearch && ` matching "${debouncedSearch}"`}
              </p>
            )}

            {loading ? (
              <p className="text-[13px] text-[#6B6B6B]">Loading products…</p>
            ) : error ? (
              <p className="text-[13px] text-red-600">{error}</p>
            ) : products.length === 0 ? (
              <p className="text-[13px] text-[#6B6B6B]">No products found in this category yet.</p>
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
          </>
        )}
      </div>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}