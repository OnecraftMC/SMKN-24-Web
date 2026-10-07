"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { BeritaDTO, BeritaStatus } from "@/lib/admin/types";
import { todayIso } from "@/lib/admin/format";
import type { BeritaDraft } from "@/components/admin/ui/AiWriterPanel";

export type BeritaFormValues = {
  judul: string;
  kategori: string;
  tanggal: string;
  gambar: string | null;
  ringkasan: string;
  isi: string;
  status: BeritaStatus;
  utama: boolean;
};

export function newBeritaForm(): BeritaFormValues {
  return {
    judul: "",
    kategori: "",
    tanggal: todayIso(),
    gambar: null,
    ringkasan: "",
    isi: "",
    status: "draft",
    utama: false,
  };
}

export function formFromRow(row: BeritaDTO): BeritaFormValues {
  return {
    judul: row.judul,
    kategori: row.kategori,
    tanggal: row.tanggalIso ?? row.tanggal,
    gambar: row.gambar,
    ringkasan: row.ringkasan ?? "",
    isi: row.isi ?? "",
    status: row.status ?? "terbit",
    utama: row.utama,
  };
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * State + submit form berita halaman penuh. Tampilan ada di BeritaEditorForm.tsx.
 * AI writer hanya mengisi field; tidak pernah menyimpan otomatis.
 */
export function useBeritaForm({
  editing,
  onUnauthorized,
}: {
  editing: BeritaDTO | null;
  onUnauthorized: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<BeritaFormValues>(() =>
    editing ? formFromRow(editing) : newBeritaForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  function update<K extends keyof BeritaFormValues>(key: K, value: BeritaFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyDraft(draf: BeritaDraft) {
    setForm((prev) => {
      const next = {
        ...prev,
        judul: draf.judul || prev.judul,
        ringkasan: draf.ringkasan || prev.ringkasan,
      };
      // Jangan timpa isi editor yang sudah terisi tanpa konfirmasi.
      if (!draf.isi) return next;
      const prevEmpty = prev.isi.replace(/<[^>]*>/g, "").trim() === "";
      if (prevEmpty) return { ...next, isi: draf.isi };
      const timpa = window.confirm(
        "Isi berita sudah terisi. Ganti dengan draf AI? (Pilih Batal untuk mempertahankan.)",
      );
      return timpa ? { ...next, isi: draf.isi } : next;
    });
  }

  function validate(): string | null {
    if (form.judul.trim() === "") return "Judul wajib diisi.";
    if (form.kategori.trim() === "") return "Kategori wajib diisi.";
    if (!ISO_DATE.test(form.tanggal)) return "Tanggal wajib diisi (format YYYY-MM-DD).";
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const payload = {
        judul: form.judul.trim(),
        kategori: form.kategori.trim(),
        tanggal: form.tanggal,
        gambar: form.gambar,
        ringkasan: form.ringkasan,
        isi: form.isi,
        status: form.status,
        utama: form.utama,
      };

      if (editing) {
        await apiRequest(`/api/berita/index.php?id=${editing.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/api/berita/index.php", { method: "POST", body: payload });
      }

      router.push("/admin/berita");
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan berita.");
    } finally {
      setSaving(false);
    }
  }

  return { form, update, applyDraft, error, saving, preview, setPreview, handleSubmit, router };
}
