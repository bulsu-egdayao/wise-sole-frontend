const API_URL = import.meta.env.VITE_API_URL as string;

export interface ProductType {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  products_count?: number;
}

function authHeaders() {
  const token = localStorage.getItem("wise_sole_admin_token");
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getProductTypes(categoryId?: number): Promise<ProductType[]> {
  const url = categoryId
    ? `${API_URL}/product-types?category_id=${categoryId}`
    : `${API_URL}/product-types`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load product types");
  return res.json();
}

export async function createProductType(categoryId: number, name: string): Promise<ProductType> {
  const res = await fetch(`${API_URL}/product-types`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ category_id: categoryId, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to create type");
  }
  return res.json();
}

export async function updateProductType(id: number, name: string): Promise<ProductType> {
  const res = await fetch(`${API_URL}/product-types/${id}`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to update type");
  }
  return res.json();
}

export async function deleteProductType(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/product-types/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Failed to delete type");
  }
}