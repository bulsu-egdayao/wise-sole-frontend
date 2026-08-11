import { useState, useEffect } from "react";

const STORAGE_KEY = "wise_sole_favorites";

function loadFavorites(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    // localStorage might be unavailable (private browsing, disabled cookies, etc.)
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() => loadFavorites());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Fail silently — favorites just won't persist this session
    }
  }, [favorites]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const isFavorite = (id: number) => favorites.includes(id);

  return { favorites, toggleFavorite, isFavorite };
}