import React, { useEffect, useState } from "react";
import { getAllVouchesAdmin, updateVouchStatus, deleteVouch, legitimacyImageUrl, type Vouch } from "../services/legitimacy";
import { getToken } from "../services/auth";
import { useConfirm } from "../hooks/useConfirm";

interface AdminVouchesProps {
  onBack: () => void;
}

const STATUS_STYLES: Record<Vouch["status"], string> = {
  pending: "bg-black text-white",
  approved: "border border-green-600 text-green-700",
  rejected: "border border-[#EAEAEA] text-[#6B6B6B]",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[13px] text-black tracking-[2px]">
      {"★".repeat(rating)}
      <span className="text-[#EAEAEA]">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function AdminVouches({ onBack }: AdminVouchesProps) {
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Vouch["status"]>("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();

  const loadVouches = () => {
    setLoading(true);
    getAllVouchesAdmin()
      .then(setVouches)
      .catch(() => setError("Failed to load vouches."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) {
      onBack();
      return;
    }
    loadVouches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (vouch: Vouch, status: Vouch["status"]) => {
    if (vouch.status === status) return;
    setBusyId(vouch.id);
    try {
      const updated = await updateVouchStatus(vouch.id, status);
      setVouches((prev) => prev.map((v) => (v.id === vouch.id ? updated : v)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update vouch");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (vouch: Vouch) => {
    if (!(await confirm(`Delete this vouch from "${vouch.name}"? This cannot be undone.`, { danger: true }))) return;
    setBusyId(vouch.id);
    try {
      await deleteVouch(vouch.id);
      setVouches((prev) => prev.filter((v) => v.id !== vouch.id));
    } catch {
      alert("Failed to delete vouch");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === "all" ? vouches : vouches.filter((v) => v.status === filter);
  const counts = {
    all: vouches.length,
    pending: vouches.filter((v) => v.status === "pending").length,
    approved: vouches.filter((v) => v.status === "approved").length,
    rejected: vouches.filter((v) => v.status === "rejected").length,
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <>
      <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="min-h-screen bg-white text-black">
        <header className="sticky top-0 z-10 bg-white border-b border-[#EAEAEA]">
          <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center gap-4">
            <button onClick={onBack} className="text-[13px] text-[#6B6B6B] hover:text-black transition-colors duration-200">
              ← Dashboard
            </button>
            <h1 className="text-[15px] font-semibold">Vouches</h1>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-6 py-10">
          <p className="text-[13px] text-[#6B6B6B] mb-8 max-w-[600px]">
            Client vouches submitted from the public /legitimacy page land here first. Approve the real
            ones to show them publicly — reject anything spammy or fake.
          </p>

          <div className="flex gap-2 mb-8">
            {(["pending", "approved", "rejected", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] tracking-[0.08em] uppercase px-4 py-2 border transition-colors duration-200 ${
                  filter === f
                    ? "bg-black text-white border-black"
                    : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black hover:text-black"
                }`}
              >
                {f === "all" ? "All" : f} ({counts[f]})
              </button>
            ))}
          </div>

          {error && <p className="text-[13px] text-red-600 mb-6">{error}</p>}

          {loading ? (
            <p className="text-[13px] text-[#6B6B6B]">Loading vouches…</p>
          ) : filtered.length === 0 ? (
            <p className="text-[13px] text-[#6B6B6B]">No {filter === "all" ? "" : filter} vouches.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((vouch) => (
                <div key={vouch.id} className="border border-[#EAEAEA] p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[14px] font-medium">{vouch.name}</p>
                        <span className={`text-[9px] tracking-[0.08em] uppercase px-2 py-0.5 ${STATUS_STYLES[vouch.status]}`}>
                          {vouch.status}
                        </span>
                      </div>
                      <Stars rating={vouch.rating} />
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] whitespace-nowrap">{formatDate(vouch.created_at)}</p>
                  </div>

                  <p className="text-[13px] text-black mb-3 leading-relaxed">{vouch.message}</p>

                  {vouch.image_path && (
                    <button
                      onClick={() => setLightboxImage(legitimacyImageUrl(vouch.image_path!))}
                      className="block w-20 h-20 mb-4 overflow-hidden border border-[#EAEAEA]"
                    >
                      <img src={legitimacyImageUrl(vouch.image_path)} alt="" className="w-full h-full object-cover" />
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    {(["approved", "pending", "rejected"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(vouch, s)}
                        disabled={busyId === vouch.id || vouch.status === s}
                        className={`text-[10px] tracking-[0.08em] uppercase px-3 py-1.5 border transition-colors duration-200 disabled:cursor-default ${
                          vouch.status === s
                            ? "bg-black text-white border-black"
                            : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black hover:text-black"
                        }`}
                      >
                        Mark {s}
                      </button>
                    ))}
                    <button
                      onClick={() => handleDelete(vouch)}
                      disabled={busyId === vouch.id}
                      className="text-[10px] tracking-[0.08em] uppercase text-red-600 border-b border-red-600 pb-0.5 hover:opacity-60 transition-opacity ml-auto disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

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

      {ConfirmDialog}
    </>
  );
}