const API_URL = import.meta.env.VITE_API_URL as string;
const STORAGE_URL = API_URL.replace(/\/api\/?$/, "");

export interface TransactionCategory {
  id: number;
  name: string;
  slug: string;
  proofs_count?: number;
  proofs?: LegitimacyProof[];
}

export interface LegitimacyProof {
  id: number;
  transaction_category_id: number;
  image_path: string;
  caption: string | null;
  sort_order: number;
}

export interface Vouch {
  id: number;
  name: string;
  rating: number;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export function legitimacyImageUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${STORAGE_URL}/storage/${path}`;
}

function authHeaders() {
  const token = localStorage.getItem("wise_sole_admin_token");
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ---- Transaction Categories ----

export async function getTransactionCategories(): Promise<TransactionCategory[]> {
  const res = await fetch(`${API_URL}/transaction-categories`);
  if (!res.ok) throw new Error("Failed to load transaction categories");
  return res.json();
}

export async function createTransactionCategory(name: string): Promise<TransactionCategory> {
  const res = await fetch(`${API_URL}/transaction-categories`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to create category");
  }
  return res.json();
}

export async function updateTransactionCategory(id: number, name: string): Promise<TransactionCategory> {
  const res = await fetch(`${API_URL}/transaction-categories/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to update category");
  }
  return res.json();
}

export async function deleteTransactionCategory(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/transaction-categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to delete category");
  }
}

// ---- Legitimacy Proofs ----

export async function getLegitimacyProofs(): Promise<TransactionCategory[]> {
  // Returns categories, each with their proofs nested inside
  const res = await fetch(`${API_URL}/legitimacy-proofs`);
  if (!res.ok) throw new Error("Failed to load legitimacy proofs");
  return res.json();
}

export async function uploadLegitimacyProof(
  categoryId: number,
  file: File,
  caption?: string
): Promise<LegitimacyProof> {
  const formData = new FormData();
  formData.append("transaction_category_id", String(categoryId));
  formData.append("image", file);
  if (caption) formData.append("caption", caption);

  const res = await fetch(`${API_URL}/legitimacy-proofs`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to upload proof photo");
  }
  return res.json();
}

export async function deleteLegitimacyProof(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/legitimacy-proofs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete proof photo");
}

// ---- Vouches ----

// Public: only approved vouches, for the /legitimacy page
export async function getApprovedVouches(): Promise<Vouch[]> {
  const res = await fetch(`${API_URL}/vouches`);
  if (!res.ok) throw new Error("Failed to load vouches");
  return res.json();
}

// Public: anyone can submit a vouch (starts as "pending")
export async function submitVouch(data: { name: string; rating: number; message: string }): Promise<Vouch> {
  const res = await fetch(`${API_URL}/vouches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to submit vouch");
  }
  return res.json();
}

// Admin: all vouches regardless of status
export async function getAllVouchesAdmin(): Promise<Vouch[]> {
  const res = await fetch(`${API_URL}/vouches/admin`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load vouches");
  return res.json();
}

export async function updateVouchStatus(id: number, status: "pending" | "approved" | "rejected"): Promise<Vouch> {
  const res = await fetch(`${API_URL}/vouches/${id}/status`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update vouch status");
  return res.json();
}

export async function deleteVouch(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/vouches/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete vouch");
}