import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL as string;
const STORAGE_URL = API_URL.replace(/\/api\/?$/, "");

export type SiteImageKey = "hero_main" | "hero_side_1" | "hero_side_2" | "about_photo";

export type SiteImagesMap = Partial<Record<SiteImageKey, string>>;

export function siteImageUrl(path: string): string {
  return `${STORAGE_URL}/storage/${path}`;
}

export async function getSiteImages(): Promise<SiteImagesMap> {
  const res = await fetch(`${API_URL}/site-images`);
  if (!res.ok) {
    throw new Error("Failed to load site images");
  }
  return res.json();
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function uploadSiteImage(key: SiteImageKey, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/site-images/${key}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to upload image");
  }
}

export async function deleteSiteImage(key: SiteImageKey): Promise<void> {
  const res = await fetch(`${API_URL}/site-images/${key}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to delete image");
  }
}