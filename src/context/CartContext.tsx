import React, { createContext, useContext, useState, useEffect } from "react";
import type { CartItem } from "../types/order";
import type { Product } from "../types/product";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size?: string | null, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  toggleSelectItem: (cartItemId: string) => void;
  selectAll: (selected: boolean) => void;
  clearCart: () => void;
  clearSelectedItems: () => void;
  subtotal: number;
  count: number;
  selectedCount: number;
  allSelected: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "wise_sole_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed: CartItem[] = JSON.parse(saved);
      // Ensure existing saved items default to selected: true if undefined
      return parsed.map((item) => ({
        ...item,
        selected: item.selected !== false,
      }));
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items]);

  const addToCart = (product: Product, size?: string | null, quantity = 1) => {
    const selectedSize = size ? size.trim() : null;
    const cartItemId = `${product.id}-${selectedSize || "default"}`;

    const primaryImage =
      product.images?.find((img) => img.is_primary)?.image_path ||
      product.images?.[0]?.image_path ||
      `https://picsum.photos/seed/wsp${product.id}/700/900`;

    const regularPrice = parseFloat(String(product.price));
    const salePrice = product.sale_price ? parseFloat(String(product.sale_price)) : null;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + quantity, selected: true }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: regularPrice,
          salePrice: salePrice && salePrice > 0 ? salePrice : null,
          size: selectedSize,
          quantity,
          image: primaryImage,
          selected: true,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const toggleSelectItem = (cartItemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, selected: item.selected === false ? true : false } : item
      )
    );
  };

  const selectAll = (selected: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const clearCart = () => {
    setItems([]);
  };

  const clearSelectedItems = () => {
    setItems((prev) => prev.filter((item) => item.selected === false));
  };

  // Subtotal only calculates items selected for checkout
  const subtotal = items
    .filter((item) => item.selected !== false)
    .reduce((sum, item) => {
      const activePrice = item.salePrice && item.salePrice > 0 ? item.salePrice : item.price;
      return sum + activePrice * item.quantity;
    }, 0);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const selectedCount = items
    .filter((item) => item.selected !== false)
    .reduce((sum, item) => sum + item.quantity, 0);

  const allSelected = items.length > 0 && items.every((i) => i.selected !== false);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelectItem,
        selectAll,
        clearCart,
        clearSelectedItems,
        subtotal,
        count,
        selectedCount,
        allSelected,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toggleCart: () => setIsCartOpen((prev) => !prev),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
