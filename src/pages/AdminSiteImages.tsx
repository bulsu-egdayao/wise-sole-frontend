import React, { useEffect, useState } from "react";
import type { SiteImageKey, SiteImagesMap } from "../services/siteImages";
import { getSiteImages, uploadSiteImage, deleteSiteImage, siteImageUrl } from "../services/siteImages";
import { getToken } from "../services/auth";

interface AdminSiteImagesProps {
  onBack: () => void;
}

const SLOTS: { key: SiteImageKey; label: string; hint: string }[] = [
  { key: "hero_main", label: "Hero Main Photo", hint: "The large image on the left of the homepage top section" },
  { key: "hero_side_1", label: "Hero Side Photo 1", hint: '"New Arrivals — Fall Drop" tile' },
  { key: "hero_side_2", label: "Hero Side Photo 2", hint: '"Accessories, Reconsidered" tile' },
  { key: "about_photo", label: "About Section Photo", hint: "Shown next to the About Wise Sole text" },
];

export default function AdminSiteImages({ onBack }: AdminSiteImagesProps) {
  const [images, setImages] = useState<SiteImagesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<SiteImageKey | null>(null);
  const [deletingKey, setDeletingKey] = useState<SiteImageKey | null>(null);

  const loadImages = () => {
    setLoading(true);
    getSiteImages()
      .then(setImages)
      .catch(() => setError("Failed to load site images."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) {
      onBack();
      return;
    }
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (key: SiteImageKey, file: File) => {
    setUploadingKey(key);
    setError(null);
    try {
      await uploadSiteImage(key, file);
      loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDelete = async (key: SiteImageKey) => {
    if (!window.confirm("Remove this image and revert to the placeholder?")) return;
    setDeletingKey(key);
    setError(null);
    try {
      await deleteSiteImage(key);
      loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove image");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }} className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-10 bg-white border-b border-[#EAEAEA]">
        <div className="max-w-[900px] mx-auto px-6 h-[64px] flex items-center gap-4">
          <button onClick={onBack} className="text-[13px] text-[#6B6B6B] hover:text-black transition-colors duration-200">
            ← Dashboard
          </button>
          <h1 className="text-[15px] font-semibold">Site Images</h1>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-10">
        <p className="text-[13px] text-[#6B6B6B] mb-8 max-w-[560px]">
          Replace the homepage's hero and about photos here. Anything you don't upload falls back to a
          placeholder automatically — nothing breaks if a slot is empty.
        </p>

        {error && <p className="text-[13px] text-red-600 mb-6">{error}</p>}

        {loading ? (
          <p className="text-[13px] text-[#6B6B6B]">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SLOTS.map((slot) => {
              const currentPath = images[slot.key];
              return (
                <div key={slot.key} className="border border-[#EAEAEA] p-5">
                  <p className="text-[13px] font-medium mb-1">{slot.label}</p>
                  <p className="text-[11px] text-[#6B6B6B] mb-4">{slot.hint}</p>

                  <div className="aspect-[4/3] bg-[#F5F5F5] mb-4 overflow-hidden">
                    {currentPath ? (
                      <img src={siteImageUrl(currentPath)} alt={slot.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-[#6B6B6B]">
                        No image set — using placeholder
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <label className="flex-1 text-center text-[11px] tracking-[0.08em] uppercase border border-black px-4 py-2.5 cursor-pointer hover:bg-black hover:text-white transition-colors duration-200">
                      {uploadingKey === slot.key ? "Uploading…" : currentPath ? "Replace" : "Upload"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={uploadingKey === slot.key}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(slot.key, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {currentPath && (
                      <button
                        onClick={() => handleDelete(slot.key)}
                        disabled={deletingKey === slot.key}
                        className="text-[11px] tracking-[0.08em] uppercase text-red-600 border border-red-600 px-4 py-2.5 hover:bg-red-600 hover:text-white transition-colors duration-200 disabled:opacity-40"
                      >
                        {deletingKey === slot.key ? "Removing…" : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}