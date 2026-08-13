import type { Product, Category, PaginatedResponse } from "../types/product";

const API_URL = import.meta.env.VITE_API_URL as string;

export type SortOption = "newest" | "price_asc" | "price_desc" | "featured";

export interface ShopFilters {
  category?: string; // category slug
  type?: string; // product type slug
  search?: string;
  sort?: SortOption;
  page?: number;
  minPrice?: string;
  maxPrice?: string;
  size?: string;
  onSale?: boolean;
  inStock?: boolean;
}

export async function getShopProducts(filters: ShopFilters): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.minPrice) params.set("min_price", filters.minPrice);
  if (filters.maxPrice) params.set("max_price", filters.maxPrice);
  if (filters.size) params.set("size", filters.size);
  if (filters.onSale) params.set("on_sale", "1");
  if (filters.inStock) params.set("in_stock", "1");

  const res = await fetch(`${API_URL}/products?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to load products");
  }
  return res.json();
}

export async function getShopCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`);
  if (!res.ok) {
    throw new Error("Failed to load categories");
  }
  return res.json();
}

export async function getAvailableSizes(categorySlug?: string): Promise<string[]> {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  const res = await fetch(`${API_URL}/products/sizes?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to load sizes");
  }
  return res.json();
}