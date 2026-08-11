import type { Product, PaginatedResponse } from "../types/product";

const API_URL = import.meta.env.VITE_API_URL as string;

export async function getProductBySlug(slug: string): Promise<Product> {
  const res = await fetch(`${API_URL}/products/slug/${slug}`);
  if (!res.ok) {
    throw new Error("Product not found");
  }
  return res.json();
}

export async function getProductById(id: number): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) {
    throw new Error("Product not found");
  }
  return res.json();
}

export async function getRelatedProducts(categorySlug: string, excludeProductId: number): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products?category=${categorySlug}`);
  if (!res.ok) {
    throw new Error("Failed to load related products");
  }
  const data: PaginatedResponse<Product> = await res.json();
  return data.data.filter((p) => p.id !== excludeProductId).slice(0, 3);
}