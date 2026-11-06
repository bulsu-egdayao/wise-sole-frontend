import React, { useState, useEffect } from "react";
import { getAdminOrders, updateOrderStatus, deleteOrder } from "../services/orderApi";
import type { Order, OrderStatus } from "../types/order";

function peso(val: number) {
  return "₱" + Math.round(val).toLocaleString("en-PH");
}

interface AdminOrdersProps {
  onBack: () => void;
}

export default function AdminOrders({ onBack }: AdminOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [modalCourier, setModalCourier] = useState("");
  const [modalTracking, setModalTracking] = useState("");
  const [modalStatus, setModalStatus] = useState<OrderStatus>("pending_verification");
  const [modalNotes, setModalNotes] = useState("");
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOrders(page, statusFilter, searchTerm);
      setOrders(res.data);
      setTotalPages(res.last_page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleOpenModal = (ord: Order) => {
    setSelectedOrder(ord);
    setModalCourier(ord.courier_name || "J&T Express");
    setModalTracking(ord.tracking_number || "");
    setModalStatus(ord.status);
    setModalNotes(ord.admin_notes || "");
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(selectedOrder.id, {
        status: modalStatus,
        courier_name: modalCourier,
        tracking_number: modalTracking,
        admin_notes: modalNotes,
      });

      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOrder(updated);
      setToast({ type: "success", message: "Order updated successfully!" });
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed to update order" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete === null) return;
    setDeleting(true);
    try {
      await deleteOrder(confirmDelete);
      setOrders((prev) => prev.filter((o) => o.id !== confirmDelete));
      if (selectedOrder?.id === confirmDelete) setSelectedOrder(null);
      setToast({ type: "success", message: "Order deleted successfully." });
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed to delete order" });
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[80] max-w-sm px-5 py-3.5 shadow-lg border flex items-center gap-3 animate-in ${
          toast.type === "success"
            ? "bg-white border-green-200 text-green-900"
            : "bg-white border-red-200 text-red-900"
        }`}>
          <span className="text-[13px]">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-[#888] hover:text-black text-lg leading-none">&times;</button>
        </div>
      )}
      {/* HEADER */}
      <header className="bg-white border-b border-[#EAEAEA] sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-[11px] tracking-[0.1em] uppercase text-[#6B6B6B] hover:text-black flex items-center gap-1.5 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <span className="text-[#DDD]">|</span>
            <h1 className="text-[16px] font-semibold tracking-tight">Customer Orders</h1>
          </div>
          <button
            onClick={loadOrders}
            className="text-[11px] tracking-[0.1em] uppercase border border-[#EAEAEA] px-3.5 py-1.5 hover:border-black transition-colors"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* FILTERS & SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All Orders" },
              { id: "pending_verification", label: "Pending Verification" },
              { id: "payment_verified", label: "Payment Verified" },
              { id: "shipped", label: "Shipped" },
              { id: "delivered", label: "Delivered" },
              { id: "cancelled", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`text-[11px] tracking-[0.08em] uppercase px-3.5 py-2 border transition-all ${
                  statusFilter === tab.id
                    ? "bg-black text-white border-black font-semibold"
                    : "bg-white text-[#6B6B6B] border-[#EAEAEA] hover:border-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Order # or Name..."
              className="bg-white border border-[#EAEAEA] px-3.5 py-2 text-[13px] outline-none focus:border-black w-64"
            />
            <button
              type="submit"
              className="bg-black text-white text-[11px] tracking-[0.1em] uppercase px-4 py-2 hover:bg-[#222]"
            >
              Search
            </button>
          </form>
        </div>

        {error && <p className="text-[13px] text-red-600 mb-4">{error}</p>}

        {/* ORDERS TABLE */}
        <div className="bg-white border border-[#EAEAEA] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-16 text-center text-[#888] text-[13px]">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center text-[#888] text-[13px]">No orders found for this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B]">
                    <th className="py-3.5 px-4 font-medium">Order Number</th>
                    <th className="py-3.5 px-4 font-medium">Date</th>
                    <th className="py-3.5 px-4 font-medium">Customer</th>
                    <th className="py-3.5 px-4 font-medium">Items</th>
                    <th className="py-3.5 px-4 font-medium">Total</th>
                    <th className="py-3.5 px-4 font-medium">Payment</th>
                    <th className="py-3.5 px-4 font-medium">Receipt</th>
                    <th className="py-3.5 px-4 font-medium">Courier / Tracking</th>
                    <th className="py-3.5 px-4 font-medium">Status</th>
                    <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-black">{ord.order_number}</td>
                      <td className="py-3.5 px-4 text-[#6B6B6B] whitespace-nowrap text-[12px]">
                        {new Date(ord.created_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-black">{ord.customer_name}</p>
                        <p className="text-[11px] text-[#888]">{ord.customer_phone}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="truncate text-[12px]">
                          {ord.items.map((i) => `${i.product_name} (${i.size || "Std"}) x${i.quantity}`).join(", ")}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-black whitespace-nowrap">
                        {peso(ord.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[11px] tracking-wider">
                        <span className="font-semibold">{ord.payment_method}</span>
                        {ord.payment_reference && (
                          <span className="block font-mono text-[10px] text-[#888]">{ord.payment_reference}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {ord.receipt_image_path ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceipt(ord.receipt_image_path!)}
                            className="w-10 h-12 border border-[#DDD] bg-black/5 hover:border-black overflow-hidden block"
                          >
                            <img src={ord.receipt_image_path} alt="Receipt" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#AAA] italic">No receipt</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[12px]">
                        {ord.courier_name ? (
                          <div>
                            <span className="font-medium text-black">{ord.courier_name}</span>
                            {ord.tracking_number && (
                              <p className="font-mono text-[11px] text-blue-700">{ord.tracking_number}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#AAA] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 inline-block ${
                            ord.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : ord.status === "shipped"
                              ? "bg-purple-100 text-purple-800"
                              : ord.status === "payment_verified"
                              ? "bg-blue-100 text-blue-800"
                              : ord.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenModal(ord)}
                          className="bg-black text-white text-[11px] tracking-[0.08em] uppercase px-3 py-1.5 hover:bg-[#222] transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#EAEAEA] flex items-center justify-between text-[12px]">
              <span className="text-[#888]">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border border-[#EAEAEA] disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 border border-[#EAEAEA] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MANAGE ORDER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EAEAEA] flex flex-col">
            <div className="p-6 border-b border-[#EAEAEA] flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] tracking-[0.15em] uppercase text-[#888]">Order Management</span>
                <h2 className="text-[18px] font-bold font-mono tracking-wider text-black">
                  {selectedOrder.order_number}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#888] hover:text-black p-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* CUSTOMER & DELIVERY INFO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#FAFAFA] border border-[#EAEAEA] text-[13px]">
                <div>
                  <span className="text-[10px] uppercase text-[#888] block">Customer</span>
                  <p className="font-semibold text-black">{selectedOrder.customer_name}</p>
                  <p className="text-[#6B6B6B]">{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && <p className="text-[#6B6B6B]">{selectedOrder.customer_email}</p>}
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#888] block">Delivery Address</span>
                  <p className="text-black leading-snug">
                    {selectedOrder.delivery_address}
                    {selectedOrder.delivery_city ? `, ${selectedOrder.delivery_city}` : ""}
                    {selectedOrder.delivery_province ? `, ${selectedOrder.delivery_province}` : ""}
                  </p>
                  {selectedOrder.delivery_notes && (
                    <p className="text-[11px] text-[#888] mt-1 italic">Note: {selectedOrder.delivery_notes}</p>
                  )}
                </div>
              </div>

              {/* PAYMENT & RECEIPT VERIFICATION */}
              <div className="p-4 bg-white border border-[#EAEAEA]">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-black mb-3">
                  Payment Method: {selectedOrder.payment_method === "cod" ? "CASH ON DELIVERY (LBC)" : selectedOrder.payment_method.toUpperCase()}
                </h3>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {selectedOrder.receipt_image_path ? (
                    <div className="w-36 h-48 border border-[#DDD] shrink-0 bg-black/5 overflow-hidden">
                      <img
                        src={selectedOrder.receipt_image_path}
                        alt="Receipt"
                        onClick={() => setPreviewReceipt(selectedOrder.receipt_image_path!)}
                        className="w-full h-full object-cover cursor-zoom-in"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 border border-dashed border-[#DDD] flex items-center justify-center text-[11px] text-[#888] text-center p-3 shrink-0">
                      {selectedOrder.payment_method === "cod"
                        ? "Cash on Delivery (Pay to LBC courier)"
                        : "No receipt screenshot uploaded"}
                    </div>
                  )}

                  <div className="flex-1 space-y-2.5 text-[13px]">
                    <div>
                      <span className="text-[10px] uppercase text-[#888]">
                        {selectedOrder.payment_method === "cod" ? "Payment Term:" : "Reference Number:"}
                      </span>
                      <p className="font-mono font-bold text-black text-[15px]">
                        {selectedOrder.payment_method === "cod"
                          ? "Cash on Delivery (LBC Express)"
                          : selectedOrder.payment_reference || "None entered"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-[#888]">
                        {selectedOrder.payment_method === "cod" ? "Amount to Collect on Delivery:" : "Total Paid Amount:"}
                      </span>
                      <p className="font-bold text-black text-[16px]">{peso(selectedOrder.total_amount)}</p>
                      {selectedOrder.shipping_fee > 0 && (
                        <p className="text-[11px] text-[#888]">Includes {peso(selectedOrder.shipping_fee)} LBC COD shipping fee</p>
                      )}
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setModalStatus("payment_verified")}
                        className="bg-blue-600 text-white text-[11px] tracking-[0.1em] uppercase px-4 py-2 hover:bg-blue-700"
                      >
                        {selectedOrder.payment_method === "cod" ? "✓ Confirm COD Order" : "✓ Mark Payment Verified"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* COURIER & DISPATCH SETTINGS (PHASE 1) */}
              <div className="p-4 bg-white border border-[#EAEAEA] space-y-4">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-black">
                  Courier & Tracking Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                      Courier Service
                    </label>
                    <select
                      value={modalCourier}
                      onChange={(e) => setModalCourier(e.target.value)}
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2 text-[13px]"
                    >
                      <option value="J&T Express">J&T Express</option>
                      <option value="Flash Express">Flash Express</option>
                      <option value="LBC Express">LBC Express</option>
                      <option value="Lalamove">Lalamove</option>
                      <option value="Other">Other Courier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                      Waybill / Tracking Number
                    </label>
                    <input
                      type="text"
                      value={modalTracking}
                      onChange={(e) => setModalTracking(e.target.value)}
                      placeholder="e.g. 7829103948"
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2 text-[13px] font-mono"
                    />
                  </div>
                </div>

                {modalTracking && (
                  <p className="text-[11px] text-green-700">
                    💡 Smart tracking link will be generated automatically for the customer!
                  </p>
                )}
              </div>

              {/* STATUS & ADMIN NOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                    Overall Order Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as OrderStatus)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2 text-[13px] font-semibold"
                  >
                    <option value="pending_verification">Pending Verification</option>
                    <option value="payment_verified">Payment Verified</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#6B6B6B] mb-1">
                    Internal Admin Notes
                  </label>
                  <input
                    type="text"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="e.g. Verified on GCash app 11:30am"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2 text-[13px]"
                  />
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between sticky bottom-0">
              <button
                type="button"
                onClick={() => setConfirmDelete(selectedOrder.id)}
                className="text-red-600 text-[11px] uppercase tracking-wider hover:underline"
              >
                Delete Order
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-[#EAEAEA] text-[11px] uppercase tracking-wider hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleSaveOrder}
                  className="px-6 py-2 bg-black text-white text-[11px] uppercase tracking-wider hover:bg-[#222] disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR RECEIPT PREVIEW */}
      {previewReceipt && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewReceipt(null)}
        >
          <div className="max-w-xl max-h-[90vh] bg-white p-2">
            <img src={previewReceipt} alt="Receipt Full" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 border border-[#EAEAEA] shadow-xl">
            <h3 className="text-[16px] font-semibold tracking-tight mb-2">Delete Order</h3>
            <p className="text-[13px] text-[#6B6B6B] mb-6">
              Are you sure you want to permanently delete this order? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="px-4 py-2 border border-[#EAEAEA] text-[11px] uppercase tracking-wider hover:bg-[#F5F5F5] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 text-white text-[11px] uppercase tracking-wider hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
