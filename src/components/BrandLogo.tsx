import React from "react";

interface BrandLogoProps {
  id: string;
  className?: string;
  alt?: string;
}

/**
 * Renders the authentic logo for a sneaker brand or category.
 * Supported brands:
 * - golden-goose: Iconic Golden Goose Venice Star emblem
 * - kobe: Official Nike Kobe Bryant Sheath / Mamba logo
 * - maison-margiela: Iconic Maison Margiela Line 22 Footwear emblem with signature 4 corner stitches
 * - nike: Official Nike Swoosh
 * - jordan: Jumpman silhouette
 * - more-drops / default: Curated luxury diamond star emblem
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ id, className = "w-4 h-4", alt }) => {
  const normalized = (id || "").toLowerCase().trim();

  // 1. GOLDEN GOOSE (Iconic 5-Point Venice Star)
  if (
    normalized.includes("golden") ||
    normalized.includes("goose") ||
    normalized.includes("ggdb") ||
    normalized.includes("ball-star") ||
    normalized.includes("super-star")
  ) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className={className}
        aria-label={alt || "Golden Goose Logo"}
      >
        <polygon points="50,4 63.5,34.5 97,38 72.5,61.5 79,95 50,77.5 21,95 27.5,61.5 3,38 36.5,34.5" />
      </svg>
    );
  }

  // 2. KOBE (Official Nike Kobe Bryant Sheath / Mamba Emblem)
  if (normalized.includes("kobe") || normalized.includes("mamba")) {
    return (
      <img
        src="/kobe-logo.png"
        alt={alt || "Kobe Logo"}
        className={`${className} object-contain`}
        loading="lazy"
      />
    );
  }

  // 3. MAISON MARGIELA (Iconic Line 22 Footwear Emblem with signature 4 corner stitches)
  if (
    normalized.includes("margiela") ||
    normalized.includes("maison") ||
    normalized.includes("gat") ||
    normalized.includes("replica")
  ) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        className={className}
        aria-label={alt || "Maison Margiela Logo"}
      >
        {/* Signature 4 Corner Stitches */}
        <line x1="8" y1="12" x2="22" y2="12" strokeWidth="5" strokeLinecap="round" />
        <line x1="78" y1="12" x2="92" y2="12" strokeWidth="5" strokeLinecap="round" />
        <line x1="8" y1="88" x2="22" y2="88" strokeWidth="5" strokeLinecap="round" />
        <line x1="78" y1="88" x2="92" y2="88" strokeWidth="5" strokeLinecap="round" />
        {/* Footwear Line 22 Circled Emblem */}
        <circle cx="50" cy="50" r="30" strokeWidth="4.5" />
        <text
          x="50"
          y="58"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          fontSize="26"
          fontWeight="900"
          fill="currentColor"
          stroke="none"
          textAnchor="middle"
        >
          22
        </text>
      </svg>
    );
  }

  // 4. NIKE (Official Swoosh)
  if (normalized === "nike" || normalized.includes("dunk") || normalized.includes("air-force")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label={alt || "Nike Logo"}
      >
        <path d="M21.707 5.293c-.27-.27-.72-.18-.87.18-1.54 3.73-4.7 6.43-8.87 7.57-2.61.71-4.8.44-6.38-.81-.97-.77-1.42-1.84-1.29-3.07.15-1.4 1.15-2.73 2.76-3.66.33-.19.26-.69-.12-.78-2.67-.62-5.18.59-6.22 3.01-1.07 2.49-.37 5.23 1.83 7.02 2.22 1.8 5.37 2.24 8.78 1.25 5.5-1.6 9.68-5.74 10.74-10.36.08-.35-.16-.62-.36-.35z" />
      </svg>
    );
  }

  // 5. JORDAN
  if (normalized.includes("jordan")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-label={alt || "Jordan Logo"}
      >
        <path d="M12 2a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-2.5 4.5l-4.2 4.2 1.4 1.4 3.3-3.3v4.7l-4.5 5.5 1.6 1.3 4.4-4.8 4.4 4.8 1.6-1.3-4.5-5.5V8.8l3.3 3.3 1.4-1.4-4.2-4.2h-4.6z" />
      </svg>
    );
  }

  // DEFAULT / MORE CURATED DROPS (Refined Luxury Diamond Star Emblem)
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label={alt || "Curated Drop Logo"}
    >
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
    </svg>
  );
};

export default BrandLogo;
