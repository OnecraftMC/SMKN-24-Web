"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { BeritaDTO, BeritaStatus } from "@/lib/admin/types";
import { todayIso } from "@/lib/admin/format";
import {
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import ImageField from "@/components/admin/ui/ImageField";
import CategoryField from "@/components/admin/ui/CategoryField";

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

function formFromRow(row: BeritaDTO): BeritaFormValues {
  return {
    judul: row.judul,
    kategori: row.kategori,
    // tanggalIso berasal dari backend (B2); fallback string tampil bila kosong.
    tanggal: row.tanggalIso ?? row.tanggal,
    gambar: row.gambar,
    ringkasan: row.ringkasan ?? "",
    isi: row.isi ?? "",
    status: row.status ?? "terbit",
    utama: row.utama,
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function BeritaDialog({
  editing,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: BeritaDTO | null;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<BeritaFormValues>(() =>
    editing ? formFromRow(editing) : newBeritaForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof BeritaFormValues>(key: K, value: BeritaFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

      onSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan berita.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit Berita" : "Tambah Berita"}
      description={
        form.utama
          ? "Menyimpan sebagai berita utama mematikan penanda utama berita lain."
          : "Simpan sebagai draft bila konten belum siap terbit."
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonGhostClass} disabled={saving}>
            Batal
          </button>
          <button type="submit" form="berita-form" className={buttonPrimaryClass} disabled={saving}>
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
      <form id="berita-form" onSubmit={handleSubmit} noValidate className="space-y-space-md">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <Field htmlFor="berita-judul" label="Judul">
          <input
            id="berita-judul"
            className={fieldClass}
            value={form.judul}
            onChange={(e) => update("judul", e.target.value)}
            maxLength={255}
          />
        </Field>

        <div className="grid gap-space-md sm:grid-cols-2">
          <CategoryField
            module="berita"
            value={form.kategori}
            onChange={(kategori) => update("kategori", kategori ?? "")}
            onUnauthorized={onUnauthorized}
            required
          />

          <Field htmlFor="berita-tanggal" label="Tanggal">
            <input
              id="berita-tanggal"
              type="date"
              className={fieldClass}
              value={form.tanggal.slice(0, 10)}
              onChange={(e) => update("tanggal", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-space-md sm:grid-cols-2">
          <Field htmlFor="berita-status" label="Status">
            <select
              id="berita-status"
              className={fieldClass}
              value={form.status}
              onChange={(e) => update("status", e.target.value as BeritaStatus)}
            >
              <option value="draft">Draft</option>
              <option value="terbit">Terbit</option>
            </select>
          </Field>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
              <input
                type="checkbox"
                checked={form.utama}
                onChange={(e) => update("utama", e.target.checked)}
              />
              Jadikan berita utama (highlight)
            </label>
          </div>
        </div>

        <ImageField value={form.gambar} onChange={(path) => update("gambar", path)} />

        <Field htmlFor="berita-ringkasan" label="Ringkasan">
          <textarea
            id="berita-ringkasan"
            rows={3}
            className={fieldClass}
            value={form.ringkasan}
            onChange={(e) => update("ringkasan", e.target.value)}
          />
        </Field>

        <Field htmlFor="berita-isi" label="Isi berita">
          <textarea
            id="berita-isi"
            rows={6}
            className={fieldClass}
            value={form.isi}
            onChange={(e) => update("isi", e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}
