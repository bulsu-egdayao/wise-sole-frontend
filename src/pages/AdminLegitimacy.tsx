import React, { useEffect, useState } from "react";
import {
  getLegitimacyProofs,
  createTransactionCategory,
  deleteTransactionCategory,
  uploadLegitimacyProof,
  deleteLegitimacyProof,
  legitimacyImageUrl,
  type TransactionCategory,
} from "../services/legitimacy";
import { getToken } from "../services/auth";
import { useConfirm } from "../hooks/useConfirm";

interface AdminLegitimacyProps {
  onBack: () => void;
}

export default function AdminLegitimacy({ onBack }: AdminLegitimacyProps) {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  const [uploadingCategoryId, setUploadingCategoryId] = useState<number | null>(null);
  const [deletingProofId, setDeletingProofId] = useState<number | null>(null);

  const { confirm, notify, ConfirmDialog } = useConfirm();

  const loadCategories = () => {
    setLoading(true);
    getLegitimacyProofs()
      .then(setCategories)
      .catch(() => setError("Failed to load legitimacy proofs."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) {
      onBack();
      return;
    }
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    setError(null);
    try {
      await createTransactionCategory(newCategoryName.trim());
      setNewCategoryName("");
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: TransactionCategory) => {
    if ((category.proofs?.length ?? 0) > 0) {
      await notify(`"${category.name}" still has proof photos in it. Delete those first, then remove this category.`);
      return;
    }
    if (!(await confirm(`Delete "${category.name}"? This cannot be undone.`, { danger: true }))) return;

    setDeletingCategoryId(category.id);
    try {
      await deleteTransactionCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleUploadProof = async (categoryId: number, file: File) => {
    setUploadingCategoryId(categoryId);
    setError(null);
    try {
      await uploadLegitimacyProof(categoryId, file);
      loadCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingCategoryId(null);
    }
  };

  const handleDeleteProof = async (proofId: number) => {
    if (!(await confirm("Delete this proof photo?", { danger: true }))) return;
    setDeletingProofId(proofId);
    try {
      await deleteLegitimacyProof(proofId);
      loadCategories();
    } catch {
      alert("Failed to delete photo");
    } finally {
      setDeletingProofId(null);
    }
  };

  return (
    <>
      <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="min-h-screen bg-white text-black">
        <header className="sticky top-0 z-10 bg-white border-b border-[#EAEAEA]">
          <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center gap-4">
            <button onClick={onBack} className="text-[13px] text-[#6B6B6B] hover:text-black transition-colors duration-200">
              ← Dashboard
            </button>
            <h1 className="text-[15px] font-semibold">Legitimacy Proofs</h1>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-6 py-10">
          <p className="text-[13px] text-[#6B6B6B] mb-8 max-w-[600px]">
            Organize proof-of-transaction photos into categories (e.g. Same Day Delivery, Meetups, Bulk
            Orders). These show on your public /legitimacy page so buyers can see you're a real, trusted
            seller.
          </p>

          <form onSubmit={handleCreateCategory} className="flex gap-3 mb-10">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New transaction type (e.g. Same Day Delivery)"
              className="flex-1 bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200"
            />
            <button
              type="submit"
              disabled={creatingCategory || !newCategoryName.trim()}
              className="bg-black text-white text-[11px] tracking-[0.12em] uppercase px-6 py-3 hover:bg-[#1a1a1a] transition-colors duration-200 disabled:opacity-40"
            >
              {creatingCategory ? "Adding…" : "+ Add"}
            </button>
          </form>

          {error && <p className="text-[13px] text-red-600 mb-6">{error}</p>}

          {loading ? (
            <p className="text-[13px] text-[#6B6B6B]">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="text-[13px] text-[#6B6B6B]">No transaction categories yet — add one above.</p>
          ) : (
            <div className="flex flex-col gap-8">
              {categories.map((category) => (
                <div key={category.id} className="border border-[#EAEAEA]">
                  <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#EAEAEA] bg-[#F5F5F5]">
                    <div>
                      <p className="text-[14px] font-medium">{category.name}</p>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                        {category.proofs?.length ?? 0} photo{(category.proofs?.length ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      disabled={deletingCategoryId === category.id}
                      className="text-[11px] tracking-[0.08em] uppercase text-red-600 border-b border-red-600 pb-0.5 hover:opacity-60 transition-opacity disabled:opacity-40"
                    >
                      {deletingCategoryId === category.id ? "Deleting…" : "Delete Category"}
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                      {(category.proofs || []).map((proof) => (
                        <div key={proof.id} className="relative aspect-square bg-[#F5F5F5] group">
                          <img
                            src={legitimacyImageUrl(proof.image_path)}
                            alt={proof.caption || ""}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleDeleteProof(proof.id)}
                            disabled={deletingProofId === proof.id}
                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-white/90 text-[13px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-40"
                            aria-label="Delete photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <label className="inline-flex items-center gap-2 text-[12px] tracking-[0.04em] border border-[#EAEAEA] px-4 py-2.5 cursor-pointer hover:border-black transition-colors duration-200">
                      {uploadingCategoryId === category.id ? "Uploading…" : "+ Add Proof Photo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={uploadingCategoryId === category.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadProof(category.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      {ConfirmDialog}
    </>
  );
}