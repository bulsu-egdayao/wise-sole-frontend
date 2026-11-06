import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../context/CartContext";
import SiteHeader from "../components/SiteHeader";
import { validateVoucher, createOrder, getPaymentSettings } from "../services/orderApi";
import type { PaymentSettings } from "../types/order";

function peso(val: number) {
  return "\u20B1" + Math.round(val).toLocaleString("en-PH");
}

// ─── PSGC API helpers ────────────────────────────────────────────────────────
const PSGC = "https://psgc.gitlab.io/api";

interface PsgcItem {
  code: string;
  name: string;
}

async function fetchPsgc(url: string): Promise<PsgcItem[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: PsgcItem[] = await res.json();
    return data.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

// ─── Courier config ──────────────────────────────────────────────────────────
interface CourierInfo {
  name: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

const COURIERS: CourierInfo[] = [
  {
    name: "J&T Express",
    shortLabel: "J&T",
    color: "#E8373C",
    bg: "bg-red-50",
    border: "border-red-400",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <circle cx="16" cy="16" r="14" fill="#E8373C" />
        <text x="16" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800" fontFamily="Arial">J&amp;T</text>
      </svg>
    ),
  },
  {
    name: "Flash Express",
    shortLabel: "Flash",
    color: "#F7941D",
    bg: "bg-amber-50",
    border: "border-amber-400",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <circle cx="16" cy="16" r="14" fill="#F7941D" />
        <path d="M18 6L12 18h4l-2 8 8-12h-4l2-8z" fill="#fff" />
      </svg>
    ),
  },
  {
    name: "LBC Express",
    shortLabel: "LBC",
    color: "#C8102E",
    bg: "bg-red-50",
    border: "border-red-400",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <circle cx="16" cy="16" r="14" fill="#C8102E" />
        <text x="16" y="20" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800" fontFamily="Arial">LBC</text>
      </svg>
    ),
  },
  {
    name: "Lalamove",
    shortLabel: "Lalamove",
    color: "#EB6F07",
    bg: "bg-orange-50",
    border: "border-orange-400",
    icon: (
      <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <circle cx="16" cy="16" r="14" fill="#EB6F07" />
        <path d="M10 21h12M10 21l2-8h8l2 8M14 13V9h4v4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="13" cy="23" r="1.5" fill="#fff" />
        <circle cx="19" cy="23" r="1.5" fill="#fff" />
      </svg>
    ),
  },
];

// Provinces where Lalamove is available
const LALAMOVE_PROVINCES = ["Metro Manila (NCR)", "Bulacan"];

// ─── Component ───────────────────────────────────────────────────────────────
export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [houseStreet, setHouseStreet] = useState("");
  const [courierName, setCourierName] = useState("J&T Express");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Philippine address dropdowns
  const [provinces, setProvinces] = useState<PsgcItem[]>([]);
  const [cities, setCities] = useState<PsgcItem[]>([]);
  const [barangays, setBarangays] = useState<PsgcItem[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCityCode, setSelectedCityCode] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "maribank">("gcash");
  const [paymentReference, setPaymentReference] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Voucher states
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
    message?: string;
  } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  // Payment settings from backend
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    gcash_number: "09692891708",
    gcash_name: "Ezekiel Dayao",
    gcash_qr_url: "https://res.cloudinary.com/xrsfekgk/image/upload/v1793934903/site/ksaefvjr0xj3d86forpk.jpg",
    maribank_number: "09692891708",
    maribank_name: "Ezekiel Dayao",
    maribank_qr_url: "https://res.cloudinary.com/xrsfekgk/image/upload/v1793934905/site/s6vb8vawxl8pm0c0v53l.jpg",
    shipping_note: "Standard delivery: 2-4 days Metro Manila, 4-7 days Provincial.",
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Load payment settings ─────────────────────────────────────────────────
  useEffect(() => {
    getPaymentSettings()
      .then(setPaymentSettings)
      .catch((e) => console.warn("Using default payment settings:", e));
  }, []);

  // ─── Load provinces on mount ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Fetch all regular provinces
      const allProvinces = await fetchPsgc(`${PSGC}/provinces`);
      // Add Metro Manila (NCR) as a pseudo-province at the top
      const ncrItem: PsgcItem = { code: "NCR", name: "Metro Manila (NCR)" };
      setProvinces([ncrItem, ...allProvinces]);
    })();
  }, []);

  // ─── Load cities when province changes ─────────────────────────────────────
  const handleProvinceChange = useCallback(async (code: string, name: string) => {
    setSelectedProvince(name);
    setSelectedProvinceCode(code);
    setSelectedCity("");
    setSelectedCityCode("");
    setSelectedBarangay("");
    setCities([]);
    setBarangays([]);

    // If Lalamove is currently selected and the new province doesn't support it, switch courier
    if (courierName === "Lalamove" && !LALAMOVE_PROVINCES.includes(name)) {
      setCourierName("J&T Express");
    }

    if (!code) return;

    setLoadingCities(true);
    let fetched: PsgcItem[] = [];
    if (code === "NCR") {
      // NCR region code = 130000000
      fetched = await fetchPsgc(`${PSGC}/regions/130000000/cities-municipalities`);
    } else {
      fetched = await fetchPsgc(`${PSGC}/provinces/${code}/cities-municipalities`);
    }
    setCities(fetched);
    setLoadingCities(false);
  }, [courierName]);

  // ─── Load barangays when city changes ──────────────────────────────────────
  const handleCityChange = useCallback(async (code: string, name: string) => {
    setSelectedCity(name);
    setSelectedCityCode(code);
    setSelectedBarangay("");
    setBarangays([]);

    if (!code) return;

    setLoadingBarangays(true);
    const fetched = await fetchPsgc(`${PSGC}/cities-municipalities/${code}/barangays`);
    setBarangays(fetched);
    setLoadingBarangays(false);
  }, []);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const isLalamoveAvailable = LALAMOVE_PROVINCES.includes(selectedProvince);
  const deliveryAddress = [houseStreet, selectedBarangay, selectedCity, selectedProvince]
    .filter(Boolean)
    .join(", ");

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    setVoucherError(null);
    setValidatingVoucher(true);

    try {
      const result = await validateVoucher(voucherInput.trim(), subtotal);
      if (result.valid && result.discount_amount !== undefined) {
        setAppliedVoucher({
          code: result.code || voucherInput.toUpperCase(),
          discountAmount: result.discount_amount,
        });
        setVoucherInput("");
      } else {
        setVoucherError(result.message || "Invalid voucher code.");
      }
    } catch {
      setVoucherError("Failed to validate voucher. Please try again.");
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError(null);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const shippingFee = 0; // Free shipping promo by default
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (items.length === 0) {
      setSubmitError("Your shopping bag is empty.");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setSubmitError("Please fill in your name and contact number.");
      return;
    }

    if (!selectedProvince || !selectedCity) {
      setSubmitError("Please select your Province and City/Municipality.");
      return;
    }

    if (!houseStreet.trim()) {
      setSubmitError("Please enter your House/Street address.");
      return;
    }

    if (!receiptFile && !paymentReference.trim()) {
      setSubmitError("Please provide your Payment Reference Number or upload a screenshot of your payment receipt.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("customer_name", customerName.trim());
      formData.append("customer_phone", customerPhone.trim());
      if (customerEmail.trim()) formData.append("customer_email", customerEmail.trim());
      formData.append("delivery_address", deliveryAddress);
      formData.append("delivery_city", selectedCity);
      formData.append("delivery_province", selectedProvince);
      if (deliveryNotes.trim()) formData.append("delivery_notes", deliveryNotes.trim());
      formData.append("courier_name", courierName);
      formData.append("payment_method", paymentMethod);
      if (paymentReference.trim()) formData.append("payment_reference", paymentReference.trim());
      if (appliedVoucher) formData.append("voucher_code", appliedVoucher.code);

      // JSON encoded items for backend transaction
      const itemsPayload = items.map((item) => ({
        product_id: item.productId,
        product_name: item.name,
        size: item.size || null,
        price: item.salePrice && item.salePrice > 0 ? item.salePrice : item.price,
        quantity: item.quantity,
        image_path: item.image,
      }));
      formData.append("items", JSON.stringify(itemsPayload));

      if (receiptFile) {
        formData.append("receipt_image", receiptFile);
      }

      const createdOrder = await createOrder(formData);

      // Clear the local cart
      clearCart();

      // Redirect to Order Tracking / Confirmation page
      window.location.href = `/track?order=${encodeURIComponent(createdOrder.order_number)}&placed=true`;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
      setSubmitting(false);
    }
  };

  // ─── Select styles ─────────────────────────────────────────────────────────
  const selectCls =
    "w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors appearance-none cursor-pointer";

  // ─── Empty bag ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="max-w-[1200px] mx-auto px-5 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#888]" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight mb-2">Your Bag is Empty</h1>
          <p className="text-[13px] text-[#6B6B6B] mb-8">Add sneakers or streetwear to your bag before checking out.</p>
          <a
            href="/shop"
            className="inline-block bg-black text-white text-[11px] tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#1a1a1a] transition-colors"
          >
            Explore Catalog
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <SiteHeader />

      <main className="max-w-[1280px] mx-auto px-5 md:px-10 py-10 md:py-16">
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">Wise Sole Checkout</p>
          <h1 className="text-[26px] md:text-[32px] font-semibold tracking-tight">Complete Your Order</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-start">
          {/* LEFT: CHECKOUT FORM */}
          <div className="lg:col-span-7 space-y-10">
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{submitError}</span>
              </div>
            )}

            {/* STEP 1: CUSTOMER & DELIVERY INFO */}
            <section className="border-b border-[#EAEAEA] pb-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="text-[16px] font-semibold uppercase tracking-[0.08em]">Delivery Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="09171234567"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    Email Address <span className="text-[10px] text-[#888] lowercase">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="juan@gmail.com"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* ─── Province Dropdown ─── */}
                <div>
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    Province / Region <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProvinceCode}
                      onChange={(e) => {
                        const opt = provinces.find((p) => p.code === e.target.value);
                        handleProvinceChange(e.target.value, opt?.name || "");
                      }}
                      className={selectCls}
                    >
                      <option value="">Select Province</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-[#888]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ─── City / Municipality Dropdown ─── */}
                <div>
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    City / Municipality <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCityCode}
                      onChange={(e) => {
                        const opt = cities.find((c) => c.code === e.target.value);
                        handleCityChange(e.target.value, opt?.name || "");
                      }}
                      disabled={!selectedProvinceCode || loadingCities}
                      className={`${selectCls} disabled:opacity-50`}
                    >
                      <option value="">
                        {loadingCities ? "Loading cities..." : !selectedProvinceCode ? "Select province first" : "Select City"}
                      </option>
                      {cities.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-[#888]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ─── Barangay Dropdown ─── */}
                <div>
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    Barangay
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBarangay}
                      onChange={(e) => setSelectedBarangay(e.target.value)}
                      disabled={!selectedCityCode || loadingBarangays}
                      className={`${selectCls} disabled:opacity-50`}
                    >
                      <option value="">
                        {loadingBarangays ? "Loading barangays..." : !selectedCityCode ? "Select city first" : "Select Barangay"}
                      </option>
                      {barangays.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-[#888]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ─── House / Street ─── */}
                <div>
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    House No. / Street <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={houseStreet}
                    onChange={(e) => setHouseStreet(e.target.value)}
                    placeholder="e.g. Blk 5 Lot 10, Dahlia St."
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* ─── Delivery Notes ─── */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    Delivery Notes <span className="text-[10px] text-[#888] lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Gate code: 1234, Landmark: near sari-sari store"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* ─── Courier Preference with branded buttons ─── */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    Courier Preference
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {COURIERS.map((c) => {
                      const isDisabled = c.name === "Lalamove" && !isLalamoveAvailable;
                      const isSelected = courierName === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setCourierName(c.name)}
                          className={`relative py-3 px-3 border text-center transition-all flex flex-col items-center gap-1.5 ${
                            isDisabled
                              ? "border-[#EAEAEA] bg-[#F5F5F5] text-[#BBB] cursor-not-allowed opacity-60"
                              : isSelected
                              ? `${c.border} ${c.bg} font-semibold shadow-sm`
                              : "border-[#EAEAEA] bg-[#F9F9F9] text-black hover:border-black/50"
                          }`}
                          title={isDisabled ? "Lalamove is only available for Metro Manila (NCR) & Bulacan" : c.name}
                        >
                          {c.icon}
                          <span className="text-[11px] font-medium tracking-wide">{c.shortLabel}</span>
                          {isSelected && (
                            <span
                              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: c.color }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {courierName === "Lalamove" && (
                    <p className="text-[11px] text-amber-700 mt-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Lalamove is available for Bulacan &amp; Metro Manila / Quezon City area only.
                    </p>
                  )}
                  <p className="text-[11px] text-[#888] mt-2">
                    {paymentSettings.shipping_note}
                  </p>
                </div>
              </div>
            </section>

            {/* STEP 2: PAYMENT METHOD (GCash & MariBank) */}
            <section className="border-b border-[#EAEAEA] pb-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-[16px] font-semibold uppercase tracking-[0.08em]">Payment Instructions</h2>
              </div>

              {/* Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("gcash")}
                  className={`py-3.5 px-4 border text-center transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === "gcash"
                      ? "border-blue-600 bg-blue-50/50 text-blue-900 font-semibold shadow-xs"
                      : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border ${paymentMethod === "gcash" ? "border-blue-600 bg-blue-600" : "border-gray-400"}`} />
                  <span className="text-[13px] tracking-wide">GCash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("maribank")}
                  className={`py-3.5 px-4 border text-center transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === "maribank"
                      ? "border-amber-600 bg-amber-50/50 text-amber-900 font-semibold shadow-xs"
                      : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border ${paymentMethod === "maribank" ? "border-amber-600 bg-amber-600" : "border-gray-400"}`} />
                  <span className="text-[13px] tracking-wide">MariBank (Shopee)</span>
                </button>
              </div>

              {/* Payment Details Box */}
              <div className="p-5 md:p-6 bg-[#F9F9F9] border border-[#EAEAEA] mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* QR Code if exists */}
                  {(paymentMethod === "gcash" ? paymentSettings.gcash_qr_url : paymentSettings.maribank_qr_url) && (
                    <div className="w-36 h-36 bg-white p-2 border border-[#EAEAEA] shrink-0 mx-auto md:mx-0">
                      <img
                        src={paymentMethod === "gcash" ? paymentSettings.gcash_qr_url! : paymentSettings.maribank_qr_url!}
                        alt={`${paymentMethod} QR`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <p className="text-[10px] tracking-[0.1em] uppercase text-[#888]">Account Name</p>
                      <p className="text-[15px] font-semibold text-black">
                        {paymentMethod === "gcash" ? paymentSettings.gcash_name : paymentSettings.maribank_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] tracking-[0.1em] uppercase text-[#888]">Account Number</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[17px] font-mono font-bold tracking-wider text-black">
                          {paymentMethod === "gcash" ? paymentSettings.gcash_number : paymentSettings.maribank_number}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              paymentMethod === "gcash"
                                ? paymentSettings.gcash_number
                                : paymentSettings.maribank_number,
                              paymentMethod
                            )
                          }
                          className="text-[11px] uppercase tracking-wider bg-white border border-[#DDD] px-2.5 py-1 text-black hover:border-black transition-colors"
                        >
                          {copiedKey === paymentMethod ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EAEAEA]">
                      <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                        Send the exact amount of <span className="font-bold text-black">{peso(grandTotal)}</span> via{" "}
                        {paymentMethod === "gcash" ? "GCash" : "MariBank"}, then upload the screenshot below.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reference Number & Proof Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    Payment Reference / Ref Number <span className="text-[10px] text-[#888] lowercase">(from GCash/MariBank receipt)</span>
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. 1002 9847 1234"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black font-mono transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                    Upload Screenshot of Receipt / Proof of Payment <span className="text-red-500">*</span>
                  </label>
                  
                  {receiptPreview ? (
                    <div className="relative border border-[#EAEAEA] p-3 bg-[#F9F9F9] flex items-center gap-4">
                      <img src={receiptPreview} alt="Receipt preview" className="w-16 h-20 object-cover border border-[#DDD]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-black truncate">{receiptFile?.name}</p>
                        <p className="text-[11px] text-green-600 mt-0.5">{"\u2713"} Ready to upload</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="text-[11px] text-red-600 uppercase tracking-wider hover:underline px-2 py-1"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#DDD] hover:border-black p-6 text-center cursor-pointer block transition-colors bg-[#FAFAFA]">
                      <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#888] mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[12px] font-medium uppercase tracking-wider text-black block mb-0.5">
                        Click to select payment screenshot
                      </span>
                      <span className="text-[11px] text-[#888]">JPG, PNG, or WEBP up to 8MB</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleReceiptChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </section>

            {/* SUBMIT BUTTON */}
            <div>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitOrder}
                className="w-full bg-black text-white text-[13px] tracking-[0.15em] uppercase py-4 hover:bg-[#1a1a1a] transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Processing Order &amp; Uploading Receipt...</span>
                  </>
                ) : (
                  <span>Place Order {"\u2022"} {peso(grandTotal)}</span>
                )}
              </button>
              <p className="text-[11px] text-center text-[#888] mt-3">
                By placing this order, your reservation will be verified and prepared for dispatch.
              </p>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY (STICKY) */}
          <div className="lg:col-span-5 sticky top-28 bg-[#FAFAFA] border border-[#EAEAEA] p-6 space-y-6">
            <h2 className="text-[14px] font-semibold tracking-[0.08em] uppercase border-b border-[#EAEAEA] pb-3">
              Order Summary ({items.length})
            </h2>

            {/* Items list */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 divide-y divide-[#EAEAEA]">
              {items.map((item) => {
                const activePrice = item.salePrice && item.salePrice > 0 ? item.salePrice : item.price;
                return (
                  <div key={item.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                    <img src={item.image} alt={item.name} className="w-14 h-16 object-cover bg-white border border-[#EAEAEA] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-black truncate">{item.name}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[#6B6B6B] mt-0.5">
                        {item.size && <span>Size: {item.size}</span>}
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold text-black shrink-0">
                      {peso(activePrice * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* VOUCHER / PROMO CODE INPUT */}
            <div className="border-t border-[#EAEAEA] pt-5">
              <p className="text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-2 font-medium">Promo / Voucher Code</p>
              
              {appliedVoucher ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 text-green-900 text-[12px]">
                  <div>
                    <span className="font-bold tracking-wider uppercase">{appliedVoucher.code}</span>
                    <span className="ml-2 text-green-700">(-{peso(appliedVoucher.discountAmount)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="text-[11px] text-red-600 uppercase tracking-wider hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. DROP10)"
                    className="flex-1 bg-white border border-[#EAEAEA] px-3.5 py-2.5 text-[13px] uppercase outline-none focus:border-black font-mono transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={validatingVoucher || !voucherInput.trim()}
                    className="bg-black text-white px-4 py-2.5 text-[11px] tracking-[0.1em] uppercase hover:bg-[#222] transition-colors disabled:opacity-40"
                  >
                    {validatingVoucher ? "..." : "Apply"}
                  </button>
                </form>
              )}

              {voucherError && (
                <p className="text-[11px] text-red-600 mt-1.5">{voucherError}</p>
              )}
            </div>

            {/* PRICE BREAKDOWN */}
            <div className="border-t border-[#EAEAEA] pt-4 space-y-2 text-[13px]">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Subtotal</span>
                <span className="text-black font-medium">{peso(subtotal)}</span>
              </div>

              {appliedVoucher && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Voucher Discount</span>
                  <span>-{peso(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#6B6B6B]">
                <span>Shipping</span>
                <span className="text-black font-medium">
                  {shippingFee === 0 ? "FREE" : peso(shippingFee)}
                </span>
              </div>

              <div className="border-t border-[#EAEAEA] pt-3 flex justify-between items-baseline">
                <span className="text-[14px] font-semibold uppercase tracking-wider">Total</span>
                <span className="text-[20px] font-bold text-black">{peso(grandTotal)}</span>
              </div>
            </div>

            {/* TRUST BADGE */}
            <div className="pt-2 border-t border-[#EAEAEA] flex items-center gap-3 text-[11px] text-[#6B6B6B]">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>100% Authentic Guaranteed. Direct delivery via reputable couriers.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
