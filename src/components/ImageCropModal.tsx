import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { getCroppedImageFile } from "../utils/cropImage";

interface ImageCropModalProps {
  file: File;
  onCancel: () => void;
  onApply: (croppedFile: File) => void;
}

export default function ImageCropModal({ file, onCancel, onApply }: ImageCropModalProps) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedFile = await getCroppedImageFile(imageUrl, croppedAreaPixels, file.name, file.type || "image/jpeg");
      onApply(croppedFile);
    } catch {
      alert("Failed to crop image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-[520px] shadow-xl">
        <div className="px-6 pt-6 pb-4 border-b border-[#EAEAEA]">
          <p className="text-[15px] font-semibold">Adjust Photo</p>
          <p className="text-[11px] text-[#6B6B6B] mt-1">
            Drag to reposition, use the slider to zoom. This crop will match how the photo appears across the site.
          </p>
        </div>

        <div className="relative w-full h-[400px] bg-[#0a0a0a]">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={4 / 5}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-6 py-4">
          <label className="block text-[10px] tracking-[0.08em] uppercase text-[#6B6B6B] mb-2">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-black"
          />
        </div>

        <div className="flex gap-3 justify-end px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={processing}
            className="text-[11px] tracking-[0.08em] uppercase border border-[#EAEAEA] px-4 py-2.5 hover:border-black transition-colors duration-200 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={processing || !croppedAreaPixels}
            className="text-[11px] tracking-[0.08em] uppercase bg-black text-white px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors duration-200 disabled:opacity-40"
          >
            {processing ? "Applying…" : "Apply Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}