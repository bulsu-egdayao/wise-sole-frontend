import React, { useState, useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../services/orderApi";
import type { Order } from "../types/order";

function peso(val: number) {
  return "\u20B1" + Math.round(val).toLocaleString("en-PH");
}

export default function MyOrders() {
  const { user, isAuthenticated, openAuthModal, logoutUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      getMyOrders()
        .then(setOrders)
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <SiteHeader />

      <main className="max-w-[1200px] mx-auto px-5 md:px-10 py-10 md:py-16">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EAEAEA] pb-6 mb-8">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-1">Client Dashboard</p>
            <h1 className="text-[26px] md:text-[32px] font-semibold tracking-tight">My Purchases & Orders</h1>
          </div>

          {isAuthenticated && user && (
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#6B6B6B]">
                Signed in as <strong className="text-black">{user.name}</strong> ({user.email})
              </span>
              <button
                type="button"
                onClick={logoutUser}
                className="text-[11px] uppercase tracking-wider text-red-600 hover:underline border border-red-200 px-3 py-1 bg-red-50"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* NOT AUTHENTICATED STATE */}
        {!isAuthenticated ? (
          <div className="p-12 md:p-16 text-center border border-[#EAEAEA] bg-[#FAFAFA] max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-[18px] font-semibold tracking-tight mb-2">Sign In to View Your Purchases</h2>
            <p className="text-[13px] text-[#6B6B6B] mb-6">
              Never lose your orders again! Sign in to see all your placed orders, live courier waybills, and order dates automatically.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="px-6 py-3 bg-black text-white text-[11px] uppercase tracking-wider hover:bg-[#222]"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="px-6 py-3 border border-black text-black text-[11px] uppercase tracking-wider hover:bg-[#F5F5F5]"
              >
                Create Account
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-[#888] text-[13px]">
            <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-black" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading your purchases...
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-[13px]">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 md:p-16 text-center border border-[#EAEAEA] bg-[#FAFAFA]">
            <div className="w-14 h-14 rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-[18px] font-semibold tracking-tight mb-2">No Orders Yet</h2>
            <p className="text-[13px] text-[#6B6B6B] mb-6">
              You haven't placed any orders with this account yet. Browse our catalog and check out your next grail!
            </p>
            <a
              href="/shop"
              className="inline-block px-8 py-3.5 bg-black text-white text-[11px] uppercase tracking-wider hover:bg-[#222]"
            >
              Explore Collection
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const dateStr = new Date(order.created_at).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={order.id}
                  className="border border-[#EAEAEA] bg-white divide-y divide-[#EAEAEA] shadow-xs"
                >
                  {/* CARD HEADER */}
                  <div className="p-4 md:p-5 bg-[#FAFAFA] flex flex-wrap items-center justify-between gap-3 text-[12px]">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <span className="text-[10px] uppercase text-[#888] block">Order Date</span>
                        <span className="font-medium text-black">{dateStr}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#888] block">Order Number</span>
                        <span className="font-mono font-bold text-black">{order.order_number}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#888] block">Total Amount</span>
                        <span className="font-bold text-black">{peso(order.total_amount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* STATUS BADGE */}
                      <span
                        className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "shipped"
                            ? "bg-purple-100 text-purple-800"
                            : order.status === "payment_verified"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>

                      <a
                        href={`/track?order=${encodeURIComponent(order.order_number)}`}
                        className="px-3.5 py-1.5 bg-black text-white text-[11px] uppercase tracking-wider hover:bg-[#222]"
                      >
                        Track Order →
                      </a>
                    </div>
                  </div>

                  {/* ITEMS LIST */}
                  <div className="p-4 md:p-5 space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img
                          src={item.image_path || "https://picsum.photos/seed/ws/100/120"}
                          alt={item.product_name}
                          className="w-14 h-16 object-cover bg-white border border-[#EAEAEA] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-black truncate">{item.product_name}</p>
                          <div className="flex items-center gap-3 text-[11px] text-[#6B6B6B] mt-0.5">
                            {item.size && <span>Size: {item.size}</span>}
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <p className="text-[13px] font-semibold text-black shrink-0">
                          {peso(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* FOOTER: COURIER & RECIPIENT */}
                  <div className="p-4 md:p-5 bg-white flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#6B6B6B]">
                    <div>
                      <span>Delivery via </span>
                      <strong className="text-black">{order.courier_name || "Express Courier"}</strong>
                      {order.tracking_number && (
                        <span>
                          {" "}• Waybill: <strong className="font-mono text-blue-600">{order.tracking_number}</strong>
                        </span>
                      )}
                    </div>
                    <div>
                      <span>Delivering to: </span>
                      <strong className="text-black">{order.delivery_city || order.delivery_province || "Philippines"}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
