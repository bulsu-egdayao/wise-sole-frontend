import React, { useEffect, useState } from "react";
import type { Category } from "../types/product";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  uploadCategoryHoverImage,
  deleteCategoryImage,
  deleteCategoryHoverImage,
} from "../services/adminCategories";
import { siteImageUrl } from "../services/siteImages";
import { getToken } from "../services/auth";

interface AdminCategoriesProps {
  onBack: () => void;
}

export default function AdminCategories({ onBack }: AdminCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Image upload/removal in-flight tracking: `${categoryId}-default` or `${categoryId}-hover`
  const [imageBusyKey, setImageBusyKey] = useState<string | null>(null);

  const loadCategories = () => {
    setLoading(true);
    getAllCategories()
      .then(setCategories)
      .catch(() => setError("Failed to load categories."))
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createCategory(newName.trim());
      setNewName("");
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateCategory(id, editingName.trim());
      setEditingId(null);
      setEditingName("");
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if ((category.products_count ?? 0) > 0) {
      alert(
        `"${category.name}" has ${category.products_count} product(s) attached. Move or delete those products first, then delete this category.`
      );
      return;
    }
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) return;

    setDeletingId(category.id);
    setError(null);
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  const updateCategoryInList = (updated: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleUploadDefault = async (category: Category, file: File) => {
    const key = `${category.id}-default`;
    setImageBusyKey(key);
    setError(null);
    try {
      const updated = await uploadCategoryImage(category.id, file);
      updateCategoryInList(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setImageBusyKey(null);
    }
  };

  const handleUploadHover = async (category: Category, file: File) => {
    const key = `${category.id}-hover`;
    setImageBusyKey(key);
    setError(null);
    try {
      const updated = await uploadCategoryHoverImage(category.id, file);
      updateCategoryInList(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload hover image");
    } finally {
      setImageBusyKey(null);
    }
  };

  const handleRemoveDefault = async (category: Category) => {
    const key = `${category.id}-default`;
    setImageBusyKey(key);
    try {
      const updated = await deleteCategoryImage(category.id);
      updateCategoryInList(updated);
    } catch {
      alert("Failed to remove image");
    } finally {
      setImageBusyKey(null);
    }
  };

  const handleRemoveHover = async (category: Category) => {
    const key = `${category.id}-hover`;
    setImageBusyKey(key);
    try {
      const updated = await deleteCategoryHoverImage(category.id);
      updateCategoryInList(updated);
    } catch {
      alert("Failed to remove hover image");
    } finally {
      setImageBusyKey(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-10 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-[900px] mx-auto px-6 h-[64px] flex items-center gap-4">
          <button onClick={onBack} className="text-[13px] text-[#6B6B6B] hover:text-black transition-colors duration-200">
            ← Dashboard
          </button>
          <h1 className="text-[15px] font-semibold">Categories</h1>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-10">
        <form onSubmit={handleCreate} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name (e.g. Watches)"
            className="flex-1 bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="bg-black text-white text-[11px] tracking-[0.12em] uppercase px-6 py-3 hover:bg-[#1a1a1a] transition-colors duration-200 disabled:opacity-40"
          >
            {creating ? "Adding…" : "+ Add"}
          </button>
        </form>

        {error && <p className="text-[13px] text-red-600 mb-6">{error}</p>}

        {loading ? (
          <p className="text-[13px] text-[#6B6B6B]">Loading categories…</p>
        ) : categories.length === 0 ? (
          <p className="text-[13px] text-[#6B6B6B]">No categories yet — add your first one above.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {categories.map((c) => (
              <div key={c.id} className="border border-[#EAEAEA]">
                {/* NAME ROW */}
                <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#EAEAEA]">
                  {editingId === c.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        className="flex-1 bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2 text-[14px] outline-none focus:border-black transition-colors duration-200"
                      />
                      <div className="flex gap-3 shrink-0">
                        <button
                          onClick={() => handleSaveEdit(c.id)}
                          disabled={saving}
                          className="text-[11px] tracking-[0.08em] uppercase border-b border-black pb-0.5 hover:opacity-60 transition-opacity disabled:opacity-40"
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] hover:text-black transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-[13.5px] font-medium">{c.name}</p>
                        <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                          {c.products_count ?? 0} product{(c.products_count ?? 0) === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button
                          onClick={() => startEditing(c)}
                          className="text-[11px] tracking-[0.08em] uppercase border-b border-black pb-0.5 hover:opacity-60 transition-opacity"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c.id}
                          className="text-[11px] tracking-[0.08em] uppercase text-red-600 border-b border-red-600 pb-0.5 hover:opacity-60 transition-opacity disabled:opacity-40"
                        >
                          {deletingId === c.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* IMAGES ROW */}
                <div className="grid grid-cols-2 gap-4 p-5">
                  {/* Default image */}
                  <div>
                    <p className="text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-2">Default Photo</p>
                    <div className="aspect-[4/3] bg-[#F5F5F5] mb-2 overflow-hidden">
                      {c.image_path ? (
                        <img src={siteImageUrl(c.image_path)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B6B6B] text-center px-2">
                          No image — using placeholder
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 text-center text-[10px] tracking-[0.06em] uppercase border border-black px-2 py-2 cursor-pointer hover:bg-black hover:text-white transition-colors duration-200">
                        {imageBusyKey === `${c.id}-default` ? "…" : c.image_path ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={imageBusyKey === `${c.id}-default`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadDefault(c, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {c.image_path && (
                        <button
                          onClick={() => handleRemoveDefault(c)}
                          disabled={imageBusyKey === `${c.id}-default`}
                          className="text-[10px] tracking-[0.06em] uppercase text-red-600 border border-red-600 px-2 py-2 hover:bg-red-600 hover:text-white transition-colors duration-200 disabled:opacity-40"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hover image */}
                  <div>
                    <p className="text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-2">Hover Photo</p>
                    <div className="aspect-[4/3] bg-[#F5F5F5] mb-2 overflow-hidden">
                      {c.hover_image_path ? (
                        <img src={siteImageUrl(c.hover_image_path)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6B6B6B] text-center px-2">
                          No image — using placeholder
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 text-center text-[10px] tracking-[0.06em] uppercase border border-black px-2 py-2 cursor-pointer hover:bg-black hover:text-white transition-colors duration-200">
                        {imageBusyKey === `${c.id}-hover` ? "…" : c.hover_image_path ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={imageBusyKey === `${c.id}-hover`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadHover(c, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {c.hover_image_path && (
                        <button
                          onClick={() => handleRemoveHover(c)}
                          disabled={imageBusyKey === `${c.id}-hover`}
                          className="text-[10px] tracking-[0.06em] uppercase text-red-600 border border-red-600 px-2 py-2 hover:bg-red-600 hover:text-white transition-colors duration-200 disabled:opacity-40"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}