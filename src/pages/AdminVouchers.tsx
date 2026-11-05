import React, { useState, useEffect } from "react";
import {
  getAdminVouchers,
  createVoucher,
  toggleVoucher,
  deleteVoucher,
} from "../services/orderApi";
import type { Voucher } from "../types/order";

interface AdminVouchersProps {
  onBack: () => void;
}

export default function AdminVouchers({ onBack }: AdminVouchersProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New voucher form state
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [creating, setCreating] = useState(false);

  const loadVouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminVouchers();
      setVouchers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    setCreating(true);
    try {
      const created = await createVoucher({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_spend: minSpend ? parseFloat(minSpend) : 0,
        max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
        is_active: true,
      });

      setVouchers((prev) => [created, ...prev]);
      setShowForm(false);
      setCode("");
      setDiscountValue("");
      setMinSpend("");
      setMaxDiscount("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create voucher");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const updated = await toggleVoucher(id);
      setVouchers((prev) => prev.map((v) => (v.id === id ? updated : v)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle voucher");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this voucher?")) return;
    try {
      await deleteVoucher(id);
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete voucher");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <header className="bg-white border-b border-[#EAEAEA] sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-[11px] tracking-[0.1em] uppercase text-[#6B6B6B] hover:text-black flex items-center gap-1.5 transition-colors"
            >
              ← Back to Dashboard
            </button>
            <span className="text-[#DDD]">|</span>
            <h1 className="text-[16px] font-semibold tracking-tight">Promo & Voucher Codes</h1>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="bg-black text-white text-[11px] tracking-[0.1em] uppercase px-4 py-2 hover:bg-[#222] transition-colors"
          >
            {showForm ? "Cancel" : "+ New Voucher"}
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* CREATE VOUCHER FORM */}
        {showForm && (
          <div className="bg-white border border-[#EAEAEA] p-6 mb-8 shadow-xs">
            <h2 className="text-[14px] font-semibold uppercase tracking-wider mb-4">Create New Promo Code</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1">
                  Voucher Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SNEAKER10"
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px]"
                >
                  <option value="percent">Percentage Off (%)</option>
                  <option value="fixed">Fixed Amount Off (₱)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percent" ? "e.g. 10 (for 10%)" : "e.g. 500 (for ₱500)"}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1">
                  Minimum Spend / Purchase (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  placeholder="e.g. 3000 (0 = no minimum)"
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#888] mb-1">
                  Max Discount Cap (₱) <span className="text-[10px] text-[#888]">(optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3.5 py-2.5 text-[13px]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-black text-white text-[11px] tracking-[0.1em] uppercase py-3 hover:bg-[#222] transition-colors disabled:opacity-50"
                >
                  {creating ? "Saving..." : "Save Voucher"}
                </button>
              </div>
            </form>
          </div>
        )}

        {error && <p className="text-[13px] text-red-600 mb-4">{error}</p>}

        {/* VOUCHERS LIST */}
        <div className="bg-white border border-[#EAEAEA] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-[#888] text-[13px]">Loading vouchers...</div>
          ) : vouchers.length === 0 ? (
            <div className="p-12 text-center text-[#888] text-[13px]">
              No vouchers created yet. Click "+ New Voucher" above to create one.
            </div>
          ) : (
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#EAEAEA] text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B]">
                  <th className="py-3.5 px-4 font-medium">Code</th>
                  <th className="py-3.5 px-4 font-medium">Discount</th>
                  <th className="py-3.5 px-4 font-medium">Min Purchase</th>
                  <th className="py-3.5 px-4 font-medium">Max Cap</th>
                  <th className="py-3.5 px-4 font-medium">Status</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-black">{v.code}</td>
                    <td className="py-3.5 px-4 font-medium text-green-700">
                      {v.discount_type === "percent" ? `${v.discount_value}% OFF` : `₱${v.discount_value} OFF`}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B6B]">
                      {v.min_spend > 0 ? `₱${v.min_spend.toLocaleString()}` : "No min spend"}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B6B]">
                      {v.max_discount ? `₱${v.max_discount.toLocaleString()}` : "None"}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggle(v.id)}
                        className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          v.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {v.is_active ? "● Active" : "○ Inactive"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="text-red-600 text-[11px] uppercase tracking-wider hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
