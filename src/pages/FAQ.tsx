import React, { useState } from "react";
import SiteHeader from "../components/SiteHeader";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQS: FAQItem[] = [
  {
    question: "How do I order?",
    answer: (
      <>
        Browse the <a href="/shop" className="underline hover:opacity-60 transition-opacity">Shop</a> or any category,
        open the product you're interested in, and click <strong>"Inquire via WhatsApp"</strong> or fill out the short
        inquiry form on that product's page. We'll confirm availability, pricing, and next steps directly with you
        from there — no account or checkout needed.
      </>
    ),
  },
  {
    question: "What payment methods do you accept?",
    answer: (
      <>
        We accept GCash and bank transfer. Full details and account information are shared once your order is
        confirmed via WhatsApp.
      </>
    ),
  },
  {
    question: "How does delivery or meetup work?",
    answer: (
      <>
        We offer both meetup (for select areas) and delivery through courier. The exact options available to you
        depend on your location — this gets confirmed together with your order over WhatsApp.
      </>
    ),
  },
  {
    question: "How long does an order take?",
    answer: (
      <>
        Timelines vary by item and are shared with you at the time of inquiry, since some products are ready to ship
        and others may take longer. We'll always give you a clear estimate before you commit to anything.
      </>
    ),
  },
  {
    question: "Can I inquire about a product without buying right away?",
    answer: (
      <>
        Of course — inquiries are commitment-free. Ask about pricing, availability, or anything else, and take your
        time deciding. You can also save items to your{" "}
        <a href="/favorites" className="underline hover:opacity-60 transition-opacity">Favorites</a> to come back to
        later.
      </>
    ),
  },
  {
    question: "What if I need to change or cancel my order?",
    answer: (
      <>
        Message us directly on WhatsApp as soon as possible. Since every order is confirmed manually, we can
        usually accommodate changes if you reach out before an order is finalized.
      </>
    ),
  },
  {
    question: "Do you have a physical store?",
    answer: (
      <>
        We currently operate online only, with all communication and order confirmation handled through WhatsApp
        and our social channels.
      </>
    ),
  },
  {
    question: "How can I contact Wise Sole directly?",
    answer: (
      <>
        WhatsApp is the fastest way to reach us — you'll find a link on every product page, or in the{" "}
        <a href="/#contact" className="underline hover:opacity-60 transition-opacity">Contact section</a> on our
        homepage. We're also reachable through Facebook, Instagram, and TikTok.
      </>
    ),
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="bg-white text-black min-h-screen w-full">
      <SiteHeader />

      {/* CONTENT */}
      <div className="max-w-[760px] mx-auto px-5 md:px-10 py-14 md:py-20">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Need to Know</p>
        <h1 className="text-[26px] md:text-[34px] font-semibold tracking-tight mb-4">
          FAQ &amp; How to Order
        </h1>
        <p className="text-[14px] text-[#6B6B6B] leading-relaxed mb-10 max-w-[560px]">
          Everything you need to know before reaching out. Still have a question that isn't covered here?
          Message us on WhatsApp — we're happy to help.
        </p>

        <div className="border-t border-[#EAEAEA]">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="border-b border-[#EAEAEA]">
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[14.5px] font-medium">{item.question}</span>
                  <span
                    className={`text-[18px] leading-none shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{ maxHeight: isOpen ? "240px" : "0px" }}
                >
                  <p className="text-[13.5px] text-[#6B6B6B] leading-relaxed pb-5 pr-8">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 border border-[#EAEAEA] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-medium mb-1">Still have questions?</p>
            <p className="text-[12.5px] text-[#6B6B6B]">We usually respond quickly on WhatsApp.</p>
          </div>
          <a
            href="https://wa.me/639560929925?text=Hi%20Wise%20Sole!%20I%20have%20a%20question."
            target="_blank"
            rel="noreferrer"
            className="inline-block text-center bg-black text-white text-[11px] tracking-[0.12em] uppercase px-6 py-3.5 hover:bg-[#1a1a1a] transition-colors duration-200 shrink-0"
          >
            Message on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}