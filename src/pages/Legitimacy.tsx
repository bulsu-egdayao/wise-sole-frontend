import React, { useEffect, useState } from "react";
import {
  getLegitimacyProofs,
  getApprovedVouches,
  submitVouch,
  legitimacyImageUrl,
  type TransactionCategory,
  type Vouch,
} from "../services/legitimacy";
import SiteHeader from "../components/SiteHeader";

function Stars({ rating, size = "text-[14px]" }: { rating: number; size?: string }) {
  return (
    <span className={`${size} tracking-[2px]`}>
      <span className="text-black">{"★".repeat(rating)}</span>
      <span className="text-[#EAEAEA]">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function Legitimacy() {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Vouch form
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formMessage, setFormMessage] = useState("");
  const [formImage, setFormImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([getLegitimacyProofs(), getApprovedVouches()])
      .then(([cats, vch]) => {
        setCategories(cats);
        setVouches(vch);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeProofs = categories.find((c) => c.id === activeCategory)?.proofs || [];

  const handleSubmitVouch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMessage.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitVouch({
        name: formName.trim(),
        rating: formRating,
        message: formMessage.trim(),
        image: formImage,
      });
      setSubmitted(true);
      setFormName("");
      setFormRating(5);
      setFormMessage("");
      setFormImage(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    vouches.length > 0 ? Math.round((vouches.reduce((sum, v) => sum + v.rating, 0) / vouches.length) * 10) / 10 : null;

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="min-h-screen bg-white text-black">
      <SiteHeader />

      {/* HERO */}
      <section className="border-b border-[#EAEAEA]">
        <div className="max-w-[1000px] mx-auto px-6 py-14 md:py-18 text-center">
          <p className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-3">Wise Sole</p>
          <h1 className="text-[26px] md:text-[34px] font-semibold mb-4">Buy With Confidence</h1>
          <p className="text-[14px] text-[#6B6B6B] max-w-[540px] mx-auto leading-relaxed">
            Honest feedback from real clients, and proof behind every kind of transaction we handle.
          </p>
          {avgRating !== null && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Stars rating={Math.round(avgRating)} size="text-[16px]" />
              <span className="text-[13px] text-[#6B6B6B]">
                {avgRating} average · {vouches.length} vouch{vouches.length === 1 ? "" : "es"}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* VOUCHES — form left, list right */}
      <section className="max-w-[1100px] mx-auto px-6 py-16 md:py-20">
        <h2 className="text-[20px] font-semibold mb-8">Client Vouches</h2>

        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-8 md:gap-10">
          {/* LEFT — submit form */}
          <div className="md:sticky md:top-8 self-start">
            <div className="border border-[#EAEAEA] p-6">
              <h3 className="text-[14px] font-semibold mb-1">Leave a Vouch</h3>
              <p className="text-[12px] text-[#6B6B6B] mb-6 leading-relaxed">
                Ordered before? Let others know how it went. Submissions are reviewed before they go live.
              </p>

              {submitted ? (
                <p className="text-[13px] text-black leading-relaxed">
                  Thanks! Your vouch has been submitted and will appear here once reviewed.
                </p>
              ) : (
                <form onSubmit={handleSubmitVouch} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      maxLength={255}
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                      Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setFormRating(n)}
                          className="text-[22px] leading-none"
                          aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        >
                          <span className={n <= formRating ? "text-black" : "text-[#EAEAEA]"}>★</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                      Your Experience
                    </label>
                    <textarea
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      required
                      maxLength={1000}
                      rows={4}
                      className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors duration-200 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                      Photo — optional
                    </label>

                    {formImage ? (
                      <div className="relative w-20 h-20">
                        <img
                          src={URL.createObjectURL(formImage)}
                          alt=""
                          className="w-full h-full object-cover border border-[#EAEAEA]"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImage(null)}
                          className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-black text-white text-[11px] rounded-full"
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-2 text-[11px] tracking-[0.04em] border border-[#EAEAEA] px-3 py-2.5 cursor-pointer hover:border-black transition-colors duration-200">
                        + Add a photo
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setFormImage(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                    <p className="text-[10px] text-[#6B6B6B] mt-1.5">
                      A screenshot or product photo helps back up your vouch.
                    </p>
                  </div>

                  {submitError && <p className="text-[12px] text-red-600">{submitError}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-black text-white text-[11px] tracking-[0.12em] uppercase px-6 py-3 hover:bg-[#1a1a1a] transition-colors duration-200 disabled:opacity-50"
                  >
                    {submitting ? "Submitting…" : "Submit Vouch"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT — vouch list */}
          <div>
            {vouches.length === 0 ? (
              <div className="border border-[#EAEAEA] p-8 text-center">
                <p className="text-[13px] text-[#6B6B6B]">No vouches yet — be the first to leave one.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {vouches.map((v) => (
                  <div key={v.id} className="border border-[#EAEAEA] p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13.5px] font-medium">{v.name}</p>
                      <Stars rating={v.rating} />
                    </div>
                    <p className="text-[13px] text-[#6B6B6B] leading-relaxed mb-3">{v.message}</p>
                    {v.image_path && (
                      <button
                        onClick={() => setLightboxImage(legitimacyImageUrl(v.image_path!))}
                        className="block w-24 h-24 overflow-hidden border border-[#EAEAEA]"
                      >
                        <img
                          src={legitimacyImageUrl(v.image_path)}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PROOF GALLERY */}
      <section className="bg-[#F5F5F5] border-t border-[#EAEAEA]">
        <div className="max-w-[1100px] mx-auto px-6 py-16 md:py-20">
          <h2 className="text-[20px] font-semibold mb-2">Proof of Transactions</h2>
          <p className="text-[13px] text-[#6B6B6B] mb-8 max-w-[560px]">
            Screenshots and photos from real orders, organized by how the transaction happened.
          </p>

          {loading ? (
            <p className="text-[13px] text-[#6B6B6B]">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="text-[13px] text-[#6B6B6B]">Proof photos coming soon.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`text-[11px] tracking-[0.08em] uppercase px-4 py-2.5 border transition-colors duration-200 ${
                      activeCategory === c.id
                        ? "bg-black text-white border-black"
                        : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black hover:text-black bg-white"
                    }`}
                  >
                    {c.name} ({c.proofs?.length ?? 0})
                  </button>
                ))}
              </div>

              {activeProofs.length === 0 ? (
                <p className="text-[13px] text-[#6B6B6B]">No photos in this category yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {activeProofs.map((proof) => (
                    <button
                      key={proof.id}
                      onClick={() => setLightboxImage(legitimacyImageUrl(proof.image_path))}
                      className="aspect-square bg-white overflow-hidden group border border-[#EAEAEA]"
                    >
                      <img
                        src={legitimacyImageUrl(proof.image_path)}
                        alt={proof.caption || ""}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="" className="max-w-full max-h-full object-contain" />
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 text-white text-[28px] leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}