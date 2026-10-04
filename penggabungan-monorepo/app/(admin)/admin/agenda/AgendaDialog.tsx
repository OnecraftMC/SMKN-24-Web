"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { AgendaDTO } from "@/lib/admin/types";
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

export type AgendaFormValues = {
  judul: string;
  tglMulai: string;
  tglSelesai: string;
  waktu: string;
  lokasi: string;
  badge: string;
  kategori: string;
  deskripsi: string;
  gambar: string | null;
  tampilBeranda: boolean;
};

export function newAgendaForm(): AgendaFormValues {
  return {
    judul: "",
    tglMulai: todayIso(),
    tglSelesai: "",
    waktu: "",
    lokasi: "",
    badge: "",
    kategori: "",
    deskripsi: "",
    gambar: null,
    tampilBeranda: true,
  };
}

function formFromRow(row: AgendaDTO): AgendaFormValues {
  return {
    judul: row.judul,
    tglMulai: row.tglMulai.slice(0, 10),
    tglSelesai: (row.tglSelesai ?? "").slice(0, 10),
    waktu: row.waktu ?? "",
    lokasi: row.lokasi ?? "",
    badge: row.badge ?? "",
    kategori: row.kategori ?? "",
    deskripsi: row.deskripsi ?? "",
    gambar: row.gambar,
    tampilBeranda: row.tampilBeranda ?? false,
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default function AgendaDialog({
  editing,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: AgendaDTO | null;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<AgendaFormValues>(() =>
    editing ? formFromRow(editing) : newAgendaForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof AgendaFormValues>(key: K, value: AgendaFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (form.judul.trim() === "") return "Judul wajib diisi.";
    if (!ISO_DATE.test(form.tglMulai)) return "Tanggal mulai wajib diisi.";
    if (form.tglSelesai !== "" && !ISO_DATE.test(form.tglSelesai)) {
      return "Tanggal selesai tidak valid.";
    }
    // Cermin validasi backend (B5) supaya admin dapat pesan cepat.
    if (form.tglSelesai !== "" && form.tglSelesai < form.tglMulai) {
      return "Tanggal selesai tidak boleh mendahului tanggal mulai.";
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
        judul: form.judul.trim(),
        tglMulai: form.tglMulai,
        tglSelesai: form.tglSelesai === "" ? null : form.tglSelesai,
        waktu: form.waktu.trim() || null,
        lokasi: form.lokasi.trim() || null,
        badge: form.badge.trim() || null,
        kategori: form.kategori || null,
        deskripsi: form.deskripsi,
        gambar: form.gambar,
        tampilBeranda: form.tampilBeranda,
      };

      if (editing) {
        await apiRequest(`/api/agenda/index.php?id=${editing.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/api/agenda/index.php", { method: "POST", body: payload });
      }

      onSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan agenda.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit Agenda" : "Tambah Agenda"}
      description="Rentang tanggal mendukung kegiatan beberapa hari. Tanggal selesai boleh dikosongkan."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonGhostClass} disabled={saving}>
            Batal
          </button>
          <button type="submit" form="agenda-form" className={buttonPrimaryClass} disabled={saving}>
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
      <form id="agenda-form" onSubmit={handleSubmit} noValidate className="space-y-space-md">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <Field htmlFor="agenda-judul" label="Judul kegiatan">
          <input
            id="agenda-judul"
            className={fieldClass}
            value={form.judul}
            onChange={(e) => update("judul", e.target.value)}
            maxLength={255}
          />
        </Field>

        <div className="grid gap-space-md sm:grid-cols-2">
          <Field htmlFor="agenda-mulai" label="Tanggal mulai">
            <input
              id="agenda-mulai"
              type="date"
              className={fieldClass}
              value={form.tglMulai}
              onChange={(e) => update("tglMulai", e.target.value)}
            />
          </Field>
          <Field htmlFor="agenda-selesai" label="Tanggal selesai (opsional)">
            <input
              id="agenda-selesai"
              type="date"
              className={fieldClass}
              value={form.tglSelesai}
              min={form.tglMulai}
              onChange={(e) => update("tglSelesai", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-space-md sm:grid-cols-2">
          <Field htmlFor="agenda-waktu" label="Waktu" hint='Contoh: "08.00 - 15.00 WIB"'>
            <input
              id="agenda-waktu"
              className={fieldClass}
              value={form.waktu}
              onChange={(e) => update("waktu", e.target.value)}
              maxLength={100}
            />
          </Field>
          <Field htmlFor="agenda-lokasi" label="Lokasi">
            <input
              id="agenda-lokasi"
              className={fieldClass}
              value={form.lokasi}
              onChange={(e) => update("lokasi", e.target.value)}
              maxLength={255}
            />
          </Field>
        </div>

        <Field htmlFor="agenda-badge" label="Badge" hint='Contoh: "Aktivitas Siswa"'>
          <input
            id="agenda-badge"
            className={fieldClass}
            value={form.badge}
            onChange={(e) => update("badge", e.target.value)}
            maxLength={100}
          />
        </Field>

        <CategoryField
          module="agenda"
          value={form.kategori}
          onChange={(kategori) => update("kategori", kategori ?? "")}
          onUnauthorized={onUnauthorized}
        />

        <Field htmlFor="agenda-deskripsi" label="Deskripsi">
          <textarea
            id="agenda-deskripsi"
            rows={4}
            className={fieldClass}
            value={form.deskripsi}
            onChange={(e) => update("deskripsi", e.target.value)}
          />
        </Field>

        <ImageField
          value={form.gambar}
          onChange={(path) => update("gambar", path)}
          label="Gambar (opsional)"
        />

        <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface">
          <input
            type="checkbox"
            checked={form.tampilBeranda}
            onChange={(e) => update("tampilBeranda", e.target.checked)}
          />
          Tampilkan di agenda beranda
        </label>
      </form>
    </Modal>
  );
}
