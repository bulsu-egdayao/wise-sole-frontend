import type { Product, Category, PaginatedResponse } from "../types/product";

const API_URL = import.meta.env.VITE_API_URL as string;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const res = await fetchJson<PaginatedResponse<Product>>(
    `${API_URL}/products?featured=1`
  );
  return res.data;
}

export async function getNewArrivals(): Promise<Product[]> {
  const res = await fetchJson<PaginatedResponse<Product>>(
    `${API_URL}/products?new=1`
  );
  return res.data;
}

export async function getCategories(): Promise<Category[]> {
  return fetchJson<Category[]>(`${API_URL}/categories`);
}