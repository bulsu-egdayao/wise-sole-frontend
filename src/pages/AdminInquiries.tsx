import React, { useEffect, useState } from "react";
import type { Inquiry } from "../services/adminInquiries";
import { getAllInquiries, updateInquiryStatus } from "../services/adminInquiries";
import { getToken } from "../services/auth";

interface AdminInquiriesProps {
  onBack: () => void;
}

type StatusFilter = "all" | "new" | "viewed" | "responded";

const STATUS_STYLES: Record<Inquiry["status"], string> = {
  new: "bg-black text-white",
  viewed: "border border-black text-black",
  responded: "border border-[#EAEAEA] text-[#6B6B6B]",
};

export default function AdminInquiries({ onBack }: AdminInquiriesProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadInquiries = () => {
    setLoading(true);
    getAllInquiries()
      .then(setInquiries)
      .catch(() => setError("Failed to load inquiries."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) {
      onBack();
      return;
    }
    loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (inquiry: Inquiry, status: Inquiry["status"]) => {
    if (inquiry.status === status) return;
    setUpdatingId(inquiry.id);
    setError(null);
    try {
      const updated = await updateInquiryStatus(inquiry.id, status);
      setInquiries((prev) => prev.map((i) => (i.id === inquiry.id ? updated : i)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update inquiry");
    } finally {
      setUpdatingId(null);
    }
  };

  function waReplyLink(inquiry: Inquiry): string | null {
    if (!inquiry.contact) return null;

    // Strip spaces, dashes, parentheses — keep only digits and a leading +
    let digits = inquiry.contact.replace(/[^\d+]/g, "");

    // Normalize local PH numbers (09XXXXXXXXX) to international format
    if (digits.startsWith("0")) {
      digits = "63" + digits.slice(1);
    } else if (digits.startsWith("+")) {
      digits = digits.slice(1);
    }

    const text = `Hi ${inquiry.name}! Thanks for reaching out to Wise Sole${
      inquiry.product ? ` about ${inquiry.product.name}` : ""
    }. `;

    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) +
      " · " +
      d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })
    );
  };

  const filtered = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);

  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    viewed: inquiries.filter((i) => i.status === "viewed").length,
    responded: inquiries.filter((i) => i.status === "responded").length,
  };

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-10 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center gap-4">
          <button onClick={onBack} className="text-[13px] text-[#6B6B6B] hover:text-black transition-colors duration-200">
            ← Dashboard
          </button>
          <h1 className="text-[15px] font-semibold">Inquiries</h1>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex gap-2 mb-8">
          {(["all", "new", "viewed", "responded"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] tracking-[0.08em] uppercase px-4 py-2 border transition-colors duration-200 ${
                filter === f ? "bg-black text-white border-black" : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black hover:text-black"
              }`}
            >
              {f === "all" ? "All" : f} ({counts[f]})
            </button>
          ))}
        </div>

        {error && <p className="text-[13px] text-red-600 mb-6">{error}</p>}

        {loading ? (
          <p className="text-[13px] text-[#6B6B6B]">Loading inquiries…</p>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-[#6B6B6B]">No inquiries {filter !== "all" ? `with status "${filter}"` : "yet"}.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((inq) => (
              <div key={inq.id} className="border border-[#EAEAEA] p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[14px] font-medium">{inq.name}</p>
                      <span className={`text-[9px] tracking-[0.08em] uppercase px-2 py-0.5 ${STATUS_STYLES[inq.status]}`}>
                        {inq.status}
                      </span>
                    </div>
                    {inq.product && (
                      <p className="text-[12px] text-[#6B6B6B]">Re: {inq.product.name}</p>
                    )}
                    {inq.contact && (
                      <p className="text-[12px] text-[#6B6B6B]">{inq.contact}</p>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] whitespace-nowrap">{formatDate(inq.created_at)}</p>
                </div>

                <p className="text-[13px] text-black mb-4 leading-relaxed">{inq.message}</p>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2">
                    {(["new", "viewed", "responded"] as Inquiry["status"][]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(inq, status)}
                        disabled={updatingId === inq.id || inq.status === status}
                        className={`text-[10px] tracking-[0.08em] uppercase px-3 py-1.5 border transition-colors duration-200 disabled:cursor-default ${
                          inq.status === status
                            ? "bg-black text-white border-black"
                            : "border-[#EAEAEA] text-[#6B6B6B] hover:border-black hover:text-black"
                        }`}
                      >
                        Mark {status}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const link = waReplyLink(inq);
                    if (!link) {
                      return (
                        <span className="text-[10px] text-[#6B6B6B] italic">No contact number provided</span>
                      );
                    }
                    return (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => inq.status === "new" && handleStatusChange(inq, "viewed")}
                        className="text-[10px] tracking-[0.08em] uppercase bg-black text-white px-3 py-1.5 hover:bg-[#1a1a1a] transition-colors duration-200"
                      >
                        Reply via WhatsApp →
                      </a>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}