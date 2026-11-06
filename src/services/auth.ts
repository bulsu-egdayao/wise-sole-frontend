const API_URL = import.meta.env.VITE_API_URL as string;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Backward compatibility alias
export type AdminUser = AuthUser;

interface AuthResponse {
  user: AuthUser;
  token: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Login failed. Check your email and password.");
  }

  return res.json();
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    let msg = errData?.message || "Registration failed.";
    if (errData?.errors) {
      const firstKey = Object.keys(errData.errors)[0];
      if (errData.errors[firstKey]?.[0]) {
        msg = errData.errors[firstKey][0];
      }
    }
    throw new Error(msg);
  }

  return res.json();
}

export async function logout(token: string): Promise<void> {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Session expired");
  }

  return res.json();
}

const TOKEN_KEY = "wise_sole_admin_token";
const CLIENT_USER_KEY = "wise_sole_client_user";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CLIENT_USER_KEY);
}

export function saveClientUser(user: AuthUser) {
  localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(user));
}

export function getStoredClientUser(): AuthUser | null {
  try {
    const item = localStorage.getItem(CLIENT_USER_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}
