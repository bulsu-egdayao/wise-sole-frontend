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

/**
 * Optimizes large phone photos (e.g. 5MB-10MB 4K photos) down to crisp ~2200px
 * max dimension, preventing payload exceed errors (413 / CORS failure)
 * while preserving high fidelity product details.
 */
async function optimizeProductImage(file: File): Promise<File> {
  // If already under 1.5MB, keep original file untouched
  if (file.size <= 1.5 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 2200;
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
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimized = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(optimized);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.88
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

export async function uploadProductImages(productId: number, files: File[]): Promise<Product> {
  if (files.length === 0) {
    const res = await fetch(`${API_URL}/products/${productId}`);
    return res.json();
  }

  // Optimize files to avoid server 413 or timeout
  const processedFiles: File[] = [];
  for (const f of files) {
    const optimized = await optimizeProductImage(f);
    processedFiles.push(optimized);
  }

  // Upload in chunks of 2 to guarantee successful payloads on any connection
  let lastProduct: Product | null = null;
  const chunkSize = 2;

  for (let i = 0; i < processedFiles.length; i += chunkSize) {
    const chunk = processedFiles.slice(i, i + chunkSize);
    const formData = new FormData();
    chunk.forEach((file) => {
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

    lastProduct = await res.json();
  }

  return lastProduct!;
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
