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
import { useConfirm } from "../hooks/useConfirm";
import { getProductTypes, createProductType, deleteProductType, type ProductType } from "../services/productTypes";

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

  const [imageBusyKey, setImageBusyKey] = useState<string | null>(null);

  const [allTypes, setAllTypes] = useState<ProductType[]>([]);
  const [newTypeNameByCategory, setNewTypeNameByCategory] = useState<Record<number, string>>({});
  const [creatingTypeCategoryId, setCreatingTypeCategoryId] = useState<number | null>(null);
  const [deletingTypeId, setDeletingTypeId] = useState<number | null>(null);

  const { confirm, notify, ConfirmDialog } = useConfirm();

  const loadCategories = () => {
    setLoading(true);
    getAllCategories()
      .then(setCategories)
      .catch(() => setError("Failed to load categories."))
      .finally(() => setLoading(false));
  };

  const loadTypes = () => {
    getProductTypes()
      .then(setAllTypes)
      .catch(() => {});
  };

  useEffect(() => {
    if (!getToken()) {
      onBack();
      return;
    }
    loadCategories();
    loadTypes();
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
      await notify(
        `"${category.name}" has ${category.products_count} product(s) attached. Move or delete those products first, then delete this category.`
      );
      return;
    }
    if (!(await confirm(`Delete "${category.name}"? This cannot be undone.`, { danger: true }))) return;

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
    if (!(await confirm("Remove this image and revert to the placeholder?"))) return;
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
    if (!(await confirm("Remove this image and revert to the placeholder?"))) return;
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

  const handleAddType = async (categoryId: number) => {
    const name = (newTypeNameByCategory[categoryId] || "").trim();
    if (!name) return;
    setCreatingTypeCategoryId(categoryId);
    try {
      await createProductType(categoryId, name);
      setNewTypeNameByCategory((prev) => ({ ...prev, [categoryId]: "" }));
      loadTypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add type");
    } finally {
      setCreatingTypeCategoryId(null);
    }
  };

  const handleDeleteType = async (type: ProductType) => {
    if ((type.products_count ?? 0) > 0) {
      await notify(
        `"${type.name}" has ${type.products_count} product(s) tagged with it. Remove the tag from those products first.`
      );
      return;
    }
    if (!(await confirm(`Delete type "${type.name}"?`, { danger: true }))) return;
    setDeletingTypeId(type.id);
    try {
      await deleteProductType(type.id);
      loadTypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete type");
    } finally {
      setDeletingTypeId(null);
    }
  };

  return (
    <>
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
              {categories.map((c) => {
                const typesForCategory = allTypes.filter((t) => t.category_id === c.id);
                return (
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

                  {/* PRODUCT TYPES ROW */}
                  <div className="px-5 pb-5 pt-1 border-t border-[#EAEAEA]">
                    <p className="text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1 mt-3">
                      Product Types
                    </p>
                    <p className="text-[11px] text-[#6B6B6B] mb-3">
                      Optional sub-categories within {c.name} (e.g. Comfy, Classic, Chunky) — shown as filters
                      to shoppers browsing this category.
                    </p>

                    {typesForCategory.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {typesForCategory.map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-1.5 text-[11px] bg-[#F5F5F5] border border-[#EAEAEA] px-2.5 py-1.5"
                          >
                            {t.name}
                            <button
                              onClick={() => handleDeleteType(t)}
                              disabled={deletingTypeId === t.id}
                              className="text-[13px] leading-none hover:text-red-600 transition-colors duration-200 disabled:opacity-40"
                              aria-label={`Delete ${t.name}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTypeNameByCategory[c.id] || ""}
                        onChange={(e) =>
                          setNewTypeNameByCategory((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddType(c.id);
                          }
                        }}
                        placeholder="New type (e.g. Comfy)"
                        className="flex-1 bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2 text-[12px] outline-none focus:border-black transition-colors duration-200"
                      />
                      <button
                        onClick={() => handleAddType(c.id)}
                        disabled={creatingTypeCategoryId === c.id || !(newTypeNameByCategory[c.id] || "").trim()}
                        className="text-[10px] tracking-[0.08em] uppercase border border-[#EAEAEA] px-3 py-2 hover:border-black transition-colors duration-200 disabled:opacity-40"
                      >
                        {creatingTypeCategoryId === c.id ? "Adding…" : "+ Add"}
                      </button>
                    </div>
                  </div>
                </div>
              );})}
            </div>
          )}
        </main>
      </div>
      {ConfirmDialog}
    </>
  );
}