import type { Category } from "../types/product";
import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL as string;

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getAllCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories`);
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function createCategory(name: string): Promise<Category> {
  const res = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to create category");
  }
  return res.json();
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to update category");
  }
  return res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to delete category");
  }
}

// --- Category images ---

export async function uploadCategoryImage(id: number, file: File): Promise<Category> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_URL}/categories/${id}/image`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to upload image");
  }
  return res.json();
}

export async function uploadCategoryHoverImage(id: number, file: File): Promise<Category> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_URL}/categories/${id}/hover-image`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to upload hover image");
  }
  return res.json();
}

export async function deleteCategoryImage(id: number): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}/image`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove image");
  return res.json();
}

export async function deleteCategoryHoverImage(id: number): Promise<Category> {
  const res = await fetch(`${API_URL}/categories/${id}/hover-image`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove hover image");
  return res.json();
}