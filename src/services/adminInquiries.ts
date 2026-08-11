import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL as string;

export interface Inquiry {
  id: number;
  product_id: number | null;
  name: string;
  contact: string | null;
  message: string;
  status: "new" | "viewed" | "responded";
  created_at: string;
  product?: { id: number; name: string } | null;
}

interface PaginatedInquiries {
  data: Inquiry[];
  current_page: number;
  last_page: number;
  total: number;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getAllInquiries(): Promise<Inquiry[]> {
  const res = await fetch(`${API_URL}/inquiries`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load inquiries");
  const data: PaginatedInquiries = await res.json();
  return data.data || [];
}

export async function updateInquiryStatus(
  id: number,
  status: "new" | "viewed" | "responded"
): Promise<Inquiry> {
  const res = await fetch(`${API_URL}/inquiries/${id}`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to update inquiry");
  }
  return res.json();
}