import React, { useState, useEffect } from "react";
import { useFavorites } from "../hooks/useFavorites";
import LOGO_BLACK from "../assets/wise-sole-logo-transparent.png";

interface IconProps {
  className?: string;
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

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/#categories" },
  { label: "About", href: "/#about" },
  { label: "Legitimacy", href: "/legitimacy" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/#contact" },
];

const waLink = (text: string) => `https://wa.me/639560929925?text=${encodeURIComponent(text)}`;

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { favorites } = useFavorites();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
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

            <a href="/" className="flex items-center gap-2.5">
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
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="text-[15px] py-3.5 border-b border-[#F5F5F5]"
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
    </>
  );
}