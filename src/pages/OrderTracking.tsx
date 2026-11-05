import React, { useState, useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import { trackOrder } from "../services/orderApi";
import type { Order } from "../types/order";

function peso(val: number) {
  return "₱" + Math.round(val).toLocaleString("en-PH");
}

export default function OrderTracking() {
  const [searchInput, setSearchInput] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJustPlaced, setIsJustPlaced] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderNum = params.get("order");
    const justPlaced = params.get("placed") === "true";

    if (orderNum) {
      setSearchInput(orderNum);
      setIsJustPlaced(justPlaced);
      fetchOrder(orderNum);
    }
  }, []);

  const fetchOrder = async (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await trackOrder(num.trim());
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found. Please verify your order number.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchOrder(searchInput);
    }
  };

  const statusStep = (status: Order["status"]) => {
    switch (status) {
      case "pending_verification":
        return 1;
      case "payment_verified":
        return 2;
      case "shipped":
        return 3;
      case "delivered":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = order ? statusStep(order.status) : 1;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <SiteHeader />

      <main className="max-w-[1000px] mx-auto px-5 md:px-10 py-10 md:py-16">
        {/* CELEBRATION BANNER IF JUST PLACED */}
        {isJustPlaced && order && (
          <div className="mb-10 p-6 bg-black text-white text-center">
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/70 block mb-1">
              Order Confirmed
            </span>
            <h1 className="text-[22px] md:text-[28px] font-semibold tracking-tight mb-2">
              Thank You For Your Order!
            </h1>
            <p className="text-[13px] text-white/80 max-w-[500px] mx-auto leading-relaxed">
              We received your order and payment details. We will verify your receipt and prepare your parcel for courier pickup shortly.
            </p>
          </div>
        )}

        {/* SEARCH HEADER */}
        <div className="text-center max-w-[600px] mx-auto mb-12">
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">Live Tracking</p>
          <h2 className="text-[24px] md:text-[30px] font-semibold tracking-tight mb-4">Track Your Wise Sole Order</h2>
          <p className="text-[13px] text-[#6B6B6B] mb-6">
            Enter your Order Number (e.g., <span className="font-mono text-black font-semibold">WS-261106-ABCD</span>) to check live verification and courier shipping status.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-[460px] mx-auto">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              placeholder="e.g. WS-261106-XXXX"
              className="flex-1 bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] uppercase font-mono outline-none focus:border-black transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="bg-black text-white text-[11px] tracking-[0.15em] uppercase px-6 py-3 hover:bg-[#222] transition-colors disabled:opacity-40"
            >
              {loading ? "Checking..." : "Track"}
            </button>
          </form>

          {error && <p className="text-[13px] text-red-600 mt-3">{error}</p>}
        </div>

        {/* ORDER DETAILS & TIMELINE */}
        {order && (
          <div className="border border-[#EAEAEA] bg-white divide-y divide-[#EAEAEA] shadow-xs">
            {/* TOP BAR */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAFAFA]">
              <div>
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#888]">Order Number</span>
                <p className="text-[20px] font-mono font-bold tracking-wider text-black">{order.order_number}</p>
                <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                  Placed on {new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <div>
                {order.status === "cancelled" ? (
                  <span className="bg-red-100 text-red-800 text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 inline-block">
                    Order Cancelled
                  </span>
                ) : (
                  <span
                    className={`text-[11px] font-semibold tracking-wider uppercase px-3 py-1.5 inline-block ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "shipped"
                        ? "bg-purple-100 text-purple-800"
                        : order.status === "payment_verified"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>

            {/* TIMELINE */}
            {order.status !== "cancelled" && (
              <div className="p-6 md:p-10">
                <p className="text-[11px] tracking-[0.1em] uppercase text-[#888] mb-8 font-medium">Fulfillment Status</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                  {[
                    { step: 1, title: "Order Placed", desc: "Details & receipt submitted" },
                    { step: 2, title: "Payment Verified", desc: "Payment checked & packing" },
                    { step: 3, title: "Dispatched / Shipped", desc: "Handed over to courier" },
                    { step: 4, title: "Delivered", desc: "Parcel received" },
                  ].map((s) => {
                    const isDone = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div key={s.step} className="flex flex-col items-start relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold mb-3 transition-colors ${
                            isDone
                              ? "bg-black text-white"
                              : "bg-[#F0F0F0] text-[#AAA] border border-[#DDD]"
                          } ${isCurrent ? "ring-4 ring-black/10" : ""}`}
                        >
                          {isDone ? "✓" : s.step}
                        </div>
                        <p className={`text-[13px] font-semibold ${isDone ? "text-black" : "text-[#999]"}`}>
                          {s.title}
                        </p>
                        <p className="text-[11px] text-[#777] mt-0.5 leading-snug">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* COURIER & LIVE TRACKING LINK (PHASE 1) */}
                {order.status === "shipped" && order.tracking_number && (
                  <div className="mt-8 p-5 bg-[#F9F9F9] border border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] tracking-[0.15em] uppercase text-[#888] block mb-0.5">
                        Courier & Waybill
                      </span>
                      <p className="text-[15px] font-semibold text-black">
                        {order.courier_name || "Express Courier"} —{" "}
                        <span className="font-mono font-bold text-blue-700">{order.tracking_number}</span>
                      </p>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Click track below to view real-time location on the courier's official tracking portal.
                      </p>
                    </div>

                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-black text-white text-[11px] tracking-[0.12em] uppercase px-5 py-3 hover:bg-[#222] transition-colors shrink-0 text-center flex items-center justify-center gap-1.5"
                      >
                        <span>Track Package</span>
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ORDER ITEMS & DELIVERY INFO */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* ITEMS */}
              <div className="md:col-span-7 space-y-4">
                <p className="text-[11px] tracking-[0.1em] uppercase text-[#888] font-medium mb-3">Items in Parcel</p>
                <div className="divide-y divide-[#F0F0F0]">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 flex items-center gap-3">
                      {item.image_path ? (
                        <img src={item.image_path} alt={item.product_name} className="w-12 h-14 object-cover bg-[#F5F5F5] border border-[#EAEAEA] shrink-0" />
                      ) : (
                        <div className="w-12 h-14 bg-[#F5F5F5] flex items-center justify-center text-[9px] text-[#888] shrink-0">No pic</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-black truncate">{item.product_name}</p>
                        <div className="flex gap-2 text-[11px] text-[#777] mt-0.5">
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

                <div className="border-t border-[#EAEAEA] pt-3 space-y-1.5 text-[12px] text-[#6B6B6B]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-black font-medium">{peso(order.subtotal)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Voucher Discount {order.voucher_code ? `(${order.voucher_code})` : ""}</span>
                      <span>-{peso(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-black font-medium">{order.shipping_fee === 0 ? "FREE" : peso(order.shipping_fee)}</span>
                  </div>
                  <div className="border-t border-[#EAEAEA] pt-2 flex justify-between text-[14px] font-bold text-black">
                    <span>Total Paid</span>
                    <span>{peso(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* SHIPPING & PAYMENT DETAILS */}
              <div className="md:col-span-5 bg-[#FAFAFA] p-5 border border-[#EAEAEA] space-y-4 text-[12px]">
                <div>
                  <span className="text-[10px] tracking-[0.1em] uppercase text-[#888] block mb-0.5">Recipient</span>
                  <p className="font-semibold text-black text-[13px]">{order.customer_name}</p>
                  <p className="text-[#6B6B6B]">{order.customer_phone}</p>
                </div>

                <div>
                  <span className="text-[10px] tracking-[0.1em] uppercase text-[#888] block mb-0.5">Delivery Address</span>
                  <p className="text-black leading-relaxed">
                    {order.delivery_address}
                    {order.delivery_city ? `, ${order.delivery_city}` : ""}
                    {order.delivery_province ? `, ${order.delivery_province}` : ""}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] tracking-[0.1em] uppercase text-[#888] block mb-0.5">Payment Method</span>
                  <p className="font-semibold text-black uppercase tracking-wider text-[11px]">
                    {order.payment_method}
                  </p>
                  {order.payment_reference && (
                    <p className="text-[#6B6B6B] font-mono text-[11px] mt-0.5">
                      Ref: {order.payment_reference}
                    </p>
                  )}
                </div>

                {/* DIRECT SUPPORT BUTTON */}
                <div className="pt-3 border-t border-[#EAEAEA]">
                  <a
                    href={`https://wa.me/639560929925?text=${encodeURIComponent(
                      `Hi Wise Sole! Inquiring regarding my Order Number: ${order.order_number}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-white border border-black text-black text-[10px] tracking-[0.12em] uppercase py-2.5 text-center block hover:bg-black hover:text-white transition-colors"
                  >
                    Chat Us Regarding This Order
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
