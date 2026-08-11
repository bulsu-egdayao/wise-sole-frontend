import React, { useEffect, useState } from "react";
import { getCurrentUser, logout as logoutRequest, getToken, clearToken } from "../services/auth";
import type { AdminUser } from "../services/auth";
import type { Product, Category } from "../types/product";

interface Inquiry {
  id: number;
  product_id: number | null;
  name: string;
  contact: string | null;
  message: string;
  status: "new" | "viewed" | "responded";
  created_at: string;
  product?: { name: string } | null;
}

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateProducts: () => void;
  onNavigateCategories: () => void;
  onNavigateInquiries: () => void;
  onNavigateSiteImages: () => void;
}
const API_URL = import.meta.env.VITE_API_URL as string;

export default function AdminDashboard({ onLogout, onNavigateProducts, onNavigateCategories, onNavigateInquiries, onNavigateSiteImages }: AdminDashboardProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      onLogout();
      return;
    }

    getCurrentUser(token)
      .then(setUser)
      .catch(() => {
        clearToken();
        onLogout();
      });

    Promise.all([
      fetch(`${API_URL}/products?per_page=100`).then((r) => r.json()),
      fetch(`${API_URL}/categories`).then((r) => r.json()),
      fetch(`${API_URL}/inquiries`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      }).then((r) => r.json()),
    ])
      .then(([productsRes, categoriesRes, inquiriesRes]) => {
        setProducts(productsRes.data || []);
        setCategories(categoriesRes || []);
        setInquiries(inquiriesRes.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, [onLogout]);

  const handleLogout = async () => {
    const token = getToken();
    if (token) await logoutRequest(token).catch(() => {});
    clearToken();
    onLogout();
  };

  const totalProducts = products.length;
  const availableProducts = products.filter((p) => p.is_available).length;
  const outOfStock = products.filter((p) => !p.is_available).length;
  const recentProducts = [...products].slice(-5).reverse();
  const recentInquiries = [...inquiries].slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[13px] text-[#6B6B6B]">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-10 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B]">Wise Sole</p>
            <h1 className="text-[15px] font-semibold">Admin Dashboard</h1>
          </div>
      <div className="flex items-center gap-4">
  {user && <span className="text-[13px] text-[#6B6B6B]">{user.name}</span>}
  <button
    onClick={onNavigateSiteImages}
    className="text-[11px] tracking-[0.1em] uppercase border border-[#EAEAEA] px-4 py-2 hover:border-black transition-colors duration-200"
  >
    Site Images
  </button>
  <button
    onClick={onNavigateInquiries}
    className="text-[11px] tracking-[0.1em] uppercase border border-[#EAEAEA] px-4 py-2 hover:border-black transition-colors duration-200"
  >
    Inquiries
  </button>
  <button
    onClick={onNavigateCategories}
    className="text-[11px] tracking-[0.1em] uppercase border border-[#EAEAEA] px-4 py-2 hover:border-black transition-colors duration-200"
  >
    Categories
  </button>
  <button
    onClick={onNavigateProducts}
    className="text-[11px] tracking-[0.1em] uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors duration-200"
  >
    Manage Products
  </button>
  <button
    onClick={handleLogout}
    className="text-[11px] tracking-[0.1em] uppercase text-[#6B6B6B] hover:text-black transition-colors duration-200"
  >
    Log Out
  </button>
</div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        {error && <p className="text-[13px] text-red-600 mb-6">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
  {[
    { label: "Total Products", value: totalProducts },
    { label: "Available", value: availableProducts },
    { label: "Out of Stock", value: outOfStock },
    { label: "Total Categories", value: categories.length },
    { label: "New Inquiries", value: inquiries.filter((i) => i.status === "new").length, highlight: true },
  ].map((stat) => (
    <div
      key={stat.label}
      className={`border p-5 ${stat.highlight && stat.value > 0 ? "border-black bg-black text-white" : "border-[#EAEAEA]"}`}
    >
      <p className={`text-[11px] tracking-[0.1em] uppercase mb-2 ${stat.highlight && stat.value > 0 ? "text-white/60" : "text-[#6B6B6B]"}`}>
        {stat.label}
      </p>
      <p className="text-[28px] font-semibold">{stat.value}</p>
    </div>
  ))}
</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-[15px] font-semibold mb-4">Recent Products</h2>
            {recentProducts.length === 0 ? (
              <p className="text-[13px] text-[#6B6B6B]">No products yet.</p>
            ) : (
              <div className="divide-y divide-[#EAEAEA] border border-[#EAEAEA]">
                {recentProducts.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">{p.name}</p>
                      <p className="text-[11px] text-[#6B6B6B]">{p.category?.name}</p>
                    </div>
                    <p className="text-[13px]">₱{parseFloat(p.price).toLocaleString("en-PH")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[15px] font-semibold mb-4">Recent Inquiries</h2>
            {recentInquiries.length === 0 ? (
              <p className="text-[13px] text-[#6B6B6B]">No inquiries yet.</p>
            ) : (
              <div className="divide-y divide-[#EAEAEA] border border-[#EAEAEA]">
                {recentInquiries.map((inq) => (
                  <div key={inq.id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] font-medium">{inq.name}</p>
                      <span className="text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B]">{inq.status}</span>
                    </div>
                    <p className="text-[12px] text-[#6B6B6B]">{inq.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}