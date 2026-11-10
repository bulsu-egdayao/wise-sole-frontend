import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "../context/CartContext";
import SiteHeader from "../components/SiteHeader";
import { validateVoucher, createOrder, getPaymentSettings } from "../services/orderApi";
import type { PaymentSettings } from "../types/order";

// Payment method official brand logos
import gcashLogo from "../assets/payment-gcash.png";
import maribankLogo from "../assets/payment-maribank.png";

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

async function compressReceiptImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (file.size <= 400 * 1024) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDimension = 1400;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressed);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.82
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function calculateLbcRate(provinceName: string): number {
  const p = (provinceName || "").toLowerCase();
  if (!p) return 150;
  if (
    p.includes("manila") ||
    p.includes("ncr") ||
    p.includes("quezon city") ||
    p.includes("makati") ||
    p.includes("taguig") ||
    p.includes("pasig") ||
    p.includes("pasay") ||
    p.includes("paranaque") ||
    p.includes("las pinas") ||
    p.includes("muntinlupa") ||
    p.includes("caloocan") ||
    p.includes("malabon") ||
    p.includes("navotas") ||
    p.includes("valenzuela") ||
    p.includes("marikina") ||
    p.includes("mandaluyong") ||
    p.includes("san juan") ||
    p.includes("pateros")
  ) {
    return 150;
  }
  if (
    p.includes("bulacan") ||
    p.includes("pampanga") ||
    p.includes("bataan") ||
    p.includes("zambales") ||
    p.includes("tarlac") ||
    p.includes("nueva ecija")
  ) {
    return 165;
  }
  const luzonKeywords = [
    "rizal", "cavite", "laguna", "batangas", "quezon", "pangasinan", "la union", "ilocos",
    "benguet", "isabela", "cagayan", "nueva vizcaya", "quirino", "abra", "apayao", "ifugao",
    "kalinga", "mountain province", "aurora", "camarines", "albay", "sorsogon", "catanduanes", "masbate",
    "marinduque", "occidental mindoro", "oriental mindoro", "palawan", "romblon"
  ];
  if (luzonKeywords.some((k) => p.includes(k))) {
    return 180;
  }
  const visayasKeywords = [
    "cebu", "bohol", "iloilo", "leyte", "negros", "samar", "aklan", "antique", "capiz", "guimaras",
    "biliran", "siquijor"
  ];
  if (visayasKeywords.some((k) => p.includes(k))) {
    return 215;
  }
  // Mindanao & Island provinces
  return 235;
}

export default function Checkout() {
  const { items, clearSelectedItems } = useCart();
  const checkoutItems = items.filter((item) => item.selected !== false);
  const checkoutSubtotal = checkoutItems.reduce((sum, item) => {
    const activePrice = item.salePrice && item.salePrice > 0 ? item.salePrice : item.price;
    return sum + activePrice * item.quantity;
  }, 0);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [houseStreet, setHouseStreet] = useState("");
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

  // Payment method: H&M Accordion (gcash | maribank | cod | null) — unselected by default
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "maribank" | "cod" | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // QR Modal zoom
  const [zoomQr, setZoomQr] = useState<string | null>(null);

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
    shipping_note: "Standard delivery: 2-4 days Metro Manila/Bulacan, 4-7 days Provincial.",
    cod_enabled: false,
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Load payment settings ─────────────────────────────────────────────────
  useEffect(() => {
    getPaymentSettings()
      .then((settings) => {
        setPaymentSettings(settings);
        if (settings.cod_enabled === false) {
          setPaymentMethod((prev) => (prev === "cod" ? null : prev));
        }
      })
      .catch((e) => console.warn("Using default payment settings:", e));
  }, []);

  // ─── Load provinces on mount ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const allProvinces = await fetchPsgc(`${PSGC}/provinces`);
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

    if (!code) return;

    setLoadingCities(true);
    let fetched: PsgcItem[] = [];
    if (code === "NCR") {
      fetched = await fetchPsgc(`${PSGC}/regions/130000000/cities-municipalities`);
    } else {
      fetched = await fetchPsgc(`${PSGC}/provinces/${code}/cities-municipalities`);
    }
    setCities(fetched);
    setLoadingCities(false);
  }, []);

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

  // ─── Derived calculations ──────────────────────────────────────────────────
  const deliveryAddress = [houseStreet, selectedBarangay, selectedCity, selectedProvince]
    .filter(Boolean)
    .join(", ");

  const activeQrUrl =
    paymentMethod === "gcash"
      ? paymentSettings.gcash_qr_url
      : paymentMethod === "maribank"
      ? paymentSettings.maribank_qr_url
      : null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadQr = async () => {
    if (!activeQrUrl) return;
    try {
      const response = await fetch(activeQrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `wise-sole-${paymentMethod}-qr.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(activeQrUrl, "_blank");
    }
  };

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    setVoucherError(null);
    setValidatingVoucher(true);

    try {
      const result = await validateVoucher(voucherInput.trim(), checkoutSubtotal);
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

  const handleReceiptChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptPreview(URL.createObjectURL(file));
      try {
        const compressed = await compressReceiptImage(file);
        setReceiptFile(compressed);
      } catch {
        setReceiptFile(file);
      }
    }
  };

  // Free shipping for prepaid orders (GCash / MariBank); Dynamic LBC rate for Cash on Delivery
  const isCod = paymentMethod === "cod" && !!paymentSettings.cod_enabled;
  const estimatedLbcFee = calculateLbcRate(selectedProvince);
  const shippingFee = isCod ? estimatedLbcFee : 0;
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const grandTotal = Math.max(0, checkoutSubtotal - discountAmount + shippingFee);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (checkoutItems.length === 0) {
      setSubmitError("No items selected for checkout. Please return to your shopping bag to select items.");
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

    if (!paymentMethod) {
      setSubmitError(
        paymentSettings.cod_enabled
          ? "Please select your preferred Payment Method (GCash, MariBank, or Cash on Delivery)."
          : "Please select your preferred Payment Method (GCash or MariBank)."
      );
      return;
    }

    if (paymentMethod === "cod" && !paymentSettings.cod_enabled) {
      setSubmitError("Cash on Delivery is temporarily unavailable. Please select GCash or MariBank.");
      return;
    }

    // GCash and MariBank require proof of payment; COD does not
    if (!isCod && !receiptFile && !paymentReference.trim()) {
      setSubmitError("Please enter your Reference Number or upload a screenshot of your payment receipt.");
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
      
      // Courier is assigned by Admin upon dispatch; COD orders ship via LBC Express
      formData.append("courier_name", isCod ? "LBC Express" : "To Be Assigned");
      formData.append("payment_method", paymentMethod);
      if (paymentReference.trim()) formData.append("payment_reference", paymentReference.trim());
      if (appliedVoucher) formData.append("voucher_code", appliedVoucher.code);

      const itemsPayload = checkoutItems.map((item) => ({
        product_id: item.productId,
        product_name: item.name,
        size: item.size || null,
        price: item.salePrice && item.salePrice > 0 ? item.salePrice : item.price,
        quantity: item.quantity,
        image_path: item.image,
      }));
      formData.append("items", JSON.stringify(itemsPayload));

      if (receiptFile && !isCod) {
        formData.append("receipt_image", receiptFile);
      }

      const createdOrder = await createOrder(formData);

      clearSelectedItems();

      window.location.href = `/track?order=${encodeURIComponent(createdOrder.order_number)}&placed=true`;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
      setSubmitting(false);
    }
  };

  const selectCls =
    "w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors appearance-none cursor-pointer";

  if (checkoutItems.length === 0) {
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
            className="inline-block bg-black text-white text-[11px] tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#1a1a1a] transition-all hover:-translate-y-0.5"
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

            {/* STEP 1: CUSTOMER & DELIVERY INFO (Courier selection removed as requested) */}
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
                    placeholder="e.g. Landmark: near church, leave at front gate"
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Reassurance Banner: Admin handles courier dispatch */}
                <div className="md:col-span-2 mt-2 p-3.5 bg-[#FAFAFA] border border-[#EAEAEA] flex items-start gap-3">
                  <svg className="w-4 h-4 text-black shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V3.75a1.125 1.125 0 0 0-1.125-1.125h-6.75A1.125 1.125 0 0 0 4.5 3.75v10.5" />
                  </svg>
                  <div className="text-[11px] text-[#6B6B6B] leading-relaxed">
                    <span className="font-semibold text-black uppercase tracking-wider block mb-0.5">Dispatched by Wise Sole Fulfillment</span>
                    Wise Sole partners with premium couriers (J&amp;T Express, Flash Express, and LBC Express). Our dispatch team selects the fastest route for your address and provides live tracking within 24 hours.
                  </div>
                </div>
              </div>
            </section>

            {/* STEP 2: PAYMENT METHOD (H&M MINIMALIST RADIO ACCORDION TEMPLATE) */}
            <section className="border-b border-[#EAEAEA] pb-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="text-[16px] font-semibold uppercase tracking-[0.08em]">Payment Method</h2>
              </div>

              {/* H&M Minimalist Stacked Radio Accordion */}
              <div className="border border-[#EAEAEA] divide-y divide-[#EAEAEA] bg-white">
                
                {/* ─── OPTION 1: GCASH ─── */}
                <div className="transition-colors">
                  <div
                    onClick={() => setPaymentMethod("gcash")}
                    className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${
                      paymentMethod === "gcash" ? "bg-[#FAFAFA]" : "hover:bg-[#FDFDFD]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* H&M Custom Radio */}
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          paymentMethod === "gcash" ? "border-black" : "border-[#BBB]"
                        }`}
                      >
                        {paymentMethod === "gcash" && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>

                      {/* GCash Official Logo */}
                      <div className="h-6 flex items-center">
                        <img src={gcashLogo} alt="GCash" className="h-5 md:h-6 object-contain" />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] tracking-wider uppercase text-green-700 bg-green-50 px-2.5 py-1 border border-green-200 font-semibold">
                        Free Shipping
                      </span>
                    </div>
                  </div>

                  {/* Expanded GCash Accordion Body */}
                  {paymentMethod === "gcash" && (
                    <div className="px-4 md:px-6 pb-6 pt-2 bg-[#FAFAFA] border-t border-[#EAEAEA] animate-in fade-in duration-200">
                      <div className="p-4 md:p-6 bg-white border border-[#EAEAEA] mb-5">
                        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                          {/* Large Visible QR */}
                          {paymentSettings.gcash_qr_url && (
                            <div className="flex flex-col items-center gap-2.5 shrink-0">
                              <div
                                onClick={() => setZoomQr(paymentSettings.gcash_qr_url!)}
                                className="group relative w-52 h-52 sm:w-56 sm:h-56 bg-white p-2.5 border-2 border-black/80 shadow-md cursor-pointer hover:border-black transition-all"
                                title="Click to view full screen"
                              >
                                <img
                                  src={paymentSettings.gcash_qr_url}
                                  alt="GCash QR Code"
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-semibold tracking-wider uppercase">
                                  Click to Enlarge
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleDownloadQr}
                                className="w-full py-2 px-3 bg-white border border-[#DDD] hover:border-black text-[11px] font-medium uppercase tracking-wider text-black flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Save QR to Photos</span>
                              </button>
                            </div>
                          )}

                          <div className="flex-1 space-y-4 w-full">
                            <div>
                              <p className="text-[10px] tracking-[0.1em] uppercase text-[#888]">Account Name</p>
                              <p className="text-[16px] font-bold text-black tracking-tight">
                                {paymentSettings.gcash_name}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] tracking-[0.1em] uppercase text-[#888]">GCash Mobile Number</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[20px] font-mono font-bold tracking-wider text-black">
                                  {paymentSettings.gcash_number}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(paymentSettings.gcash_number, "gcash")}
                                  className="text-[11px] uppercase tracking-wider bg-white border border-[#DDD] px-3 py-1.5 text-black hover:border-black transition-colors font-medium"
                                >
                                  {copiedKey === "gcash" ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[#EAEAEA] space-y-1">
                              <p className="text-[12px] text-black font-semibold">
                                Exact Amount: <span className="text-[15px] underline">{peso(grandTotal)}</span>
                              </p>
                              <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                                Send via GCash app, then enter your Reference Number and upload the receipt screenshot below.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Proof Inputs */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                            GCash Reference Number <span className="text-[10px] text-[#888] lowercase">(Ref No. on receipt)</span>
                          </label>
                          <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="e.g. 1002 9847 1234"
                            className="w-full bg-white border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black font-mono transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                            Upload Payment Receipt Screenshot <span className="text-red-500">*</span>
                          </label>
                          {receiptPreview ? (
                            <div className="relative border border-[#EAEAEA] p-3 bg-white flex items-center gap-4">
                              <img src={receiptPreview} alt="Receipt preview" className="w-16 h-20 object-cover border border-[#DDD]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-black truncate">{receiptFile?.name}</p>
                                <p className="text-[11px] text-green-600 mt-0.5">{"\u2713"} Compressed and ready to upload</p>
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
                            <label className="border-2 border-dashed border-[#DDD] hover:border-black p-5 text-center cursor-pointer block transition-colors bg-white">
                              <span className="text-[12px] font-medium uppercase tracking-wider text-black block mb-0.5">
                                Click to select screenshot
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
                    </div>
                  )}
                </div>

                {/* ─── OPTION 2: MARIBANK ─── */}
                <div className="transition-colors">
                  <div
                    onClick={() => setPaymentMethod("maribank")}
                    className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${
                      paymentMethod === "maribank" ? "bg-[#FAFAFA]" : "hover:bg-[#FDFDFD]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* H&M Custom Radio */}
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          paymentMethod === "maribank" ? "border-black" : "border-[#BBB]"
                        }`}
                      >
                        {paymentMethod === "maribank" && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>

                      {/* MariBank Official Logo */}
                      <div className="h-6 flex items-center">
                        <img src={maribankLogo} alt="MariBank" className="h-5 md:h-6 object-contain" />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] tracking-wider uppercase text-green-700 bg-green-50 px-2.5 py-1 border border-green-200 font-semibold">
                        Free Shipping
                      </span>
                    </div>
                  </div>

                  {/* Expanded MariBank Accordion Body */}
                  {paymentMethod === "maribank" && (
                    <div className="px-4 md:px-6 pb-6 pt-2 bg-[#FAFAFA] border-t border-[#EAEAEA] animate-in fade-in duration-200">
                      <div className="p-4 md:p-6 bg-white border border-[#EAEAEA] mb-5">
                        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                          {/* Large Visible QR */}
                          {paymentSettings.maribank_qr_url && (
                            <div className="flex flex-col items-center gap-2.5 shrink-0">
                              <div
                                onClick={() => setZoomQr(paymentSettings.maribank_qr_url!)}
                                className="group relative w-52 h-52 sm:w-56 sm:h-56 bg-white p-2.5 border-2 border-black/80 shadow-md cursor-pointer hover:border-black transition-all"
                                title="Click to view full screen"
                              >
                                <img
                                  src={paymentSettings.maribank_qr_url}
                                  alt="MariBank QR Code"
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-semibold tracking-wider uppercase">
                                  Click to Enlarge
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleDownloadQr}
                                className="w-full py-2 px-3 bg-white border border-[#DDD] hover:border-black text-[11px] font-medium uppercase tracking-wider text-black flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span>Save QR to Photos</span>
                              </button>
                            </div>
                          )}

                          <div className="flex-1 space-y-4 w-full">
                            <div>
                              <p className="text-[10px] tracking-[0.1em] uppercase text-[#888]">Account Name</p>
                              <p className="text-[16px] font-bold text-black tracking-tight">
                                {paymentSettings.maribank_name}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] tracking-[0.1em] uppercase text-[#888]">MariBank Account / Phone Number</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[20px] font-mono font-bold tracking-wider text-black">
                                  {paymentSettings.maribank_number}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(paymentSettings.maribank_number, "maribank")}
                                  className="text-[11px] uppercase tracking-wider bg-white border border-[#DDD] px-3 py-1.5 text-black hover:border-black transition-colors font-medium"
                                >
                                  {copiedKey === "maribank" ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[#EAEAEA] space-y-1">
                              <p className="text-[12px] text-black font-semibold">
                                Exact Amount: <span className="text-[15px] underline">{peso(grandTotal)}</span>
                              </p>
                              <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                                Transfer via MariBank / ShopeePay / InstaPay, then enter your Reference Number and upload your receipt screenshot below.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Proof Inputs */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                            MariBank Reference Number <span className="text-[10px] text-[#888] lowercase">(Transaction ID)</span>
                          </label>
                          <input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="e.g. MB261106-98124"
                            className="w-full bg-white border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black font-mono transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                            Upload Payment Receipt Screenshot <span className="text-red-500">*</span>
                          </label>
                          {receiptPreview ? (
                            <div className="relative border border-[#EAEAEA] p-3 bg-white flex items-center gap-4">
                              <img src={receiptPreview} alt="Receipt preview" className="w-16 h-20 object-cover border border-[#DDD]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-black truncate">{receiptFile?.name}</p>
                                <p className="text-[11px] text-green-600 mt-0.5">{"\u2713"} Compressed and ready to upload</p>
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
                            <label className="border-2 border-dashed border-[#DDD] hover:border-black p-5 text-center cursor-pointer block transition-colors bg-white">
                              <span className="text-[12px] font-medium uppercase tracking-wider text-black block mb-0.5">
                                Click to select screenshot
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
                    </div>
                  )}
                </div>

                {/* ─── OPTION 3: CASH ON DELIVERY (COD) ─── */}
                {paymentSettings.cod_enabled ? (
                  <div className="transition-colors">
                    <div
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex items-center justify-between p-4 cursor-pointer select-none transition-colors ${
                        paymentMethod === "cod" ? "bg-[#FAFAFA]" : "hover:bg-[#FDFDFD]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* H&M Custom Radio */}
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            paymentMethod === "cod" ? "border-black" : "border-[#BBB]"
                          }`}
                        >
                          {paymentMethod === "cod" && <div className="w-2 h-2 rounded-full bg-black" />}
                        </div>

                        {/* Minimalist COD Icon */}
                        <div className="flex items-center gap-1.5 border border-black/80 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-black">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                          <span>CASH ON DELIVERY</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] tracking-wider uppercase text-[#666] bg-[#F5F5F5] px-2.5 py-1 border border-[#EAEAEA] font-medium">
                          + Shipping Fee
                        </span>
                      </div>
                    </div>

                    {/* Expanded COD Accordion Body */}
                    {paymentMethod === "cod" && (
                      <div className="px-4 md:px-6 pb-6 pt-2 bg-[#FAFAFA] border-t border-[#EAEAEA] animate-in fade-in duration-200">
                        <div className="p-4 md:p-6 bg-white border border-[#EAEAEA] space-y-3.5">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-[13px] font-bold uppercase tracking-wider text-black">
                                LBC Express Cash on Delivery
                              </h3>
                              <p className="text-[12px] text-[#555] leading-relaxed mt-1">
                                Pay in cash directly to the LBC courier upon delivery of your package to your doorstep.
                              </p>
                            </div>
                          </div>

                          <div className="p-3 bg-[#F9F9F9] border border-[#EAEAEA] space-y-1.5 text-[12px]">
                            <div className="flex justify-between items-center text-black font-semibold">
                              <span>Estimated LBC Shipping Fee:</span>
                              <span className="text-black font-bold">{peso(shippingFee)}</span>
                            </div>
                            <p className="text-[11px] text-[#767676] leading-relaxed">
                              Estimated rate for standard ~1.2kg shoebox to <strong className="text-black">{selectedProvince || "your province"}</strong> via LBC Express. Official waybill and final weight verified upon branch drop-off.
                            </p>
                            <p className="text-[11px] text-green-700 font-medium">
                              ✓ No receipt screenshot or advance payment needed. Simply prepare exact cash on delivery day.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-[#FAFAFA] select-none opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-3.5">
                      <div className="w-4 h-4 rounded-full border border-[#CCC] flex items-center justify-center shrink-0" />
                      <div className="flex items-center gap-1.5 border border-[#DDD] px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-[#888]">
                        <svg className="w-3.5 h-3.5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <span>CASH ON DELIVERY</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] tracking-wider uppercase text-[#777] bg-[#EAEAEA] px-2.5 py-1 font-medium">
                        Temporarily Unavailable
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </section>

            {/* SUBMIT BUTTON & CANCEL BUTTON */}
            <div>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitOrder}
                className="w-full bg-black text-white text-[13px] tracking-[0.15em] uppercase py-4 hover:bg-[#1a1a1a] transition-all hover:-translate-y-0.5 duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Processing Order...</span>
                  </>
                ) : !paymentMethod ? (
                  <span>Select Payment Method to Proceed • {peso(grandTotal)}</span>
                ) : (
                  <span>
                    Place Order {isCod ? "• Cash on Delivery" : ""} • {peso(grandTotal)}
                  </span>
                )}
              </button>

              <a
                href="/shop"
                className="w-full border border-[#EAEAEA] text-black text-[12px] tracking-[0.14em] uppercase py-3.5 hover:border-black transition-colors duration-200 text-center block mt-3"
              >
                Cancel Order &amp; Return to Shop
              </a>

              <p className="text-[11px] text-center text-[#888] mt-3">
                By placing this order, your reservation is secured and will be prepared for dispatch.
              </p>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY (STICKY) */}
          <div className="lg:col-span-5 sticky top-28 bg-[#FAFAFA] border border-[#EAEAEA] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-3">
              <h2 className="text-[14px] font-semibold tracking-[0.08em] uppercase">
                Order Summary ({checkoutItems.length})
              </h2>
              {/* URGENCY BADGE */}
              <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-700 bg-amber-50 px-2.5 py-1 border border-amber-200">
                Only 1 Pair Left in Each Size
              </span>
            </div>

            {/* Items list */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 divide-y divide-[#EAEAEA]">
              {checkoutItems.map((item) => {
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
                <span className="text-black font-medium">{peso(checkoutSubtotal)}</span>
              </div>

              {appliedVoucher && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Voucher Discount</span>
                  <span>-{peso(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#6B6B6B]">
                <span>
                  Shipping {paymentMethod === null ? "(Select payment)" : isCod ? `(LBC Express COD to ${selectedProvince || "Provincial"})` : "(Prepaid 100% Free Shipping)"}
                </span>
                <span className="text-black font-medium">
                  {paymentMethod === null ? "—" : shippingFee === 0 ? "FREE" : peso(shippingFee)}
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
              <span>Top Tier UA 1:1 Batch Guaranteed. Precision materials, complete accessories, and real-time tracking.</span>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL FOR QR FULLSCREEN ZOOM */}
      {zoomQr && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomQr(null)}
        >
          <div
            className="bg-white p-5 max-w-sm w-full text-center max-h-[92vh] flex flex-col items-center shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[12px] font-semibold uppercase tracking-wider mb-2 text-black shrink-0">
              Scan {paymentMethod === "gcash" ? "GCash" : "MariBank"} QR
            </p>
            <div className="flex-1 min-h-0 w-full flex items-center justify-center p-1 overflow-hidden my-1">
              <img
                src={zoomQr}
                alt="Zoomed QR"
                className="max-h-[62vh] max-w-full w-auto h-auto object-contain mx-auto border border-[#EAEAEA]"
              />
            </div>
            <div className="mt-3 flex gap-2 w-full shrink-0">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex-1 py-2.5 bg-black text-white text-[11px] uppercase tracking-wider hover:bg-[#222] transition-colors"
              >
                Save Image
              </button>
              <button
                type="button"
                onClick={() => setZoomQr(null)}
                className="px-5 py-2.5 border border-[#DDD] hover:border-black text-[11px] uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
