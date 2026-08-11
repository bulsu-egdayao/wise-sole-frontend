import React, { useEffect, useState } from "react";
import type { Product, Category } from "../types/product";
import { getAllProductsAdmin, deleteProduct } from "../services/adminProducts";
import { getToken } from "../services/auth";

interface AdminProductsProps {
  onBack: () => void;
  onAddNew: () => void;
  onEdit: (product: Product) => void;
}

const API_URL = import.meta.env.VITE_API_URL as string;

export default function AdminProducts({ onBack, onAddNew, onEdit }: AdminProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
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

  return (
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
        {loading ? (
          <p className="text-[13px] text-[#6B6B6B]">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-[13px] text-[#6B6B6B]">No products yet. Click "Add Product" to create your first one.</p>
        ) : (
          <div className="border border-[#EAEAEA]">
            <div className="grid grid-cols-[1fr_120px_100px_100px_160px] gap-4 px-5 py-3 border-b border-[#EAEAEA] bg-[#F5F5F5] text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B]">
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span></span>
            </div>
            {products.map((p) => (
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
  );
}