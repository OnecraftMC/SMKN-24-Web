"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { FasilitasDTO } from "@/lib/admin/types";
import {
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import ImageField from "@/components/admin/ui/ImageField";
import CategoryField from "@/components/admin/ui/CategoryField";
import AiWriterPanel, { type FasilitasDraft } from "@/components/admin/ui/AiWriterPanel";

export type FasilitasFormValues = {
  judul: string;
  deskripsi: string;
  gambar: string | null;
  kategori: string;
  unggulan: boolean;
};

function emptyForm(): FasilitasFormValues {
  return { judul: "", deskripsi: "", gambar: null, kategori: "", unggulan: false };
}

function formFromRow(row: FasilitasDTO): FasilitasFormValues {
  return {
    judul: row.judul,
    deskripsi: row.deskripsi ?? "",
    gambar: row.gambar,
    kategori: row.kategori ?? "",
    unggulan: row.unggulan,
  };
}

export default function FasilitasDialog({
  editing,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: FasilitasDTO | null;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<FasilitasFormValues>(() =>
    editing ? formFromRow(editing) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FasilitasFormValues>(key: K, value: FasilitasFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.judul.trim() === "") {
      setError("Judul wajib diisi.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const payload = {
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        gambar: form.gambar,
        kategori: form.kategori || null,
        unggulan: form.unggulan,
      };

      if (editing) {
        await apiRequest(`/api/fasilitas/index.php?id=${editing.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/api/fasilitas/index.php", { method: "POST", body: payload });
      }

      onSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan fasilitas.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit fasilitas" : "Tambah fasilitas"}
      description="Judul, deskripsi, dan gambar mengikuti kartu FasilitasKampus pada situs publik."
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonGhostClass} onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            type="submit"
            form="fasilitas-form"
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
      <form id="fasilitas-form" onSubmit={handleSubmit} noValidate className="space-y-space-md">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <AiWriterPanel<FasilitasDraft>
          module="fasilitas"
          label="fasilitas"
          disabled={saving}
          onUnauthorized={onUnauthorized}
          onApply={(draf) => {
            setForm((prev) => ({
              ...prev,
              judul: draf.judul || prev.judul,
              deskripsi: draf.deskripsi || prev.deskripsi,
            }));
          }}
        />

        <Field htmlFor="fasilitas-judul" label="Judul">
          <input
            id="fasilitas-judul"
            className={fieldClass}
            value={form.judul}
            onChange={(e) => update("judul", e.target.value)}
            maxLength={255}
          />
        </Field>

        <CategoryField
          module="fasilitas"
          value={form.kategori}
          onChange={(kategori) => update("kategori", kategori ?? "")}
          onUnauthorized={onUnauthorized}
        />

        <Field htmlFor="fasilitas-deskripsi" label="Deskripsi">
          <textarea
            id="fasilitas-deskripsi"
            rows={3}
            className={fieldClass}
            value={form.deskripsi}
            onChange={(e) => update("deskripsi", e.target.value)}
          />
        </Field>

        <label
          htmlFor="fasilitas-unggulan"
          className="flex min-h-11 items-center gap-space-sm rounded-lg border border-surface-container px-space-md font-body-sm text-body-sm text-on-surface"
        >
          <input
            id="fasilitas-unggulan"
            type="checkbox"
            checked={form.unggulan}
            onChange={(event) => update("unggulan", event.target.checked)}
            className="h-4 w-4 accent-secondary"
          />
          <span>Tampilkan sebagai fasilitas unggulan di halaman profil</span>
        </label>

        <ImageField
          label="Gambar fasilitas"
          value={form.gambar}
          onChange={(path) => update("gambar", path)}
        />
      </form>
    </Modal>
  );
}