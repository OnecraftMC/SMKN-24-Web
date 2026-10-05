"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { ImageUp, Loader2, Trash2, X } from "lucide-react";
import { assetUrl } from "@/lib/admin/api";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  uploadImage,
  validateImageFile,
} from "@/lib/admin/upload";
import { buttonGhostClass, labelClass } from "@/components/admin/ui/FormBits";

/**
 * Field gambar bersama: pilih file, validasi klien, unggah ke backend,
 * lalu simpan path hasil upload. Menampilkan pratinjau dan pesan galat.
 */
export default function ImageField({
  value,
  onChange,
  label = "Gambar",
  cropAspectRatio,
  cropShape = "rect",
}: {
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
  cropAspectRatio?: number;
  cropShape?: "rect" | "round";
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const preview = assetUrl(value);

  useEffect(() => {
    if (!cropSource) return;
    return () => URL.revokeObjectURL(cropSource);
  }, [cropSource]);

  function closeCropper() {
    setCropSource(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      validateImageFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Berkas tidak valid.");
      return;
    }

    if (cropAspectRatio) {
      setCropSource(URL.createObjectURL(file));
      return;
    }

    await uploadFile(file);
  }

  async function uploadFile(file: File): Promise<boolean> {
    setUploading(true);
    try {
      const path = await uploadImage(file);
      onChange(path);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
      return false;
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function saveCrop() {
    if (!cropSource || !croppedArea) return;
    setUploading(true);
    setError(null);

    try {
      const image = new window.Image();
      image.src = cropSource;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Gambar tidak dapat dibuka untuk dipotong."));
      });

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(croppedArea.width);
      canvas.height = Math.round(croppedArea.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser tidak dapat memproses gambar.");
      context.drawImage(
        image,
        croppedArea.x,
        croppedArea.y,
        croppedArea.width,
        croppedArea.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error("Gambar hasil crop gagal dibuat.")),
          "image/jpeg",
          0.92,
        );
      });
      const croppedFile = new File([blob], "gambar-crop.jpg", { type: "image/jpeg" });
      if (await uploadFile(croppedFile)) closeCropper();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memotong gambar.");
      setUploading(false);
    }
  }

  return (
    <div>
      <span className={labelClass}>{label}</span>

      <div className="flex flex-wrap items-center gap-space-md">
        <div className={`flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden border border-outline-variant bg-surface-container-low ${cropShape === "round" ? "rounded-full !h-24 !w-24" : "rounded-lg"}`}>
          {preview ? (
            <Image
              src={preview}
              alt="Pratinjau gambar"
              width={160}
              height={96}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Belum ada gambar
            </span>
          )}
        </div>

        <div className="space-y-1">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-space-xs">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={buttonGhostClass}
            >
              {uploading ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <ImageUp aria-hidden className="h-4 w-4" />
              )}
              {uploading ? "Mengunggah…" : value ? "Ganti gambar" : "Pilih gambar"}
            </button>
            {value && !uploading && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  onChange(null);
                }}
                className={buttonGhostClass}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
                Hapus gambar
              </button>
            )}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            JPG, PNG, WEBP, atau GIF. Maksimal {MAX_IMAGE_BYTES / (1024 * 1024)} MB.
            {cropAspectRatio && " Foto dapat disesuaikan sebelum diunggah."}
          </p>
          {error && (
            <p role="alert" className="font-body-sm text-body-sm font-bold text-error">
              {error}
            </p>
          )}
        </div>
      </div>

      {cropSource && cropAspectRatio && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/70 p-4"
          role="presentation"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              if (!uploading) closeCropper();
            }
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !uploading) closeCropper();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${inputId}-crop-title`}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-surface-container p-space-md">
              <div>
                <h2 id={`${inputId}-crop-title`} className="font-title-md font-bold text-primary">
                  Sesuaikan foto
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Geser foto dan atur pembesaran sebelum mengunggah.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCropper}
                disabled={uploading}
                aria-label="Tutup editor crop"
                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </header>
            <div className="space-y-space-md p-space-md">
              <div className="relative h-[min(60vh,26rem)] w-full overflow-hidden rounded-xl bg-primary/90">
                <Cropper
                  image={cropSource}
                  crop={crop}
                  zoom={zoom}
                  aspect={cropAspectRatio}
                  cropShape={cropShape}
                  showGrid
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCroppedArea(areaPixels)}
                  aria-label="Area crop gambar"
                />
              </div>
              <label className="block space-y-1.5 text-sm font-semibold text-on-surface">
                <span>Perbesar foto</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full accent-primary"
                />
              </label>
              <div className="flex justify-end gap-space-sm">
                <button
                  type="button"
                  onClick={closeCropper}
                  disabled={uploading}
                  className={buttonGhostClass}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => void saveCrop()}
                  disabled={uploading || !croppedArea}
                  className={buttonGhostClass}
                >
                  {uploading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
                  {uploading ? "Mengunggah…" : "Gunakan foto"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
