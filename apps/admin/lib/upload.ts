/**
 * Upload gambar ke backend (`POST /api/upload.php`, field `gambar`).
 *
 * Validasi klien di sini hanya untuk UX cepat; backend tetap validator final
 * (MIME via finfo + maksimum 5 MB) dan bisa menolak dengan pesan `{ error }`.
 */

import { apiUpload } from "@/lib/api";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB — sama dengan backend

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type UploadResult = { url: string };

/** Melempar Error dengan pesan Bahasa Indonesia bila file tidak lolos validasi. */
export function validateImageFile(file: File): void {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Format gambar harus JPG, PNG, WEBP, atau GIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }
}

/** Mengembalikan path gambar yang disimpan backend, mis. `/backend/uploads/ab12.jpg`. */
export async function uploadImage(file: File): Promise<string> {
  validateImageFile(file);

  const formData = new FormData();
  formData.append("gambar", file);

  const result = await apiUpload<UploadResult>("/api/upload.php", formData);
  return result.url;
}
