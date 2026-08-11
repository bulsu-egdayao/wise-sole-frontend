import React, { useState } from "react";

interface ProductFiltersProps {
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
  selectedSize: string;
  onSizeChange: (v: string) => void;
  availableSizes: string[];
  onSale: boolean;
  onOnSaleChange: (v: boolean) => void;
  inStock: boolean;
  onInStockChange: (v: boolean) => void;
}

function activeFilterCount(props: ProductFiltersProps): number {
  let count = 0;
  if (props.minPrice) count++;
  if (props.maxPrice) count++;
  if (props.selectedSize) count++;
  if (props.onSale) count++;
  if (props.inStock) count++;
  return count;
}

export default function ProductFilters(props: ProductFiltersProps) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(props);

  const clearAll = () => {
    props.onMinPriceChange("");
    props.onMaxPriceChange("");
    props.onSizeChange("");
    props.onOnSaleChange(false);
    props.onInStockChange(false);
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 text-[11px] tracking-[0.08em] uppercase px-4 py-2.5 border transition-colors duration-200 ${
          count > 0 ? "bg-black text-white border-black" : "border-[#EAEAEA] text-black hover:border-black"
        }`}
      >
        Filters {count > 0 ? `(${count})` : ""}
        <span className={`inline-block transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? "400px" : "0px" }}
      >
        <div className="border border-[#EAEAEA] p-5 mt-3 flex flex-col md:flex-row md:flex-wrap gap-6">
          {/* PRICE RANGE */}
          <div>
            <p className="text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-2">Price Range (₱)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={props.minPrice}
                onChange={(e) => props.onMinPriceChange(e.target.value)}
                placeholder="Min"
                className="w-24 bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-black transition-colors duration-200"
              />
              <span className="text-[#6B6B6B] text-[12px]">–</span>
              <input
                type="number"
                min="0"
                value={props.maxPrice}
                onChange={(e) => props.onMaxPriceChange(e.target.value)}
                placeholder="Max"
                className="w-24 bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2 text-[13px] outline-none focus:border-black transition-colors duration-200"
              />
            </div>
          </div>

          {/* SIZE */}
          {props.availableSizes.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-2">Size</p>
              <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                <button
                  onClick={() => props.onSizeChange("")}
                  className={`text-[11px] px-3 py-1.5 border transition-colors duration-200 ${
                    props.selectedSize === ""
                      ? "bg-black text-white border-black"
                      : "border-[#EAEAEA] text-black hover:border-black"
                  }`}
                >
                  All
                </button>
                {props.availableSizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => props.onSizeChange(s)}
                    className={`text-[11px] px-3 py-1.5 border transition-colors duration-200 ${
                      props.selectedSize === s
                        ? "bg-black text-white border-black"
                        : "border-[#EAEAEA] text-black hover:border-black"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TOGGLES */}
          <div className="flex flex-col gap-2.5 justify-center">
            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
              <input
                type="checkbox"
                checked={props.onSale}
                onChange={(e) => props.onOnSaleChange(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              On Sale Only
            </label>
            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
              <input
                type="checkbox"
                checked={props.inStock}
                onChange={(e) => props.onInStockChange(e.target.checked)}
                className="w-4 h-4 accent-black"
              />
              In Stock Only
            </label>
          </div>

          {count > 0 && (
            <div className="flex items-end">
              <button
                onClick={clearAll}
                className="text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] hover:text-black border-b border-[#6B6B6B] hover:border-black pb-0.5 transition-colors duration-200"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}