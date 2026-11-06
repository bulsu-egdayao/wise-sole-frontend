import React, { useState, useMemo } from "react";
import SiteHeader from "../components/SiteHeader";

interface FAQItem {
  category: "Ordering & ETA" | "Payment & COD" | "Shipping & Tracking" | "Authenticity & Care";
  question: string;
  answer: React.ReactNode;
}

const FAQS: FAQItem[] = [
  {
    category: "Ordering & ETA",
    question: "Are items on Wise Sole ready to ship or pre-order basis?",
    answer: (
      <>
        Most items in our catalog are on a <strong>pre-order basis</strong>, sourced directly through certified distributor networks to guarantee 100% authenticity, optimal sizing, and brand-new condition. The standard estimated time of arrival (ETA) is <strong>7 to 14 business days</strong>, depending on the specific model, colorway, and size rarity.
      </>
    ),
  },
  {
    category: "Ordering & ETA",
    question: "How do I place an order on the website?",
    answer: (
      <>
        Browse our <a href="/shop" className="underline font-medium hover:opacity-70">Shop Catalog</a>, choose your desired size, and tap <strong>"Add to Bag"</strong>. When you are ready, head over to <a href="/checkout" className="underline font-medium hover:opacity-70">Checkout</a>, enter your delivery address, and select your preferred payment method (GCash, MariBank, or Cash on Delivery). You will receive an instant Order Number for live tracking.
      </>
    ),
  },
  {
    category: "Ordering & ETA",
    question: "Can I request sneakers or streetwear that are not listed on your shop?",
    answer: (
      <>
        Yes! We specialize in personal shopping and rare grail sourcing. If a specific sneaker, bag, or apparel is not on our website, reach out to us on{" "}
        <a href="https://wa.me/639560929925" target="_blank" rel="noreferrer" className="underline font-medium hover:opacity-70">
          WhatsApp
        </a>{" "}
        or through our <a href="/#contact" className="underline font-medium hover:opacity-70">Contact Form</a> with a photo and your size, and our team will quote you the best pricing within 24 hours.
      </>
    ),
  },
  {
    category: "Payment & COD",
    question: "What payment options are available?",
    answer: (
      <>
        We support three transparent and flexible payment options:
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>GCash</strong>: Scan the verified QR code or transfer directly to our mobile account.</li>
          <li><strong>MariBank</strong>: Transfer easily via MariBank / ShopeePay / InstaPay.</li>
          <li><strong>Cash on Delivery (COD)</strong>: Pay in cash directly to the LBC courier upon delivery of your parcel.</li>
        </ul>
      </>
    ),
  },
  {
    category: "Payment & COD",
    question: "How does Cash on Delivery (COD) via LBC work?",
    answer: (
      <>
        When you choose <strong>Cash on Delivery</strong> at checkout, an automatic <strong>₱150 standard shipping fee</strong> is added to your order total. You do not need to upload a receipt or make an advance payment online. Our team will verify your contact details and dispatch your order nationwide via LBC Express. Simply prepare the exact cash amount upon delivery.
      </>
    ),
  },
  {
    category: "Payment & COD",
    question: "Is shipping free for prepaid orders?",
    answer: (
      <>
        Yes! As part of our ongoing special promotion, all prepaid orders paid via <strong>GCash</strong> or <strong>MariBank</strong> qualify for <strong>FREE Nationwide Delivery</strong>.
      </>
    ),
  },
  {
    category: "Shipping & Tracking",
    question: "Which couriers do you use for delivery?",
    answer: (
      <>
        We dispatch orders via accredited couriers including <strong>J&amp;T Express</strong>, <strong>Flash Express</strong>, and <strong>LBC Express</strong>. For Metro Manila and Bulacan, express delivery options are also accommodated. Our dispatch team assigns the courier with the fastest, safest route to your doorstep.
      </>
    ),
  },
  {
    category: "Shipping & Tracking",
    question: "How do I track my order and delivery progress?",
    answer: (
      <>
        You can track your order at any time on our{" "}
        <a href="/track" className="underline font-medium hover:opacity-70">
          Track Order Page
        </a>{" "}
        by entering your Order Number (e.g., <code>WS-261106-ABCD</code>). If you created an account, simply open{" "}
        <a href="/my-orders" className="underline font-medium hover:opacity-70">
          My Purchases
        </a>{" "}
        to view all your past and active orders with live waybills automatically.
      </>
    ),
  },
  {
    category: "Authenticity & Care",
    question: "Are your pairs 100% authentic?",
    answer: (
      <>
        Guaranteed 100% authentic. Every pair is thoroughly inspected for material accuracy, factory tags, stitching precision, and verified SKU codes prior to release. We pride ourselves on transparent sourcing and a spotless reputation. View verified client feedback on our{" "}
        <a href="/legitimacy" className="underline font-medium hover:opacity-70">
          Legitimacy &amp; Proofs
        </a>{" "}
        page.
      </>
    ),
  },
  {
    category: "Authenticity & Care",
    question: "How is my sneaker packaged during shipment?",
    answer: (
      <>
        All sneakers are packed with thick bubble wrap and <strong>double-boxed</strong> in sturdy corrugated outer shipping cartons to ensure your original shoe box arrives in pristine, collector-grade condition.
      </>
    ),
  },
  {
    category: "Authenticity & Care",
    question: "Can I request a size exchange or return?",
    answer: (
      <>
        Since items are procured based on your selected size, please refer to our size guide before ordering. Size exchanges are accommodated within 3 days of parcel receipt provided the pair is unworn, in deadstock condition with complete tags, and subject to size availability. Contact us on WhatsApp for assistance.
      </>
    ),
  },
];

const CATEGORIES = ["All", "Ordering & ETA", "Payment & COD", "Shipping & Tracking", "Authenticity & Care"] as const;

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchCat = activeCategory === "All" || faq.category === activeCategory;
      const matchSearch =
        !searchQuery.trim() ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="bg-white text-black min-h-screen w-full">
      <SiteHeader />

      <main className="max-w-[880px] mx-auto px-5 md:px-10 py-12 md:py-20">
        {/* HEADER */}
        <div className="text-center max-w-[620px] mx-auto mb-10">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#6B6B6B] mb-2 font-medium">Customer Support</p>
          <h1 className="text-[28px] md:text-[38px] font-semibold tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
            Everything you need to know about our pre-order turnaround (7–14 days ETA), payment methods (GCash, MariBank, and LBC COD), and nationwide delivery.
          </p>
        </div>

        {/* SEARCH INPUT */}
        <div className="max-w-[480px] mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search a question (e.g. pre-order, COD, tracking)…"
              className="w-full bg-[#F5F5F5] border border-[#EAEAEA] pl-10 pr-4 py-3 text-[13px] outline-none focus:border-black transition-colors"
            />
            <svg
              className="w-4 h-4 text-[#888] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.2" y2="16.2" />
            </svg>
          </div>
        </div>

        {/* CATEGORY TABS (H&M / ZARA MINIMALIST) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-10 border-b border-[#EAEAEA] pb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setOpenIndex(null);
              }}
              className={`text-[11px] uppercase tracking-[0.1em] px-4 py-2 border transition-all ${
                activeCategory === cat
                  ? "bg-black text-white border-black font-semibold"
                  : "bg-white text-[#6B6B6B] border-[#EAEAEA] hover:border-black hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ACCORDION LIST */}
        <div className="border-t border-[#EAEAEA] divide-y divide-[#EAEAEA]">
          {filteredFaqs.length === 0 ? (
            <div className="py-12 text-center text-[#888] text-[13px]">
              No questions found matching your search. Feel free to contact our team below!
            </div>
          ) : (
            filteredFaqs.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className="transition-colors">
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-[#999] border border-[#EAEAEA] px-2 py-0.5 shrink-0 hidden sm:inline-block">
                        {item.category}
                      </span>
                      <span className="text-[14px] md:text-[15px] font-medium text-black group-hover:opacity-70 transition-opacity">
                        {item.question}
                      </span>
                    </div>
                    <span
                      className={`text-[20px] font-light leading-none shrink-0 transition-transform duration-300 text-[#666] ${
                        isOpen ? "rotate-45 text-black" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{ maxHeight: isOpen ? "300px" : "0px" }}
                  >
                    <div className="text-[13.5px] text-[#555] leading-relaxed pb-6 pr-6">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* HELP BANNER */}
        <div className="mt-14 border border-[#EAEAEA] bg-[#FAFAFA] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#888] block mb-1">Direct Assistance</span>
            <p className="text-[15px] font-semibold text-black mb-1">Still have a specific question?</p>
            <p className="text-[12.5px] text-[#6B6B6B]">
              Our personal concierge team is ready to assist you with order status, sneaker sizing, or special requests.
            </p>
          </div>
          <a
            href="https://wa.me/639560929925?text=Hi%20Wise%20Sole!%20I%20have%20a%20question%20about%20an%20order."
            target="_blank"
            rel="noreferrer"
            className="inline-block text-center bg-black text-white text-[11px] tracking-[0.15em] uppercase px-7 py-4 hover:bg-[#1a1a1a] transition-all hover:-translate-y-0.5 shrink-0 shadow-sm"
          >
            Message On WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
