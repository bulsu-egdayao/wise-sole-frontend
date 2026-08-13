import type { Product } from "../types/product";
import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL as string;

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface SizeFormRow {
  size: string;
  stock: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  sale_price: string;
  addon_name: string;
  addon_price: string;
  category_id: string;
  product_type_id: string;
  stock: string;
  is_available: boolean;
  is_featured: boolean;
  is_new: boolean;
  sizes: SizeFormRow[];
}

function serializeForm(form: ProductFormData) {
  return {
    name: form.name,
    description: form.description,
    price: form.price,
    sale_price: form.sale_price === "" ? "" : form.sale_price,
    addon_name: form.addon_name === "" ? "" : form.addon_name,
    addon_price: form.addon_price === "" ? "" : form.addon_price,
    category_id: form.category_id,
    product_type_id: form.product_type_id === "" ? null : form.product_type_id,
    stock: form.stock,
    is_available: form.is_available,
    is_featured: form.is_featured,
    is_new: form.is_new,
    sizes: form.sizes
      .filter((s) => s.size.trim() !== "")
      .map((s) => ({ size: s.size.trim(), stock: Number(s.stock) || 0 })),
  };
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products?per_page=100`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load products");
  const data = await res.json();
  return data.data || [];
}

export async function createProduct(form: ProductFormData): Promise<Product> {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serializeForm(form)),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to create product");
  }
  return res.json();
}

export async function updateProduct(id: number, form: ProductFormData): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serializeForm(form)),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to update product");
  }
  return res.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to delete product");
  }
}