"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { GaleriDTO } from "@/lib/admin/types";
import {
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import ImageField from "@/components/admin/ui/ImageField";

export type GaleriFormValues = {
  judul: string;
  kategori: string;
  gambar: string | null;
};

const KATEGORI_SARAN = ["Kegiatan", "Prestasi", "Fasilitas", "Lainnya"];

function emptyForm(): GaleriFormValues {
  return { judul: "", kategori: "", gambar: null };
}

function formFromRow(row: GaleriDTO): GaleriFormValues {
  return { judul: row.judul, kategori: row.kategori, gambar: row.gambar };
}

export default function GaleriDialog({
  editing,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: GaleriDTO | null;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<GaleriFormValues>(() =>
    editing ? formFromRow(editing) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof GaleriFormValues>(key: K, value: GaleriFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Backend mewajibkan judul + kategori + gambar (validate() di api/galeri).
    if (form.judul.trim() === "") {
      setError("Judul wajib diisi.");
      return;
    }
    if (form.kategori.trim() === "") {
      setError("Kategori wajib diisi.");
      return;
    }
    if (!form.gambar) {
      setError("Gambar wajib diunggah untuk galeri.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const payload = {
        judul: form.judul.trim(),
        kategori: form.kategori.trim(),
        gambar: form.gambar,
      };

      if (editing) {
        await apiRequest(`/api/galeri/index.php?id=${editing.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/api/galeri/index.php", { method: "POST", body: payload });
      }

      onSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan galeri.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit foto galeri" : "Tambah foto galeri"}
      description="Gambar wajib diunggah — backend mewajibkan judul, kategori, dan gambar."
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonGhostClass} onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            type="submit"
            form="galeri-form"
            className={buttonPrimaryClass}
            disabled={saving}
          >
            {saving ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden className="h-4 w-4" />
            )}
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </>
      }
    >
      <form id="galeri-form" onSubmit={handleSubmit} noValidate className="space-y-space-md">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <Field htmlFor="galeri-judul" label="Judul">
          <input
            id="galeri-judul"
            className={fieldClass}
            value={form.judul}
            onChange={(e) => update("judul", e.target.value)}
            maxLength={255}
          />
        </Field>

        <Field
          htmlFor="galeri-kategori"
          label="Kategori"
          hint="Teks bebas; saran: Kegiatan, Prestasi, Fasilitas, Lainnya."
        >
          <input
            id="galeri-kategori"
            className={fieldClass}
            value={form.kategori}
            onChange={(e) => update("kategori", e.target.value)}
            list="galeri-kategori-saran"
            maxLength={100}
          />
          <datalist id="galeri-kategori-saran">
            {KATEGORI_SARAN.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </Field>

        <ImageField
          label="Gambar galeri (wajib)"
          value={form.gambar}
          onChange={(path) => update("gambar", path)}
        />
      </form>
    </Modal>
  );
}