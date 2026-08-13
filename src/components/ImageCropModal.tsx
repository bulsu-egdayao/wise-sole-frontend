import React, { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { getCroppedImageFile } from "../utils/cropImage";

interface ImageCropModalProps {
  file: File;
  onCancel: () => void;
  onApply: (croppedFile: File) => void;
}

// Starts the crop box covering the whole image (nothing cut off by default).
function centeredFullCrop(mediaWidth: number, mediaHeight: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 100,
      },
      mediaWidth / mediaHeight,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function ImageCropModal({ file, onCancel, onApply }: ImageCropModalProps) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const initial = centeredFullCrop(naturalWidth, naturalHeight);
    setCrop(initial);
  }, []);

  const handleApply = async () => {
    if (!completedCrop || !imgRef.current) return;
    setProcessing(true);
    try {
      const img = imgRef.current;
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedFile = await getCroppedImageFile(imageUrl, pixelCrop, file.name, file.type || "image/jpeg");
      onApply(croppedFile);
    } catch {
      alert("Failed to crop image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSkipCrop = () => {
    onApply(file);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-[560px] shadow-xl">
        <div className="px-6 pt-6 pb-4 border-b border-[#EAEAEA]">
          <p className="text-[15px] font-semibold">Adjust Photo</p>
          <p className="text-[11px] text-[#6B6B6B] mt-1">
            Drag the corners or edges to resize the crop box, or drag inside it to move it.
          </p>
        </div>

        <div className="w-full max-h-[480px] overflow-auto bg-[#0a0a0a] flex items-center justify-center p-2">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt=""
              onLoad={onImageLoad}
              style={{ maxHeight: "460px", maxWidth: "100%" }}
            />
          </ReactCrop>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-5">
          <button
            onClick={handleSkipCrop}
            disabled={processing}
            className="text-[11px] tracking-[0.08em] uppercase text-[#6B6B6B] border-b border-[#6B6B6B] pb-0.5 hover:text-black hover:border-black transition-colors duration-200 disabled:opacity-40"
          >
            Skip Crop — Use Original
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={processing}
              className="text-[11px] tracking-[0.08em] uppercase border border-[#EAEAEA] px-4 py-2.5 hover:border-black transition-colors duration-200 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={processing || !completedCrop}
              className="text-[11px] tracking-[0.08em] uppercase bg-black text-white px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors duration-200 disabled:opacity-40"
            >
              {processing ? "Applying…" : "Apply Crop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}