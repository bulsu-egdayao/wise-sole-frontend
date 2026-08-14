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

interface Vouch {
  id: number;
  status: "pending" | "approved" | "rejected";
}

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateProducts: () => void;
  onNavigateCategories: () => void;
  onNavigateInquiries: () => void;
  onNavigateSiteImages: () => void;
  onNavigateLegitimacy: () => void;
  onNavigateVouches: () => void;
}
const API_URL = import.meta.env.VITE_API_URL as string;

function NavButton({
  label,
  onClick,
  badgeCount,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  badgeCount?: number;
  variant?: "default" | "primary" | "muted";
}) {
  const base = "relative text-[11px] tracking-[0.1em] uppercase px-4 py-2 transition-colors duration-200";
  const style =
    variant === "primary"
      ? `${base} border border-black hover:bg-black hover:text-white`
      : variant === "muted"
      ? `${base} text-[#6B6B6B] hover:text-black`
      : `${base} border border-[#EAEAEA] hover:border-black`;

  return (
    <button onClick={onClick} className={style}>
      {label}
      {!!badgeCount && badgeCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-medium w-[16px] h-[16px] flex items-center justify-center rounded-full">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}
    </button>
  );
}

export default function AdminDashboard({
  onLogout,
  onNavigateProducts,
  onNavigateCategories,
  onNavigateInquiries,
  onNavigateSiteImages,
  onNavigateLegitimacy,
  onNavigateVouches,
}: AdminDashboardProps) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [vouches, setVouches] = useState<Vouch[]>([]);
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
      fetch(`${API_URL}/vouches/admin`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      }).then((r) => r.json()),
    ])
      .then(([productsRes, categoriesRes, inquiriesRes, vouchesRes]) => {
        setProducts(productsRes.data || []);
        setCategories(categoriesRes || []);
        setInquiries(inquiriesRes.data || []);
        setVouches(Array.isArray(vouchesRes) ? vouchesRes : []);
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

  const newInquiriesCount = inquiries.filter((i) => i.status === "new").length;
  const pendingVouchesCount = vouches.filter((v) => v.status === "pending").length;

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
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B]">Wise Sole</p>
            <h1 className="text-[15px] font-semibold">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-5 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <NavButton label="Manage Products" onClick={onNavigateProducts} variant="primary" />
              <NavButton label="Categories" onClick={onNavigateCategories} />
            </div>

            <div className="w-px h-5 bg-[#EAEAEA] hidden md:block" />

            <div className="flex items-center gap-2">
              <NavButton label="Site Images" onClick={onNavigateSiteImages} />
              <NavButton label="Legitimacy" onClick={onNavigateLegitimacy} />
            </div>

            <div className="w-px h-5 bg-[#EAEAEA] hidden md:block" />

            <div className="flex items-center gap-2">
              <NavButton label="Inquiries" onClick={onNavigateInquiries} badgeCount={newInquiriesCount} />
              <NavButton label="Vouches" onClick={onNavigateVouches} badgeCount={pendingVouchesCount} />
            </div>

            <div className="w-px h-5 bg-[#EAEAEA] hidden md:block" />

            <div className="flex items-center gap-3">
              {user && <span className="text-[13px] text-[#6B6B6B]">{user.name}</span>}
              <NavButton label="Log Out" onClick={handleLogout} variant="muted" />
            </div>
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
            { label: "New Inquiries", value: newInquiriesCount, highlight: true },
            { label: "Pending Vouches", value: pendingVouchesCount, highlight: true },
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