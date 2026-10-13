"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { JadwalRowDTO } from "@/lib/admin/types";
import {
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";

const DAY_LABEL: Record<string, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
};

type ScheduleForm = {
  jamMulai: string;
  jamSelesai: string;
  mapel: string;
  guru: string;
};

export default function JadwalSlotDialog({
  editing,
  classId,
  className,
  day,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  editing: JadwalRowDTO | null;
  classId: number;
  className: string;
  day: string;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<ScheduleForm>(() => ({
    jamMulai: editing?.jamMulai ?? "07:00",
    jamSelesai: editing?.jamSelesai ?? "08:00",
    mapel: editing?.mapel ?? "",
    guru: editing?.guru ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ScheduleForm>(key: K, value: ScheduleForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.mapel.trim()) {
      setError("Nama mata pelajaran wajib diisi.");
      return;
    }
    if (!form.jamMulai || !form.jamSelesai || form.jamMulai >= form.jamSelesai) {
      setError("Jam selesai harus lebih akhir daripada jam mulai.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiRequest("/api/jadwal/index.php", {
        method: "POST",
        body: {
          ...(editing ? { id: editing.id } : {}),
          kelasId: classId,
          hari: day,
          jamMulai: form.jamMulai,
          jamSelesai: form.jamSelesai,
          mapel: form.mapel.trim(),
          guru: form.guru.trim() || null,
        },
      });
      onSaved();
    } catch (saveError) {
      if (isUnauthorized(saveError)) {
        onUnauthorized();
        return;
      }
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan jadwal.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit jam pelajaran" : "Tambah jam pelajaran"}
      description={`${className} · ${DAY_LABEL[day] ?? day}. Perubahan hanya memengaruhi rentang waktu ini.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonGhostClass} onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button type="submit" form="jadwal-slot-form" className={buttonPrimaryClass} disabled={saving}>
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {saving ? "Menyimpan…" : "Simpan jadwal"}
          </button>
        </>
      }
    >
      <form id="jadwal-slot-form" onSubmit={handleSubmit} noValidate className="space-y-space-md">
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        <div className="grid gap-space-md sm:grid-cols-2">
          <Field htmlFor="jadwal-jam-mulai" label="Jam mulai">
            <input
              id="jadwal-jam-mulai"
              type="time"
              className={fieldClass}
              value={form.jamMulai}
              onChange={(event) => update("jamMulai", event.target.value)}
              required
            />
          </Field>
          <Field htmlFor="jadwal-jam-selesai" label="Jam selesai">
            <input
              id="jadwal-jam-selesai"
              type="time"
              className={fieldClass}
              value={form.jamSelesai}
              onChange={(event) => update("jamSelesai", event.target.value)}
              required
            />
          </Field>
        </div>
        <Field htmlFor="jadwal-mapel" label="Mata pelajaran">
          <input
            id="jadwal-mapel"
            className={fieldClass}
            value={form.mapel}
            onChange={(event) => update("mapel", event.target.value)}
            maxLength={255}
            required
          />
        </Field>
        <Field htmlFor="jadwal-guru" label="Nama guru">
          <input
            id="jadwal-guru"
            className={fieldClass}
            value={form.guru}
            onChange={(event) => update("guru", event.target.value)}
            maxLength={150}
          />
        </Field>
      </form>
    </Modal>
  );
}
