import React, { useState, useEffect, useRef } from "react";
import { getFeaturedProducts, getNewArrivals, getCategories } from "./services/api";
import type { Product, Category } from "./types/product";
import ProductCard from "./components/ProductCard";
import QuickViewModal from "./components/QuickViewModal";
import { useFavorites } from "./hooks/useFavorites";
import { getSiteImages, siteImageUrl } from "./services/siteImages";
import type { SiteImagesMap } from "./services/siteImages";
import LOGO_BLACK from "./assets/wise-sole-logo-transparent.png";
import LOGO_WHITE from "./assets/wise-sole-logo-white.png";
// my 2 const logo

// Placeholder image shown for products/categories that don't have a real photo yet

// Category names map to a placeholder photo until you upload real category imagery via the admin
const CATEGORY_IMG_SEEDS: Record<string, string> = {
  sneakers: "wssneak",
  bags: "wsbag",
  perfumes: "wsperf",
  watches: "wswatch",
  hoodies: "wshood",
  shirts: "wsshirt",
  shorts: "wsshort",
  slides: "wsslide",
  accessories: "wsacc",
};

function categoryHasImage(category: Category): boolean {
  return !!category.image_path;
}

function resolveCategoryImage(category: Category): string {
  return category.image_path ? siteImageUrl(category.image_path) : "";
}

function resolveCategoryImageHover(category: Category): string {
  return category.hover_image_path
    ? siteImageUrl(category.hover_image_path)
    : resolveCategoryImage(category);
}

interface IconProps {
  className?: string;
}

function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1a7.9 7.9 0 0 0 3.85 1h.003a7.94 7.94 0 0 0 5.55-13.58ZM12.05 18.4h-.003a6.58 6.58 0 0 1-3.36-.92l-.24-.14-2.5.65.67-2.43-.16-.25a6.6 6.6 0 0 1 10.2-8.26 6.55 6.55 0 0 1 1.94 4.67 6.6 6.6 0 0 1-6.55 6.68Zm3.61-4.94c-.2-.1-1.17-.58-1.35-.64-.18-.07-.32-.1-.45.1-.13.2-.51.64-.63.77-.11.13-.23.15-.43.05a5.4 5.4 0 0 1-1.6-.98 5.98 5.98 0 0 1-1.1-1.37c-.12-.2 0-.3.09-.4.09-.1.2-.23.3-.34.1-.12.13-.2.2-.33.07-.13.03-.25-.02-.35-.05-.1-.45-1.07-.61-1.47-.16-.38-.33-.33-.45-.34h-.38c-.13 0-.35.05-.53.25-.18.2-.7.68-.7 1.66s.72 1.93.82 2.06c.1.13 1.41 2.15 3.41 3.02.48.2.85.33 1.14.42.48.15.92.13 1.26.08.39-.06 1.17-.48 1.33-.94.17-.46.17-.86.12-.94-.05-.09-.18-.14-.38-.24Z" />
    </svg>
  );
}
function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M13.5 21v-7.6h2.55l.38-2.96h-2.93V8.55c0-.86.24-1.44 1.47-1.44h1.57V4.46A21 21 0 0 0 14.2 4.3c-2.24 0-3.78 1.37-3.78 3.87v2.27H7.86v2.96h2.56V21h3.08Z" />
    </svg>
  );
}
function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M14.5 3h2.2c.13 1.06.6 2 1.32 2.72.72.72 1.66 1.19 2.72 1.32v2.22a6.9 6.9 0 0 1-4.04-1.3v6.6a5.55 5.55 0 1 1-4.4-5.43v2.28a3.28 3.28 0 1 0 2.2 3.1V3Z" />
    </svg>
  );
}
function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.2" y2="16.2" />
    </svg>
  );
}
function HeartIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path d="M12 20.2s-7.5-4.6-9.7-9A5.2 5.2 0 0 1 12 6.4a5.2 5.2 0 0 1 9.7 4.8c-2.2 4.4-9.7 9-9.7 9Z" />
    </svg>
  );
}
function MenuIcon({ className, open }: IconProps & { open?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      {open ? (
        <>
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </>
      ) : (
        <>
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </>
      )}
    </svg>
  );
}

function useScrollReveal(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function WiseSole() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { favorites, toggleFavorite } = useFavorites();
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteImages, setSiteImages] = useState<SiteImagesMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
useEffect(() => {
    Promise.all([getFeaturedProducts(), getNewArrivals(), getCategories(), getSiteImages()])
      .then(([featuredData, newArrivalsData, categoriesData, siteImagesData]) => {
        setFeatured(featuredData);
        setNewArrivals(newArrivalsData);
        setCategories(categoriesData);
        setSiteImages(siteImagesData);
      })
      .catch((err) => {
        console.error("Failed to load products:", err);
        setLoadError("Couldn't load the catalog right now. Check that the Laravel API is running.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const waLink = (text: string) => `https://wa.me/639560929925?text=${encodeURIComponent(text)}`;

 const navLinks = [
    { label: "Shop", href: "/shop" },
    { label: "Categories", href: "#categories" },
    { label: "About", href: "#about" },
    { label: "Legitimacy", href: "/legitimacy" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="bg-white text-black min-h-screen w-full">
    
      {/* HEADER */}
      <header
        className={`sticky top-0 z-50 bg-white border-b transition-shadow duration-300 ${
          scrolled ? "border-[#EAEAEA] shadow-[0_1px_0_0_rgba(0,0,0,0.02)]" : "border-transparent"
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-5 md:px-10">
          <div className="flex items-center justify-between h-[64px] md:h-[76px]">
            <button className="md:hidden -ml-1 p-2" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <MenuIcon className="w-5 h-5" open={false} />
            </button>

            <a href="#" className="flex items-center gap-2.5">
              <img src={LOGO_BLACK} alt="Wise Sole" className="h-9 md:h-11 w-auto" />
              <span className="hidden md:block text-[15px] font-semibold tracking-[0.08em]">WISE SOLE</span>
            </a>

            <nav className="hidden md:flex items-center gap-9">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-[13px] tracking-[0.04em] text-black relative py-2 group"
                >
                  {l.label}
                  <span className="absolute left-0 -bottom-0.5 w-0 h-px bg-black transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <button onClick={() => setSearchOpen((s) => !s)} aria-label="Search" className="p-2 transition-opacity hover:opacity-60">
                <SearchIcon className="w-[18px] h-[18px]" />
              </button>
              <a
                href="/favorites"
                aria-label="View favorites"
                className="relative p-2 transition-opacity hover:opacity-60"
              >
                <HeartIcon className="w-[18px] h-[18px]" filled={favorites.length > 0} />
                {favorites.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[9px] w-[15px] h-[15px] flex items-center justify-center rounded-full">
                    {favorites.length}
                  </span>
                )}
              </a>
              <a
    href={waLink("Hi Wise Sole! I'd like to know more about your collection.")}
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center text-[11px] tracking-[0.12em] uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors duration-200"
              >
                Inquire Now
              </a>
            </div>
          </div>

          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{ maxHeight: searchOpen ? "68px" : "0px" }}
          >
            <div className="pb-4">
              <input
                type="text"
                placeholder="Search sneakers, bags, watches…"
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-2.5 text-[13px] outline-none focus:border-black transition-colors duration-200"
              />
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
        <div
          className={`absolute top-0 left-0 h-full w-[82%] max-w-[340px] bg-white transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between h-[64px] px-5 border-b border-[#EAEAEA]">
            <img src={LOGO_BLACK} alt="Wise Sole" className="h-8 w-auto" />
            <button onClick={() => setMenuOpen(false)} className="p-2" aria-label="Close menu">
              <MenuIcon className="w-5 h-5" open={true} />
            </button>
          </div>
          <nav className="flex flex-col px-5 pt-6 gap-1">
            {navLinks.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="text-[15px] py-3.5 border-b border-[#F5F5F5]"
                style={{
                  transitionDelay: `${i * 40}ms`,
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="px-5 pt-6">
            <a
              href={waLink("Hi Wise Sole! I'd like to know more about your collection.")}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-[11px] tracking-[0.12em] uppercase bg-black text-white py-3.5"
            >
              Inquire Now
            </a>
          </div>
        </div>
      </div>

      {/* HERO */}
     <section className="relative">
          <div className="max-w-[1440px] mx-auto px-5 md:px-10 pt-10 md:pt-16 pb-8">
            <div className="flex flex-col gap-6 md:gap-8">
             <div className="group relative overflow-hidden bg-[#0a0a0a] min-h-[320px] md:min-h-[460px] flex items-end">
                {!loading && (
                  <img
                    src={siteImages.hero_main ? siteImageUrl(siteImages.hero_main) : `https://picsum.photos/seed/wshero/1600/550`}
                    alt="Wise Sole collection"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                )}
<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
<div className="relative z-10 p-7 md:p-10 w-full">
  <img src={LOGO_WHITE} alt="" className="h-16 md:h-20 w-auto mb-5 opacity-95" />
                  <p className="text-white/85 text-[13px] md:text-[14px] max-w-[380px] mb-6 leading-relaxed">
                    Your source for premium sneakers, streetwear, and accessories.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/shop"
                      className="bg-white text-black text-[11px] tracking-[0.12em] uppercase px-6 py-3.5 hover:bg-[#F5F5F5] transition-colors duration-200"
                    >
                      Shop Collection
                    </a>
                    <a
                      href="#categories"
                      className="border border-white text-white text-[11px] tracking-[0.12em] uppercase px-6 py-3.5 hover:bg-white hover:text-black transition-colors duration-200"
                    >
                      Explore Categories
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <a href="#new-arrivals" className="relative overflow-hidden bg-[#F5F5F5] aspect-[3/2] group block flex items-center justify-center">
                {!loading && (
    <img
     src={siteImages.hero_side_1 ? siteImageUrl(siteImages.hero_side_1) : `https://picsum.photos/seed/wshero2/750/500`}
      alt=""
      loading="lazy"
      className="w-full h-full object-contain"
    />
  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-[13px] tracking-[0.04em]">The Latest Drop</p>
                  </div>
                </a>
              <a href="#featured" className="relative overflow-hidden bg-[#F5F5F5] aspect-[3/2] group block flex items-center justify-center">
                  {!loading && (
    <img
       src={siteImages.hero_side_2 ? siteImageUrl(siteImages.hero_side_2) : `https://picsum.photos/seed/wshero3/750/500`}
      alt=""
      loading="lazy"
      className="w-full h-full object-contain"
    />
  )}
   <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-[13px] tracking-[0.04em]">Best Sellers</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>

      {/* FEATURED COLLECTION */}
      <section id="featured" className="max-w-[1440px] mx-auto px-5 md:px-10 py-16 md:py-24">
        <Reveal className="flex items-end justify-between mb-8 md:mb-10 border-b border-[#EAEAEA] pb-5">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Curated by Wise Sole</p>
            <h2 className="text-[22px] md:text-[28px] font-semibold tracking-tight">Featured Collection</h2>
          </div>
          <a href="/shop" className="hidden md:inline text-[12px] tracking-[0.05em] border-b border-black pb-0.5 hover:opacity-60 transition-opacity">
            View All
          </a>
        </Reveal>

        {loading && (
          <p className="text-[13px] text-[#6B6B6B]">Loading products…</p>
        )}
        {loadError && (
          <p className="text-[13px] text-[#6B6B6B]">{loadError}</p>
        )}
        {!loading && !loadError && featured.length === 0 && (
          <p className="text-[13px] text-[#6B6B6B]">No featured products yet — mark a product as "Featured" in the admin dashboard.</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-14">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
            <ProductCard
                product={p}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onClick={() => { window.location.href = `/product/${p.slug}`; }}
                onQuickView={(prod) => setQuickViewProduct(prod)}
                isPageLoading={loading}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="bg-[#F5F5F5] py-16 md:py-24 scroll-mt-[76px]">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10">
          <Reveal className="mb-8 md:mb-10">
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Browse</p>
            <h2 className="text-[22px] md:text-[28px] font-semibold tracking-tight">Shop by Category</h2>
          </Reveal>

          {!loading && !loadError && categories.length === 0 && (
            <p className="text-[13px] text-[#6B6B6B] mb-6">No categories yet — add some from the admin dashboard.</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 50}>
                <button
                  onMouseEnter={() => setActiveCategory(c.name)}
                  onMouseLeave={() => setActiveCategory(null)}
                  onClick={() => { window.location.href = `/category/${c.slug}`; }}
                  className="relative w-full overflow-hidden bg-black aspect-[4/5] group block"
                >
                {categoryHasImage(c) ? (
                    <>
                      <img
                        src={resolveCategoryImage(c)}
                        alt={c.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-0"
                      />
                      <img
                        src={resolveCategoryImageHover(c)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-0 scale-105 transition-all duration-500 group-hover:opacity-90 group-hover:scale-100"
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center">
                      <span className="text-white/30 text-[10px] tracking-[0.1em] uppercase">Photo coming soon</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-[13px] md:text-[15px] tracking-[0.1em] uppercase relative">
                      {c.name}
                      <span
                        className="absolute left-0 -bottom-1.5 h-px bg-white transition-all duration-300"
                        style={{ width: activeCategory === c.name ? "100%" : "0%" }}
                      />
                    </span>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section id="new-arrivals" className="max-w-[1440px] mx-auto px-5 md:px-10 py-16 md:py-24 scroll-mt-[76px]">
        <Reveal className="flex items-end justify-between mb-8 md:mb-10 border-b border-[#EAEAEA] pb-5">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Just Landed</p>
            <h2 className="text-[22px] md:text-[28px] font-semibold tracking-tight">New Arrivals</h2>
          </div>
          <a href="/shop" className="hidden md:inline text-[12px] tracking-[0.05em] border-b border-black pb-0.5 hover:opacity-60 transition-opacity">
            View All
          </a>
        </Reveal>

        {!loading && !loadError && newArrivals.length === 0 && (
          <p className="text-[13px] text-[#6B6B6B] mb-6">No new arrivals yet — mark a product as "New" in the admin dashboard.</p>
        )}
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-5 px-5 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden">
         {newArrivals.map((p) => (
            <div key={p.id} className="w-[220px] md:w-[280px] shrink-0 snap-start">
              <ProductCard
                product={p}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onClick={() => { window.location.href = `/product/${p.slug}`; }}
                onQuickView={(prod) => setQuickViewProduct(prod)}
              />
            </div>
          ))}
        </div>
      </section>


  {/* ABOUT */}
      <section id="about" className="border-t border-[#EAEAEA] scroll-mt-[76px]">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
            <Reveal className="md:col-span-5 relative aspect-[4/5] overflow-hidden bg-[#F5F5F5]">
{!loading && (
                <img src={siteImages.about_photo ? siteImageUrl(siteImages.about_photo) : "https://picsum.photos/seed/wsabout/700/900"} alt="Wise Sole studio" loading="lazy" className="w-full h-full object-cover" />
              )}            </Reveal>
            <Reveal className="md:col-span-7" delay={100}>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-3">About Wise Sole</p>
              <h2 className="text-[24px] md:text-[34px] font-semibold tracking-tight leading-tight mb-5 max-w-[560px]">
                Founded in 2023, built around good taste.
              </h2>
              <p className="text-[14px] md:text-[15px] text-[#6B6B6B] leading-relaxed max-w-[520px] mb-6">
                Wise Sole started as a small streetwear passion project and grew into a go-to spot for
                sneakers, apparel, and accessories that don't take themselves too seriously. We keep the
                catalog tight — every piece is chosen because it's genuinely worth wearing, not just
                because it's trending. No clutter, no filler, just a lineup we'd actually reach for ourselves.
              </p>
              <a
                href="/shop"
                className="inline-flex items-center gap-2 text-[12px] tracking-[0.08em] uppercase border-b border-black pb-1 hover:gap-3 transition-all duration-200"
              >
                Shop the Collection →
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-black text-white py-16 md:py-24 scroll-mt-[76px]">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10">
          <Reveal className="max-w-[560px] mb-10 md:mb-14">
            <p className="text-[10px] tracking-[0.15em] uppercase text-white/50 mb-3">Get in Touch</p>
            <h2 className="text-[24px] md:text-[32px] font-semibold tracking-tight leading-tight mb-4">
              See something you like? Let's talk.
            </h2>
            <p className="text-[14px] text-white/60 leading-relaxed">
              Every product page connects straight to WhatsApp — no accounts, no checkout forms.
              Just tell us what you're after.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/15">
            <a href={waLink("Hi Wise Sole! I have a question about your products.")} target="_blank" rel="noreferrer" className="bg-black p-6 md:p-8 flex flex-col gap-4 hover:bg-white/5 transition-colors duration-200">
              <WhatsAppIcon className="w-5 h-5" />
              <div>
                <p className="text-[13px] font-medium mb-0.5">WhatsApp</p>
                <p className="text-[12px] text-white/50">0956 092 9925</p>
              </div>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61578547474371" target="_blank" rel="noreferrer" className="bg-black p-6 md:p-8 flex flex-col gap-4 hover:bg-white/5 transition-colors duration-200">
              <FacebookIcon className="w-5 h-5" />
              <div>
                <p className="text-[13px] font-medium mb-0.5">Facebook</p>
                <p className="text-[12px] text-white/50">Wise Sole</p>
              </div>
            </a>
    <a href="https://www.instagram.com/wisesole_/" target="_blank" rel="noreferrer" className="bg-black p-6 md:p-8 flex flex-col gap-4 hover:bg-white/5 transition-colors duration-200">
              <InstagramIcon className="w-5 h-5" />
              <div>
                <p className="text-[13px] font-medium mb-0.5">Instagram</p>
                <p className="text-[12px] text-white/50">@wisesole_</p>
              </div>
            </a>
            <a href="https://www.tiktok.com/@wise_sole" target="_blank" rel="noreferrer" className="bg-black p-6 md:p-8 flex flex-col gap-4 hover:bg-white/5 transition-colors duration-200">
              <TikTokIcon className="w-5 h-5" />
              <div>
                <p className="text-[13px] font-medium mb-0.5">TikTok</p>
                <p className="text-[12px] text-white/50">@wise_sole</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#EAEAEA] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-1">
              <img src={LOGO_BLACK} alt="Wise Sole" className="h-10 w-auto mb-4" />
              <p className="text-[13px] text-[#6B6B6B] leading-relaxed max-w-[220px]">
                Premium sneakers, streetwear, and accessories — curated, not mass-produced.
              </p>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-4">Shop</p>
              <ul className="space-y-2.5 text-[13px]">
                {["Sneakers", "Bags", "Watches", "Hoodies", "Accessories"].map((l) => (
                  <li key={l}>
                    <a href={`/category/${l.toLowerCase()}`} className="hover:text-[#6B6B6B] transition-colors duration-200">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-4">Contact</p>
            <ul className="space-y-2.5 text-[13px] text-[#6B6B6B]">
                <li>WhatsApp: 0956 092 9925</li>
                <li>wisesole@gmail.com</li>
                <li>
 <a href="/legitimacy" className="hover:text-black transition-colors duration-200">
                    Proof of Legitimacy
                  </a>
                </li>
                <li>
                  <a href="/faq" className="hover:text-black transition-colors duration-200">
                    FAQ &amp; How to Order
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.1em] uppercase text-[#6B6B6B] mb-4">Follow</p>
              <div className="flex gap-3">
                <a href="https://www.facebook.com/profile.php?id=61578547474371" target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center border border-[#EAEAEA] hover:border-black transition-colors duration-200">
                  <FacebookIcon className="w-4 h-4" />
                </a>
                <a href="https://www.instagram.com/wisesole_/" target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center border border-[#EAEAEA] hover:border-black transition-colors duration-200">
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a href="https://www.tiktok.com/@wise_sole" target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center border border-[#EAEAEA] hover:border-black transition-colors duration-200">
                  <TikTokIcon className="w-4 h-4" />
                </a>
                <a href={waLink("Hi Wise Sole!")} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center border border-[#EAEAEA] hover:border-black transition-colors duration-200">
                  <WhatsAppIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-[#EAEAEA] pt-6 flex flex-col md:flex-row justify-between gap-2 text-[11px] text-[#6B6B6B]">
            <p>© 2026 Wise Sole. All rights reserved.</p>
            <p>Designed for discovery, not checkout.</p>
          </div>
        </div>
      </footer>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}