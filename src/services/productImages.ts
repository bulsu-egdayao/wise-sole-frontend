import type { Product } from "../types/product";
import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL as string;
const STORAGE_URL = API_URL.replace(/\/api\/?$/, "");

export function imageUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${STORAGE_URL}/storage/${path}`;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function uploadProductImages(productId: number, files: File[]): Promise<Product> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("images[]", file);
  });

  const res = await fetch(`${API_URL}/products/${productId}/images`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to upload images");
  }

  return res.json();
}

export async function deleteProductImage(productId: number, imageId: number): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${productId}/images/${imageId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to delete image");
  }

  return res.json();
}

// Reorders images by sending the full ordered list of image IDs.
// Whichever ID is first in the array automatically becomes the primary photo.
export async function reorderProductImages(productId: number, imageIds: number[]): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${productId}/images/reorder`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image_ids: imageIds }),
  });

  if (!res.ok) {
    throw new Error("Failed to reorder images");
  }

  return res.json();
}