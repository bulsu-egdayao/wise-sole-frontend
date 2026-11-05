import React from "react";
import { useCart } from "../context/CartContext";

function peso(val: number) {
  return "₱" + Math.round(val).toLocaleString("en-PH");
}

export default function CartDrawer() {
  const { isCartOpen, closeCart, items, removeFromCart, updateQuantity, subtotal, count } =
    useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-[420px] bg-white h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[14px] font-semibold tracking-[0.08em] uppercase">Shopping Bag</h2>
            <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              {count}
            </span>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="p-2 -mr-2 text-[#6B6B6B] hover:text-black transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#F0F0F0]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#888]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <p className="text-[14px] font-medium text-black mb-1">Your bag is empty</p>
              <p className="text-[12px] text-[#6B6B6B] mb-6 max-w-[220px]">
                Explore our catalog for the freshest sneakers and streetwear drops.
              </p>
              <a
                href="/shop"
                onClick={closeCart}
                className="bg-black text-white text-[11px] tracking-[0.12em] uppercase px-6 py-3 hover:bg-[#222] transition-colors"
              >
                Shop Collection
              </a>
            </div>
          ) : (
            items.map((item) => {
              const activePrice = item.salePrice && item.salePrice > 0 ? item.salePrice : item.price;
              return (
                <div key={item.id} className="py-4 flex gap-4 items-start">
                  {/* Thumbnail */}
                  <div className="w-20 h-24 bg-[#F5F5F5] shrink-0 overflow-hidden relative border border-[#EAEAEA]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/product/${item.slug}`}
                      className="text-[13px] font-medium text-black line-clamp-1 hover:underline"
                    >
                      {item.name}
                    </a>
                    {item.size && (
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5 tracking-wide">
                        Size: <span className="font-semibold text-black">{item.size}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[13px] font-semibold text-black">{peso(activePrice)}</p>
                      {item.salePrice && item.salePrice > 0 && (
                        <p className="text-[11px] text-[#888] line-through">{peso(item.price)}</p>
                      )}
                    </div>

                    {/* Quantity controls & Remove */}
                    <div className="flex items-center justify-between mt-3 pt-1">
                      <div className="flex items-center border border-[#EAEAEA] bg-[#FBFBFB]">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-[13px] hover:bg-[#EAEAEA] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-[12px] font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-[13px] hover:bg-[#EAEAEA] transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[11px] text-[#888] hover:text-red-600 transition-colors uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#EAEAEA] p-6 bg-[#FAFAFA] space-y-4">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#6B6B6B] uppercase tracking-wider text-[11px]">Subtotal</span>
              <span className="text-[16px] font-semibold text-black">{peso(subtotal)}</span>
            </div>

            <p className="text-[11px] text-[#888] leading-tight">
              Shipping & promotional discounts are calculated at checkout.
            </p>

            <a
              href="/checkout"
              onClick={closeCart}
              className="w-full bg-black text-white text-[12px] tracking-[0.15em] uppercase py-3.5 flex items-center justify-center gap-2 hover:bg-[#222] transition-colors duration-200"
            >
              <span>Proceed to Checkout</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>

            <button
              onClick={closeCart}
              className="w-full text-center text-[11px] text-[#6B6B6B] hover:text-black uppercase tracking-wider py-1"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
