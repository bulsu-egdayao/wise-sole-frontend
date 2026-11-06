import type { Product } from "./product";

export interface CartItem {
  id: string; // Composite unique key: e.g. `${product.id}-${size || 'default'}`
  productId: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  size?: string | null;
  quantity: number;
  image: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  size: string | null;
  price: number;
  quantity: number;
  image_path: string | null;
}

export type OrderStatus =
  | "pending_verification"
  | "payment_verified"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone: string;
  delivery_address: string;
  delivery_city?: string | null;
  delivery_province?: string | null;
  delivery_notes?: string | null;
  subtotal: number;
  discount_amount: number;
  voucher_code?: string | null;
  shipping_fee: number;
  total_amount: number;
  payment_method: "gcash" | "maribank" | "cod";
  payment_reference?: string | null;
  receipt_image_path?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  status: OrderStatus;
  admin_notes?: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface Voucher {
  id: number;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_spend: number;
  max_discount?: number | null;
  is_active: boolean;
  expires_at?: string | null;
  created_at?: string;
}

export interface PaymentSettings {
  gcash_number: string;
  gcash_name: string;
  gcash_qr_url?: string | null;
  maribank_number: string;
  maribank_name: string;
  maribank_qr_url?: string | null;
  shipping_note: string;
}
