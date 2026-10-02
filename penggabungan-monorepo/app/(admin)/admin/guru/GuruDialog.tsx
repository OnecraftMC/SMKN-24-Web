"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { GuruDTO } from "@/lib/admin/types";
import {
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import ImageField from "@/components/admin/ui/ImageField";

export type GuruFormValues = {
  nama: string;
  jabatan: string;
  deskripsi: string;
  kategori: string;
  gambar: string | null;
  urutan: string;
};

const URUTAN_RE = /^\d+$/;
const KATEGORI_SARAN = ["Pimpinan", "Keahlian", "BK", "Pembimbing", "TU"];

function emptyForm(): GuruFormValues {
  return { nama: "", jabatan: "", deskripsi: "", kategori: "", gambar: null, urutan: "0" };
}

function formFromRow(row: GuruDTO): GuruFormValues {
  return {
    nama: row.nama,
    jabatan: row.jabatan,
    deskripsi: row.deskripsi ?? "",
    kategori: row.kategori,
    gambar: row.gambar,
    // urutan baru ikut dikirim GET sejak perbaikan B4.
    urutan: String(row.urutan ?? 0),
  };
}

export default function GuruDialog({
  editing,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: GuruDTO | null;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<GuruFormValues>(() =>
    editing ? formFromRow(editing) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof GuruFormValues>(key: K, value: GuruFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (form.nama.trim() === "") return "Nama wajib diisi.";
    if (form.jabatan.trim() === "") return "Jabatan wajib diisi.";
    if (form.kategori.trim() === "") return "Kategori wajib diisi.";
    if (!URUTAN_RE.test(form.urutan.trim())) {
      return "Urutan harus bilangan bulat 0 atau lebih.";
    }
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
        nama: form.nama.trim(),
        jabatan: form.jabatan.trim(),
        deskripsi: form.deskripsi.trim(),
        kategori: form.kategori.trim(),
        gambar: form.gambar,
        urutan: Number(form.urutan),
      };

      if (editing) {
        await apiRequest(`/api/guru/index.php?id=${editing.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/api/guru/index.php", { method: "POST", body: payload });
      }

      onSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan data guru.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit guru" : "Tambah guru"}
      description="Foto, kategori, dan urutan mengikuti kartu Direktori Guru pada situs publik."
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonGhostClass} onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            type="submit"
            form="guru-form"
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
      <form id="guru-form" onSubmit={handleSubmit} noValidate className="space-y-space-md">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <Field htmlFor="guru-nama" label="Nama">
          <input
            id="guru-nama"
            className={fieldClass}
            value={form.nama}
            onChange={(e) => update("nama", e.target.value)}
            maxLength={150}
          />
        </Field>

        <Field htmlFor="guru-jabatan" label="Jabatan">
          <input
            id="guru-jabatan"
            className={fieldClass}
            value={form.jabatan}
            onChange={(e) => update("jabatan", e.target.value)}
            placeholder="mis. Kepala Program Keahlian RPL"
            maxLength={255}
          />
        </Field>

        <div className="grid gap-space-md sm:grid-cols-2">
          <Field
            htmlFor="guru-kategori"
            label="Kategori"
            hint="Saran: Pimpinan, Keahlian, BK, Pembimbing, TU (teks bebas)."
          >
            <input
              id="guru-kategori"
              className={fieldClass}
              value={form.kategori}
              onChange={(e) => update("kategori", e.target.value)}
              list="guru-kategori-saran"
              maxLength={100}
            />
            <datalist id="guru-kategori-saran">
              {KATEGORI_SARAN.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </Field>

          <Field htmlFor="guru-urutan" label="Urutan tampil" hint="0 = paling depan.">
            <input
              id="guru-urutan"
              type="number"
              min={0}
              step={1}
              className={fieldClass}
              value={form.urutan}
              onChange={(e) => update("urutan", e.target.value)}
            />
          </Field>
        </div>

        <ImageField
          label="Foto guru"
          value={form.gambar}
          onChange={(path) => update("gambar", path)}
        />

        <Field htmlFor="guru-deskripsi" label="Deskripsi singkat">
          <textarea
            id="guru-deskripsi"
            rows={3}
            className={fieldClass}
            value={form.deskripsi}
            onChange={(e) => update("deskripsi", e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
}