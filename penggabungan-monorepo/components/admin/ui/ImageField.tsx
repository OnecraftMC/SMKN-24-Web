"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
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
}: {
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = assetUrl(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      validateImageFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Berkas tidak valid.");
      return;
    }

    setUploading(true);
    try {
      const path = await uploadImage(file);
      onChange(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <span className={labelClass}>{label}</span>

      <div className="flex flex-wrap items-center gap-space-md">
        <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
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
          </p>
          {error && (
            <p role="alert" className="font-body-sm text-body-sm font-bold text-error">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
