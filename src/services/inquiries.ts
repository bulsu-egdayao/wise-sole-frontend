const API_URL = import.meta.env.VITE_API_URL as string;

export interface SubmitInquiryPayload {
  product_id: number;
  name: string;
  contact: string;
  message: string;
}

export async function submitInquiry(payload: SubmitInquiryPayload): Promise<void> {
  const res = await fetch(`${API_URL}/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to submit inquiry");
  }
}