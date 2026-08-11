import type { Product } from "../types/product";
import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL as string;
export const STORAGE_URL = API_URL.replace(/\/api\/?$/, "");

export function imageUrl(path: string): string {
  return `${STORAGE_URL}/storage/${path}`;
}

export async function uploadProductImages(productId: number, files: File[]): Promise<Product> {
  const token = getToken();
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images[]", file);
  });

  const res = await fetch(`${API_URL}/products/${productId}/images`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      // Note: no Content-Type header here — the browser sets it automatically
      // for FormData, including the correct multipart boundary. Setting it
      // manually breaks the upload.
    },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to upload images");
  }

  return res.json();
}

export async function deleteProductImage(productId: number, imageId: number): Promise<Product> {
  const token = getToken();

  const res = await fetch(`${API_URL}/products/${productId}/images/${imageId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete image");
  }

  return res.json();
}