"use client";

import { useState } from "react";
import { Loader2, Save, TriangleAlert } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { JadwalRowDTO, JurusanKey, SesiKey } from "@/lib/admin/types";
import {
  Field,
  Modal,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";

const SLOT_URUTAN = [0, 1, 2, 3, 4] as const;

/** Duplikat ringan dari page — menghindari impor melingkar page ↔ dialog. */
const JURUSAN_LABEL: Record<JurusanKey, string> = {
  perhotelan: "Perhotelan",
  boga: "Kuliner (Tata Boga)",
  busana: "Tata Busana",
  pplg: "Rekayasa Perangkat Lunak",
  pariwisata: "Usaha Layanan Pariwisata",
};

type SlotFormValues = {
  urutan: string;
  mapel: string;
  jam: string;
  waktu: string;
  guru: string;
};

function emptyForm(defaultUrutan: number): SlotFormValues {
  return { urutan: String(defaultUrutan), mapel: "", jam: "", waktu: "", guru: "" };
}

function formFromRow(row: JadwalRowDTO): SlotFormValues {
  return {
    urutan: String(row.urutan),
    mapel: row.mapel,
    jam: row.jam ?? "",
    waktu: row.waktu ?? "",
    guru: row.guru ?? "",
  };
}

/**
 * Dialog edit/tambah satu slot jadwal.
 *
 * Simpan selalu lewat POST (upsert `ON DUPLICATE KEY UPDATE`). Saat urutan diubah
 * pada slot lama, POST membuat slot baru lalu slot lama dihapus — bila penghapusan
 * gagal, dialog tetap terbuka dengan pesan dan daftar di-refresh (onRefresh)
 * supaya slot lama terlihat dan bisa dihapus manual. Ini konsekuensi B11 yang
 * masih ditunda (belum ada endpoint bulk transaksional).
 */
export default function JadwalSlotDialog({
  editing,
  jurusan,
  sesi,
  taken,
  defaultUrutan,
  onClose,
  onSaved,
  onRefresh,
  onUnauthorized,
}: {
  editing: JadwalRowDTO | null;
  jurusan: JurusanKey;
  sesi: SesiKey;
  /** urutan yang sudah terisi pada jurusan+sesi ini (di luar id `editing`). */
  taken: number[];
  defaultUrutan: number;
  onClose: () => void;
  onSaved: () => void;
  onRefresh: () => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<SlotFormValues>(() =>
    editing ? formFromRow(editing) : emptyForm(defaultUrutan),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof SlotFormValues>(key: K, value: SlotFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const urutan = Number(form.urutan);
    if (form.mapel.trim() === "") {
      setError("Mata pelajaran wajib diisi.");
      return;
    }
    if (!Number.isInteger(urutan) || urutan < 0 || urutan > 4) {
      setError("Urutan slot harus antara 0 dan 4.");
      return;
    }
    if (taken.includes(urutan)) {
      setError(`Slot urutan ${urutan} sudah terisi. Ubah atau hapus slot tersebut dulu.`);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await apiRequest("/api/jadwal/index.php", {
        method: "POST",
        body: {
          jurusan,
          sesi,
          urutan,
          mapel: form.mapel.trim(),
          jam: form.jam.trim() || null,
          waktu: form.waktu.trim() || null,
          guru: form.guru.trim() || null,
        },
      });

      if (editing && urutan !== editing.urutan) {
        // Pindah slot: baris baru sudah dibuat, baris lama harus dihapus.
        try {
          await apiRequest(`/api/jadwal/index.php?id=${editing.id}`, { method: "DELETE" });
        } catch (deleteErr) {
          if (isUnauthorized(deleteErr)) {
            onUnauthorized();
            return;
          }
          onRefresh();
          setError(
            `Slot urutan ${urutan} baru tersimpan, tetapi slot lama (urutan ${editing.urutan}) ` +
              `gagal dihapus: ${deleteErr instanceof Error ? deleteErr.message : "galat tidak dikenal"}. ` +
              "Tutup dialog lalu hapus slot lama lewat tabel.",
          );
          setSaving(false);
          return;
        }
      }

      onSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan slot jadwal.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit slot jadwal" : "Tambah slot jadwal"}
      description={`${JURUSAN_LABEL[jurusan]} · sesi ${sesi}. Slot unik: jurusan + sesi + urutan.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonGhostClass} onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            type="submit"
            form="jadwal-slot-form"
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
        id="jadwal-slot-form"
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

        <div className="grid gap-space-md sm:grid-cols-2">
          <Field
            htmlFor="jadwal-urutan"
            label="Urutan slot (0–4)"
            hint="Nomor terisi oleh slot lain tidak bisa dipilih."
          >
            <select
              id="jadwal-urutan"
              className={fieldClass}
              value={form.urutan}
              onChange={(e) => update("urutan", e.target.value)}
            >
              {SLOT_URUTAN.map((n) => (
                <option key={n} value={n} disabled={taken.includes(n)}>
                  {n}
                  {taken.includes(n) ? " (terisi)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field htmlFor="jadwal-mapel" label="Mata pelajaran">
            <input
              id="jadwal-mapel"
              className={fieldClass}
              value={form.mapel}
              onChange={(e) => update("mapel", e.target.value)}
              maxLength={255}
            />
          </Field>
        </div>

        <div className="grid gap-space-md sm:grid-cols-2">
          <Field
            htmlFor="jadwal-jam"
            label="Jam"
            hint="mis. 07.30 - 08.30 — tampil sebagai header kolom matriks."
          >
            <input
              id="jadwal-jam"
              className={fieldClass}
              value={form.jam}
              onChange={(e) => update("jam", e.target.value)}
              maxLength={100}
            />
          </Field>

          <Field htmlFor="jadwal-waktu" label="Waktu/keterangan">
            <input
              id="jadwal-waktu"
              className={fieldClass}
              value={form.waktu}
              onChange={(e) => update("waktu", e.target.value)}
              maxLength={255}
            />
          </Field>
        </div>

        <Field htmlFor="jadwal-guru" label="Guru pengampun">
          <input
            id="jadwal-guru"
            className={fieldClass}
            value={form.guru}
            onChange={(e) => update("guru", e.target.value)}
            maxLength={150}
          />
        </Field>
      </form>
    </Modal>
  );
}