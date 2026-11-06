import type { Order, Voucher, PaymentSettings } from "../types/order";
import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL as string;

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface VoucherValidationResult {
  valid: boolean;
  code?: string;
  discount_type?: "percent" | "fixed";
  discount_value?: number;
  discount_amount?: number;
  min_spend?: number;
  new_total?: number;
  message?: string;
}

export async function validateVoucher(
  code: string,
  subtotal: number
): Promise<VoucherValidationResult> {
  const res = await fetch(`${API_URL}/vouchers/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ code, subtotal }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      valid: false,
      message: data.message || "Invalid or ineligible voucher code.",
    };
  }
  return data as VoucherValidationResult;
}

export async function createOrder(formData: FormData): Promise<Order> {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to place order. Please review your details.");
  }
  return data as Order;
}

export async function trackOrder(orderNumber: string): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/track/${encodeURIComponent(orderNumber.trim())}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Order not found. Please verify your order number.");
  }
  return data as Order;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const res = await fetch(`${API_URL}/payment-settings`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    return {
      gcash_number: "09692891708",
      gcash_name: "Ezekiel Dayao",
      gcash_qr_url: "https://res.cloudinary.com/xrsfekgk/image/upload/v1793934903/site/ksaefvjr0xj3d86forpk.jpg",
      maribank_number: "09692891708",
      maribank_name: "Ezekiel Dayao",
      maribank_qr_url: "https://res.cloudinary.com/xrsfekgk/image/upload/v1793934905/site/s6vb8vawxl8pm0c0v53l.jpg",
      shipping_note: "Standard delivery: 2-4 days Metro Manila, 4-7 days Provincial.",
    };
  }
  return res.json() as Promise<PaymentSettings>;
}

// ─── ADMIN APIs ─────────────────────────────────────────────────────────────

export interface AdminOrdersResponse {
  data: Order[];
  current_page: number;
  last_page: number;
  total: number;
}

export async function getAdminOrders(
  page = 1,
  status = "all",
  search = ""
): Promise<AdminOrdersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    status,
    ...(search ? { search } : {}),
  });

  const res = await fetch(`${API_URL}/orders?${params.toString()}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to load orders");
  }
  return res.json() as Promise<AdminOrdersResponse>;
}

export async function updateOrderStatus(
  orderId: number,
  data: {
    status: Order["status"];
    courier_name?: string;
    tracking_number?: string;
    tracking_url?: string;
    admin_notes?: string;
  }
): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update order status");
  }
  return res.json() as Promise<Order>;
}

export async function deleteOrder(orderId: number): Promise<void> {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to delete order");
  }
}

export async function getAdminVouchers(): Promise<Voucher[]> {
  const res = await fetch(`${API_URL}/vouchers`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to load vouchers");
  }
  return res.json() as Promise<Voucher[]>;
}

export async function createVoucher(data: Partial<Voucher>): Promise<Voucher> {
  const res = await fetch(`${API_URL}/vouchers`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create voucher");
  }
  return res.json() as Promise<Voucher>;
}

export async function toggleVoucher(id: number): Promise<Voucher> {
  const res = await fetch(`${API_URL}/vouchers/${id}/toggle`, {
    method: "PUT",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to toggle voucher");
  }
  return res.json() as Promise<Voucher>;
}

export async function deleteVoucher(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/vouchers/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to delete voucher");
  }
}

export async function updatePaymentSettings(
  data: Partial<PaymentSettings>
): Promise<PaymentSettings> {
  const res = await fetch(`${API_URL}/payment-settings`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update payment settings");
  }
  return res.json() as Promise<PaymentSettings>;
}
