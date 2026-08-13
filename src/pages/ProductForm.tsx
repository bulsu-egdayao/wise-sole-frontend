import React, { useEffect, useState } from "react";
import type { Product, Category, ProductImage } from "../types/product";
import { createProduct, updateProduct } from "../services/adminProducts";
import type { ProductFormData, SizeFormRow } from "../services/adminProducts";
import { uploadProductImages, deleteProductImage, reorderProductImages, imageUrl } from "../services/productImages";
import { useConfirm } from "../hooks/useConfirm";
import ImageCropModal from "../components/ImageCropModal";

interface ProductFormProps {
  product: Product | null; // null = creating a new product, otherwise editing this one
  onSaved: () => void;
  onCancel: () => void;
}

const API_URL = import.meta.env.VITE_API_URL as string;

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  price: "",
  sale_price: "",
  category_id: "",
  stock: "0",
  is_available: true,
  is_featured: false,
  is_new: false,
  sizes: [],
};

export default function ProductForm({ product, onSaved, onCancel }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [existingImages, setExistingImages] = useState<ProductImage[]>(product?.images || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [reorderingImages, setReorderingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [currentProductId, setCurrentProductId] = useState<number | null>(product?.id ?? null);

  const [draggedExistingIndex, setDraggedExistingIndex] = useState<number | null>(null);
  const [draggedPendingIndex, setDraggedPendingIndex] = useState<number | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // Crop flow: a queue of newly-picked files waiting to be cropped one at a time,
  // plus which pending thumbnail (if any) is being re-cropped after the fact.
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [reCropIndex, setReCropIndex] = useState<number | null>(null);

  const isEditing = product !== null;

  console.log("RENDER — cropQueue:", cropQueue, "length:", cropQueue.length);

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setError("Failed to load categories."));
  }, []);

  useEffect(() => {
    if (form.sizes.length > 0) {
      const total = form.sizes.reduce((sum, s) => sum + (parseInt(s.stock) || 0), 0);
      setForm((prev) => ({ ...prev, stock: String(total) }));
    }
  }, [form.sizes]);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || "",
        price: product.price,
        sale_price: product.sale_price ?? "",
        category_id: String(product.category_id),
        stock: String(product.stock),
        is_available: product.is_available,
        is_featured: product.is_featured,
        is_new: product.is_new,
        sizes: (product.sizes || []).map((s) => ({ size: s.size, stock: String(s.stock) })),
      });
      setExistingImages([...(product.images || [])].sort((a, b) => a.sort_order - b.sort_order));
      setCurrentProductId(product.id);
    } else {
      setForm(emptyForm);
      setExistingImages([]);
      setCurrentProductId(null);
    }
  }, [product]);

  const handleChange = (field: keyof ProductFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addSizeRow = () => {
    setForm((prev) => ({ ...prev, sizes: [...prev.sizes, { size: "", stock: "0" }] }));
  };

  const updateSizeRow = (index: number, field: keyof SizeFormRow, value: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const removeSizeRow = (index: number) => {
    setForm((prev) => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== index) }));
  };

  const priceNum = parseFloat(form.price) || 0;
  const saleNum = parseFloat(form.sale_price) || 0;
  const discountPercent =
    form.sale_price && priceNum > 0 && saleNum > 0 && saleNum < priceNum
      ? Math.round(((priceNum - saleNum) / priceNum) * 100)
      : null;
  const saleInvalid = form.sale_price !== "" && saleNum > 0 && priceNum > 0 && saleNum >= priceNum;

  // --- Images: selection now feeds a crop queue instead of going straight to selectedFiles ---
const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const fileArray = files ? Array.from(files) : [];
    console.log("handleFilesSelected fired, files:", fileArray.length);
    if (fileArray.length > 0) {
      setCropQueue((prev) => {
        console.log("setCropQueue called, prev:", prev.length, "adding:", fileArray.length);
        return [...prev, ...fileArray];
      });
    }
    e.target.value = "";
};

  // Called when the crop modal for a newly-picked file is applied
  const handleCropApplied = (croppedFile: File) => {
    setSelectedFiles((prev) => [...prev, croppedFile]);
    setCropQueue((prev) => prev.slice(1));
  };

  // Skip cropping this file (don't add it) and move to the next one in the queue
  const handleCropCancelled = () => {
    setCropQueue((prev) => prev.slice(1));
  };

  // Re-cropping an already-selected pending file
  const handleReCropApplied = (croppedFile: File) => {
    if (reCropIndex === null) return;
    setSelectedFiles((prev) => prev.map((f, i) => (i === reCropIndex ? croppedFile : f)));
    setReCropIndex(null);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (image: ProductImage) => {
    if (!currentProductId) return;
    if (!(await confirm("Delete this image?", { danger: true }))) return;
    setDeletingImageId(image.id);
    try {
      const updated = await deleteProductImage(currentProductId, image.id);
      setExistingImages([...(updated.images || [])].sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleExistingDragStart = (index: number) => {
    setDraggedExistingIndex(index);
  };

  const handleExistingDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedExistingIndex === null || draggedExistingIndex === index) return;

    setExistingImages((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(draggedExistingIndex, 1);
      reordered.splice(index, 0, moved);
      return reordered;
    });
    setDraggedExistingIndex(index);
  };

  const handleExistingDragEnd = async () => {
    setDraggedExistingIndex(null);
    if (!currentProductId) return;
    setReorderingImages(true);
    try {
      const orderedIds = existingImages.map((img) => img.id);
      const updated = await reorderProductImages(currentProductId, orderedIds);
      setExistingImages([...(updated.images || [])].sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save new image order");
    } finally {
      setReorderingImages(false);
    }
  };

  const handlePendingDragStart = (index: number) => {
    setDraggedPendingIndex(index);
  };

  const handlePendingDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPendingIndex === null || draggedPendingIndex === index) return;

    setSelectedFiles((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(draggedPendingIndex, 1);
      reordered.splice(index, 0, moved);
      return reordered;
    });
    setDraggedPendingIndex(index);
  };

  const handlePendingDragEnd = () => {
    setDraggedPendingIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.price || !form.category_id) {
      setError("Name, price, and category are required.");
      return;
    }

    if (saleInvalid) {
      setError("Sale price must be lower than the regular price.");
      return;
    }

    setSaving(true);
    try {
      let savedProduct: Product;

      if (isEditing && product) {
        savedProduct = await updateProduct(product.id, form);
      } else {
        savedProduct = await createProduct(form);
      }

      setCurrentProductId(savedProduct.id);

      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        await uploadProductImages(savedProduct.id, selectedFiles);
        setUploadingImages(false);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  return (
    <>
      <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="min-h-screen bg-white text-black">
        <header className="sticky top-0 z-10 bg-white border-b border-[#EAEAEA]">
          <div className="max-w-[720px] mx-auto px-6 h-[64px] flex items-center gap-4">
            <button onClick={onCancel} className="text-[13px] text-[#6B6B6B] hover:text-black transition-colors duration-200">
              ← Products
            </button>
            <h1 className="text-[15px] font-semibold">{isEditing ? "Edit Product" : "Add Product"}</h1>
          </div>
        </header>

        <main className="max-w-[720px] mx-auto px-6 py-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                Product Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                  Price (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  required
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                  Sale Price (₱) — optional
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.sale_price}
                  onChange={(e) => handleChange("sale_price", e.target.value)}
                  placeholder="Leave blank for no sale"
                  className={`w-full bg-[#F5F5F5] border px-4 py-3 text-[14px] outline-none transition-colors duration-200 ${
                    saleInvalid ? "border-red-500 focus:border-red-500" : "border-[#EAEAEA] focus:border-black"
                  }`}
                />
              </div>
            </div>

            {discountPercent !== null && !saleInvalid && (
              <p className="text-[12px] text-black -mt-3">
                This will show as <span className="font-semibold">{discountPercent}% OFF</span> on the site.
              </p>
            )}
            {saleInvalid && (
              <p className="text-[12px] text-red-600 -mt-3">
                Sale price must be lower than the regular price.
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                  Base Stock Quantity
                </label>
              <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => handleChange("stock", e.target.value)}
                  required
                  readOnly={form.sizes.length > 0}
                  className={`w-full border px-4 py-3 text-[14px] outline-none transition-colors duration-200 ${
                    form.sizes.length > 0
                      ? "bg-[#EAEAEA] border-[#EAEAEA] text-[#6B6B6B] cursor-not-allowed"
                      : "bg-[#F5F5F5] border-[#EAEAEA] focus:border-black"
                  }`}
                />
                <p className="text-[11px] text-[#6B6B6B] mt-1.5">
                  {form.sizes.length > 0
                    ? "Auto-calculated as the total of all sizes' stock below."
                    : "Used when this product has no sizes below. If sizes are added, their stock is tracked separately."}
                </p>
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                  Category
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => handleChange("category_id", e.target.value)}
                  required
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] px-4 py-3 text-[14px] outline-none focus:border-black transition-colors duration-200"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                Sizes &amp; Stock — optional
              </label>
              <p className="text-[11px] text-[#6B6B6B] mb-3">
                Add sizes for apparel/footwear (e.g. S, M, L or 40, 41, 42). Skip this entirely for products
                like bags, watches, or perfumes.
              </p>

              {form.sizes.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {form.sizes.map((row, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={row.size}
                        onChange={(e) => updateSizeRow(i, "size", e.target.value)}
                        placeholder="Size (e.g. M, 42)"
                        className="flex-1 bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors duration-200"
                      />
                      <input
                        type="number"
                        min="0"
                        value={row.stock}
                        onChange={(e) => updateSizeRow(i, "stock", e.target.value)}
                        placeholder="Stock"
                        className="w-28 bg-[#F5F5F5] border border-[#EAEAEA] px-3 py-2.5 text-[13px] outline-none focus:border-black transition-colors duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeSizeRow(i)}
                        className="w-9 h-9 flex items-center justify-center border border-[#EAEAEA] hover:border-red-500 hover:text-red-500 transition-colors duration-200 text-[16px]"
                        aria-label="Remove size"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addSizeRow}
                className="text-[11px] tracking-[0.08em] uppercase border border-[#EAEAEA] px-4 py-2.5 hover:border-black transition-colors duration-200"
              >
                + Add Size
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2.5 text-[13px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => handleChange("is_available", e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                Available for sale
              </label>
              <label className="flex items-center gap-2.5 text-[13px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => handleChange("is_featured", e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                Featured on homepage
              </label>
              <label className="flex items-center gap-2.5 text-[13px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_new}
                  onChange={(e) => handleChange("is_new", e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                Mark as New Arrival
              </label>
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-1.5">
                Product Images
              </label>
              <p className="text-[11px] text-[#6B6B6B] mb-3">
                Drag any thumbnail to reorder. Whichever image is first becomes the primary photo shown
                across the site. New photos are cropped to match the site's display ratio before upload.
              </p>

              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-2">
                    Uploaded {reorderingImages && "· Saving order…"}
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {existingImages.map((img, i) => (
                      <div
                        key={img.id}
                        draggable
                        onDragStart={() => handleExistingDragStart(i)}
                        onDragOver={(e) => handleExistingDragOver(e, i)}
                        onDragEnd={handleExistingDragEnd}
                        className={`relative aspect-square bg-[#F5F5F5] group cursor-move transition-opacity duration-150 ${
                          draggedExistingIndex === i ? "opacity-40" : "opacity-100"
                        }`}
                      >
                        <img
                          src={imageUrl(img.image_path)}
                          alt=""
                          draggable={false}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 bg-black text-white text-[9px] tracking-[0.08em] uppercase px-1.5 py-0.5">
                            Primary
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingImage(img)}
                          disabled={deletingImageId === img.id}
                          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-white/90 text-[13px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-40"
                          aria-label="Delete image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-2">
                    Pending Upload
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={() => handlePendingDragStart(i)}
                        onDragOver={(e) => handlePendingDragOver(e, i)}
                        onDragEnd={handlePendingDragEnd}
                        className={`relative aspect-square bg-[#F5F5F5] group cursor-move transition-opacity duration-150 ${
                          draggedPendingIndex === i ? "opacity-40" : "opacity-100"
                        }`}
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          draggable={false}
                          className="w-full h-full object-cover opacity-80 pointer-events-none"
                        />
                        <span className="absolute top-1 left-1 bg-white/90 text-[9px] tracking-[0.08em] uppercase px-1.5 py-0.5">
                          {existingImages.length === 0 && i === 0 ? "Will be primary" : "Pending"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReCropIndex(i)}
                          className="absolute bottom-1 left-1 right-1 text-center bg-white/90 text-[9px] tracking-[0.08em] uppercase py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(i)}
                          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-white/90 text-[13px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          aria-label="Remove selected file"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="inline-flex items-center gap-2 text-[12px] tracking-[0.04em] border border-[#EAEAEA] px-4 py-2.5 cursor-pointer hover:border-black transition-colors duration-200">
                + Choose Images
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-[#6B6B6B] mt-1.5">
                JPG, PNG, or WebP. Max 5MB each. New images upload after you save the product.
              </p>
            </div>

            {error && <p className="text-[13px] text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-black text-white text-[11px] tracking-[0.12em] uppercase px-6 py-3.5 hover:bg-[#1a1a1a] transition-colors duration-200 disabled:opacity-50"
              >
                {saving
                  ? uploadingImages
                    ? "Uploading images…"
                    : "Saving…"
                  : isEditing
                  ? "Save Changes"
                  : "Create Product"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="border border-[#EAEAEA] text-[11px] tracking-[0.12em] uppercase px-6 py-3.5 hover:border-black transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      </div>

      {cropQueue.length > 0 && (
        <ImageCropModal
          key={cropQueue[0].name + cropQueue[0].size}
          file={cropQueue[0]}
          onCancel={handleCropCancelled}
          onApply={handleCropApplied}
        />
      )}

      {reCropIndex !== null && selectedFiles[reCropIndex] && (
        <ImageCropModal
          key={`recrop-${reCropIndex}`}
          file={selectedFiles[reCropIndex]}
          onCancel={() => setReCropIndex(null)}
          onApply={handleReCropApplied}
        />
      )}

      {ConfirmDialog}
    </>
  );
}