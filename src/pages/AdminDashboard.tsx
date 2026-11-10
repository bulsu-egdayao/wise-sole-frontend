import React, { useEffect, useState } from "react";
import { getCurrentUser, logout as logoutRequest, getToken, clearToken } from "../services/auth";
import type { AdminUser } from "../services/auth";
import type { Product, Category } from "../types/product";
import { getPaymentSettings, updatePaymentSettings } from "../services/orderApi";

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
  onNavigateOrders: () => void;
  onNavigateVouchers: () => void;
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
  onNavigateOrders,
  onNavigateVouchers,
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
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [codEnabled, setCodEnabled] = useState<boolean>(false);
  const [togglingCod, setTogglingCod] = useState<boolean>(false);
  const [codToast, setCodToast] = useState<string | null>(null);
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

    getPaymentSettings()
      .then((settings) => setCodEnabled(!!settings.cod_enabled))
      .catch(() => {});

    Promise.all([
      fetch(`${API_URL}/products?per_page=100`).then((r) => r.json()),
      fetch(`${API_URL}/categories`).then((r) => r.json()),
      fetch(`${API_URL}/inquiries`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      }).then((r) => r.json()),
      fetch(`${API_URL}/vouches/admin`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      }).then((r) => r.json()),
      fetch(`${API_URL}/orders?status=pending_verification`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      }).then((r) => r.json()).catch(() => ({ total: 0 })),
    ])
      .then(([productsRes, categoriesRes, inquiriesRes, vouchesRes, ordersRes]) => {
        setProducts(productsRes.data || []);
        setCategories(categoriesRes || []);
        setInquiries(inquiriesRes.data || []);
        setVouches(Array.isArray(vouchesRes) ? vouchesRes : []);
        setPendingOrdersCount(ordersRes?.total || 0);
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

  const handleToggleCod = async () => {
    setTogglingCod(true);
    try {
      const updated = await updatePaymentSettings({ cod_enabled: !codEnabled });
      setCodEnabled(!!updated.cod_enabled);
      setCodToast(
        updated.cod_enabled
          ? "✓ Cash on Delivery (COD) is now AVAILABLE on checkout."
          : "✓ Cash on Delivery (COD) is now DISABLED on checkout."
      );
      setTimeout(() => setCodToast(null), 3500);
    } catch {
      setCodToast("Failed to update COD setting. Please try again.");
      setTimeout(() => setCodToast(null), 3500);
    } finally {
      setTogglingCod(false);
    }
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
        <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B]">Wise Sole</p>
            <h1 className="text-[15px] font-semibold">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <NavButton label="Orders" onClick={onNavigateOrders} badgeCount={pendingOrdersCount} variant="primary" />
              <NavButton label="Vouchers" onClick={onNavigateVouchers} />
            </div>

            <div className="w-px h-5 bg-[#EAEAEA] hidden md:block" />

            <div className="flex items-center gap-2">
              <NavButton label="Products" onClick={onNavigateProducts} />
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

      <main className="max-w-[1280px] mx-auto px-6 py-10">
        {error && <p className="text-[13px] text-red-600 mb-6">{error}</p>}

        {codToast && (
          <div className="mb-6 p-3 bg-black text-white text-[12px] flex items-center justify-between animate-in">
            <span>{codToast}</span>
            <button onClick={() => setCodToast(null)} className="text-white/60 hover:text-white">&times;</button>
          </div>
        )}

        {/* QUICK SETTING: CASH ON DELIVERY STATUS */}
        <div className="bg-[#FAFAFA] border border-[#EAEAEA] p-4 md:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 sm:mt-0 ${codEnabled ? "bg-green-500 shadow-xs" : "bg-[#BBB]"}`} />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[13px] font-bold uppercase tracking-wider text-black">
                  Checkout Option: Cash on Delivery (COD)
                </span>
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 border ${
                  codEnabled
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-white text-[#777] border-[#DDD]"
                }`}>
                  {codEnabled ? "✓ Active & Available" : "✕ Disabled / Unavailable"}
                </span>
              </div>
              <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                {codEnabled
                  ? "Customers can currently choose Cash on Delivery at checkout."
                  : "COD is disabled for the mean time. Only GCash and MariBank are accepted at checkout."}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={togglingCod}
            onClick={handleToggleCod}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] border transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer ${
              codEnabled
                ? "bg-white text-red-700 border-red-300 hover:bg-red-50"
                : "bg-black text-white border-black hover:bg-[#222]"
            } disabled:opacity-50`}
          >
            {togglingCod ? "Updating…" : codEnabled ? "Disable COD for Now" : "Make COD Available"}
          </button>
        </div>

        {/* STATS TILES */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 mb-12">
          {[
            { label: "Pending Orders", value: pendingOrdersCount, highlight: true, onClick: onNavigateOrders },
            { label: "New Inquiries", value: newInquiriesCount, highlight: true, onClick: onNavigateInquiries },
            { label: "Pending Vouches", value: pendingVouchesCount, highlight: true, onClick: onNavigateVouches },
            { label: "Total Products", value: totalProducts, onClick: onNavigateProducts },
            { label: "Available", value: availableProducts },
            { label: "Out of Stock", value: outOfStock },
          ].map((stat) => (
            <div
              key={stat.label}
              onClick={stat.onClick}
              className={`border p-4 transition-all ${stat.onClick ? "cursor-pointer hover:shadow-xs" : ""} ${
                stat.highlight && stat.value > 0 ? "border-black bg-black text-white" : "border-[#EAEAEA] bg-white"
              }`}
            >
              <p className={`text-[10px] tracking-[0.1em] uppercase mb-1.5 ${stat.highlight && stat.value > 0 ? "text-white/60" : "text-[#6B6B6B]"}`}>
                {stat.label}
              </p>
              <p className="text-[24px] font-semibold">{stat.value}</p>
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
                    <p className="text-[13px]">₱{parseFloat(String(p.price)).toLocaleString("en-PH")}</p>
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
