"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { EkstrakurikulerDTO } from "@/lib/admin/types";
import {
  CheckField,
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import ImageField from "@/components/admin/ui/ImageField";

export type EkstrakurikulerFormValues = {
  nama: string;
  deskripsi: string;
  logo: string | null;
  kategori: string;
  pembina: string;
  jadwal: string;
  lokasi: string;
  unggulan: boolean;
};

function emptyForm(): EkstrakurikulerFormValues {
  return {
    nama: "",
    deskripsi: "",
    logo: null,
    kategori: "",
    pembina: "",
    jadwal: "",
    lokasi: "",
    unggulan: false,
  };
}

function formFromRow(row: EkstrakurikulerDTO): EkstrakurikulerFormValues {
  return {
    nama: row.nama,
    deskripsi: row.deskripsi ?? "",
    logo: row.logo,
    kategori: row.kategori ?? "",
    pembina: row.pembina ?? "",
    jadwal: row.jadwal ?? "",
    lokasi: row.lokasi ?? "",
    unggulan: row.unggulan,
  };
}

export default function EkstrakurikulerDialog({
  editing,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: EkstrakurikulerDTO | null;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<EkstrakurikulerFormValues>(() =>
    editing ? formFromRow(editing) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof EkstrakurikulerFormValues>(
    key: K,
    value: EkstrakurikulerFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.nama.trim() === "") {
      setError("Nama ekstrakurikuler wajib diisi.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const payload = {
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim(),
        logo: form.logo,
        kategori: form.kategori.trim() || null,
        pembina: form.pembina.trim() || null,
        jadwal: form.jadwal.trim() || null,
        lokasi: form.lokasi.trim() || null,
        unggulan: form.unggulan,
      };

      if (editing) {
        await apiRequest(`/api/ekstrakurikuler/index.php?id=${editing.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/api/ekstrakurikuler/index.php", { method: "POST", body: payload });
      }

      onSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan ekstrakurikuler.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit ekstrakurikuler" : "Tambah ekstrakurikuler"}
      description="Nama, logo, dan info tampil sebagai kartu di halaman /ekstrakurikuler. Isi info sedetail mungkin agar siswa tahu jadwal dan pembina."
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonGhostClass} onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            type="submit"
            form="ekstrakurikuler-form"
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
      <form
        id="ekstrakurikuler-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-space-md"
      >
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <Field htmlFor="ekstrakurikuler-nama" label="Nama ekstrakurikuler" required>
          <input
            id="ekstrakurikuler-nama"
            className={fieldClass}
            value={form.nama}
            onChange={(e) => update("nama", e.target.value)}
            maxLength={150}
            placeholder="Contoh: Paskibra"
          />
        </Field>

        <div className="grid gap-space-md sm:grid-cols-2">
          <Field htmlFor="ekstrakurikuler-kategori" label="Kategori">
            <input
              id="ekstrakurikuler-kategori"
              className={fieldClass}
              value={form.kategori}
              onChange={(e) => update("kategori", e.target.value)}
              maxLength={100}
              placeholder="Olahraga / Seni / Sosial"
            />
          </Field>
          <Field htmlFor="ekstrakurikuler-pembina" label="Pembina">
            <input
              id="ekstrakurikuler-pembina"
              className={fieldClass}
              value={form.pembina}
              onChange={(e) => update("pembina", e.target.value)}
              maxLength={150}
              placeholder="Nama guru pembina"
            />
          </Field>
          <Field htmlFor="ekstrakurikuler-jadwal" label="Jadwal latihan">
            <input
              id="ekstrakurikuler-jadwal"
              className={fieldClass}
              value={form.jadwal}
              onChange={(e) => update("jadwal", e.target.value)}
              maxLength={150}
              placeholder="Sabtu, 08.00 - 10.00 WIB"
            />
          </Field>
          <Field htmlFor="ekstrakurikuler-lokasi" label="Lokasi">
            <input
              id="ekstrakurikuler-lokasi"
              className={fieldClass}
              value={form.lokasi}
              onChange={(e) => update("lokasi", e.target.value)}
              maxLength={150}
              placeholder="Lapangan / ruang latihan"
            />
          </Field>
        </div>

        <Field htmlFor="ekstrakurikuler-deskripsi" label="Info ekstrakurikuler">
          <textarea
            id="ekstrakurikuler-deskripsi"
            rows={5}
            className={fieldClass}
            value={form.deskripsi}
            onChange={(e) => update("deskripsi", e.target.value)}
            maxLength={5000}
            placeholder="Ceritakan kegiatan, manfaat, dan hal yang dipelajari siswa."
          />
        </Field>

        <CheckField
          id="ekstrakurikuler-unggulan"
          checked={form.unggulan}
          onChange={(checked) => update("unggulan", checked)}
        >
          <span>Tampilkan sebagai ekstrakurikuler unggulan di halaman profil</span>
        </CheckField>

        <ImageField
          label="Logo ekstrakurikuler"
          value={form.logo}
          onChange={(path) => update("logo", path)}
          fit="contain"
        />
      </form>
    </Modal>
  );
}
