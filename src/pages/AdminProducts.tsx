import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category } from "../types/product";
import { getAllProductsAdmin, deleteProduct } from "../services/adminProducts";
import { getToken } from "../services/auth";
import { useConfirm } from "../hooks/useConfirm";

interface AdminProductsProps {
  onBack: () => void;
  onAddNew: () => void;
  onEdit: (product: Product) => void;
}

const API_URL = import.meta.env.VITE_API_URL as string;

type StatusFilter = "all" | "available" | "sold_out" | "low_stock" | "featured" | "new";
type SortOption = "name_asc" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc";

const LOW_STOCK_THRESHOLD = 5;

export default function AdminProducts({ onBack, onAddNew, onEdit }: AdminProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");

  const { confirm, ConfirmDialog } = useConfirm();

  const loadProducts = () => {
    setLoading(true);
    Promise.all([
      getAllProductsAdmin(),
      fetch(`${API_URL}/categories`).then((r) => r.json()),
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(productsData);
        setCategories(categoriesData || []);
      })
      .catch(() => setError("Failed to load products."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) {
      onBack();
      return;
    }
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (product: Product) => {
    if (!(await confirm(`Delete "${product.name}"? This cannot be undone.`, { danger: true }))) return;
    setDeletingId(product.id);
    try {
      await deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => String(p.category_id) === categoryFilter);
    }

    if (statusFilter === "available") {
      result = result.filter((p) => p.is_available);
    } else if (statusFilter === "sold_out") {
      result = result.filter((p) => !p.is_available);
    } else if (statusFilter === "low_stock") {
      result = result.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
    } else if (statusFilter === "featured") {
      result = result.filter((p) => p.is_featured);
    } else if (statusFilter === "new") {
      result = result.filter((p) => p.is_new);
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "price_asc":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price_desc":
          return parseFloat(b.price) - parseFloat(a.price);
        case "stock_asc":
          return a.stock - b.stock;
        case "stock_desc":
          return b.stock - a.stock;
        default:
          return 0;
      }
    });

    return result;
  }, [products, search, categoryFilter, statusFilter, sortOption]);

  const hasActiveFilters = search.trim() !== "" || categoryFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  return (
    <>
      <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="min-h-screen bg-white text-black">
        <header className="sticky top-0 z-10 bg-white border-b border-[#EAEAEA]">
          <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="text-[13px] text-[#6B6B6B] hover:text-black transition-colors duration-200">
                ← Dashboard
              </button>
              <h1 className="text-[15px] font-semibold">Products</h1>
            </div>
            <button
              onClick={onAddNew}
              className="text-[11px] tracking-[0.1em] uppercase bg-black text-white px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors duration-200"
            >
              + Add Product
            </button>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-6 py-10">
          {error && <p className="text-[13px] text-red-600 mb-6">{error}</p>}

          {/* FILTER BAR */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="flex-1 min-w-0 bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-2.5 text-[13px] outline-none focus:border-black transition-colors duration-200"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors duration-200"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors duration-200"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="sold_out">Sold Out</option>
              <option value="low_stock">Low Stock (≤{LOW_STOCK_THRESHOLD})</option>
              <option value="featured">Featured</option>
              <option value="new">New Arrivals</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors duration-200"
            >
              <option value="name_asc">Name (A–Z)</option>
              <option value="price_asc">Price (Low–High)</option>
              <option value="price_desc">Price (High–Low)</option>
              <option value="stock_asc">Stock (Low–High)</option>
              <option value="stock_desc">Stock (High–Low)</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] hover:text-black transition-colors duration-200 whitespace-nowrap px-2"
              >
                Clear Filters
              </button>
            )}
          </div>

          {!loading && (
            <p className="text-[11px] text-[#6B6B6B] mb-4">
              Showing {filteredProducts.length} of {products.length} product{products.length === 1 ? "" : "s"}
            </p>
          )}

          {loading ? (
            <p className="text-[13px] text-[#6B6B6B]">Loading products…</p>
          ) : products.length === 0 ? (
            <p className="text-[13px] text-[#6B6B6B]">No products yet. Click "Add Product" to create your first one.</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-[13px] text-[#6B6B6B]">No products match these filters.</p>
          ) : (
            <div className="border border-[#EAEAEA]">
              <div className="grid grid-cols-[1fr_120px_100px_100px_160px] gap-4 px-5 py-3 border-b border-[#EAEAEA] bg-[#F5F5F5] text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B]">
                <span>Product</span>
                <span>Category</span>
                <span>Price</span>
                <span>Stock</span>
                <span></span>
              </div>
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[1fr_120px_100px_100px_160px] gap-4 px-5 py-4 border-b border-[#EAEAEA] last:border-b-0 items-center"
                >
                  <div>
                    <p className="text-[13.5px] font-medium">{p.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      {p.is_featured && (
                        <span className="text-[9px] tracking-[0.08em] uppercase bg-black text-white px-1.5 py-0.5">Featured</span>
                      )}
                      {p.is_new && (
                        <span className="text-[9px] tracking-[0.08em] uppercase border border-black px-1.5 py-0.5">New</span>
                      )}
                      {!p.is_available && (
                        <span className="text-[9px] tracking-[0.08em] uppercase border border-[#EAEAEA] text-[#6B6B6B] px-1.5 py-0.5">Sold Out</span>
                      )}
                      {p.is_available && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD && (
                        <span className="text-[9px] tracking-[0.08em] uppercase bg-red-600 text-white px-1.5 py-0.5">Low Stock</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[13px] text-[#6B6B6B]">{p.category?.name}</span>
                  <span className="text-[13px]">₱{parseFloat(p.price).toLocaleString("en-PH")}</span>
                  <span className="text-[13px]">{p.stock}</span>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => onEdit(p)}
                      className="text-[11px] tracking-[0.08em] uppercase border-b border-black pb-0.5 hover:opacity-60 transition-opacity"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      className="text-[11px] tracking-[0.08em] uppercase text-red-600 border-b border-red-600 pb-0.5 hover:opacity-60 transition-opacity disabled:opacity-40"
                    >
                      {deletingId === p.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      {ConfirmDialog}
    </>
  );
}