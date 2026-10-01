"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, isUnauthorized } from "@/lib/api";
import type { JadwalRowDTO, JurusanKey, SesiKey } from "@/lib/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
} from "@/components/ui/FormBits";
import JadwalSlotDialog from "./JadwalSlotDialog";

const JURUSAN_LABEL: Record<JurusanKey, string> = {
  perhotelan: "Perhotelan",
  boga: "Kuliner (Tata Boga)",
  busana: "Tata Busana",
  pplg: "Rekayasa Perangkat Lunak",
  pariwisata: "Usaha Layanan Pariwisata",
};

const JURUSAN_KEYS = Object.keys(JURUSAN_LABEL) as JurusanKey[];
const SLOT_NUMBERS = [0, 1, 2, 3, 4];

export default function JadwalPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<JadwalRowDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [jurusan, setJurusan] = useState<JurusanKey>("perhotelan");
  const [sesi, setSesi] = useState<SesiKey>("pagi");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<JadwalRowDTO | null>(null);
  const [defaultUrutan, setDefaultUrutan] = useState(0);

  const [deleting, setDeleting] = useState<JadwalRowDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiRequest<JadwalRowDTO[]>("/api/jadwal/index.php?admin=1");
        if (cancelled) return;
        setRows(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat jadwal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  const slots = useMemo(
    () =>
      rows
        .filter((row) => row.jurusan === jurusan && row.sesi === sesi)
        .sort((a, b) => a.urutan - b.urutan),
    [rows, jurusan, sesi],
  );

  const freeUrutans = useMemo(() => {
    const occupied = new Set(slots.map((row) => row.urutan));
    return SLOT_NUMBERS.filter((n) => !occupied.has(n));
  }, [slots]);

  const takenForDialog = useMemo(() => {
    const list = rows.filter(
      (row) =>
        row.jurusan === jurusan &&
        row.sesi === sesi &&
        (!editingSlot || row.id !== editingSlot.id),
    );
    return list.map((row) => row.urutan);
  }, [rows, jurusan, sesi, editingSlot]);

  /** Baris matriks pratinjau per nomor urutan (0–4) untuk jurusan aktif. */
  const matrix = useMemo(() => {
    const pagi = rows.filter((r) => r.jurusan === jurusan && r.sesi === "pagi");
    const siang = rows.filter((r) => r.jurusan === jurusan && r.sesi === "siang");
    const pick = (list: JadwalRowDTO[], n: number) => list.find((r) => r.urutan === n);
    return SLOT_NUMBERS.map((n) => ({
      n,
      header: pick(pagi, n)?.jam ?? pick(siang, n)?.jam ?? null,
      pagi: pick(pagi, n) ?? null,
      siang: pick(siang, n) ?? null,
    }));
  }, [rows, jurusan]);

  function openAdd() {
    setEditingSlot(null);
    setDefaultUrutan(freeUrutans[0] ?? 0);
    setDialogOpen(true);
  }

  function openEdit(row: JadwalRowDTO) {
    setEditingSlot(row);
    setDefaultUrutan(row.urutan);
    setDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/jadwal/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus slot jadwal.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Jadwal Pembelajaran
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Slot unik: jurusan + sesi + urutan (0–4). Simpan memakai upsert backend per slot.
          </p>
        </div>
        <button
          type="button"
          className={buttonPrimaryClass}
          onClick={openAdd}
          disabled={loading || freeUrutans.length === 0}
        >
          <Plus aria-hidden className="h-4 w-4" />
          Tambah slot
        </button>
      </header>

      <div role="tablist" aria-label="Program keahlian" className="flex flex-wrap gap-space-xs">
        {JURUSAN_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={jurusan === key}
            onClick={() => setJurusan(key)}
            className={`rounded-lg px-space-md py-2 font-label-md text-label-md font-bold transition-colors ${
              jurusan === key
                ? "bg-primary text-surface"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {JURUSAN_LABEL[key]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-space-md">
        <span className="font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
          Sesi:
        </span>
        {(["pagi", "siang"] as SesiKey[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={sesi === value}
            onClick={() => setSesi(value)}
            className={`rounded-lg px-space-md py-2 font-label-md text-label-md font-bold transition-colors ${
              sesi === value
                ? "bg-primary text-surface"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {value === "pagi" ? "Pagi" : "Siang"}
          </button>
        ))}
        {!loading && freeUrutans.length === 0 && (
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            Semua slot 0–4 terisi — hapus dulu salah satu untuk menambah.
          </span>
        )}
      </div>

      {error && rows.length > 0 && (
        <p
          role="alert"
          className="rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
        >
          {error}
        </p>
      )}

      <ListState
        loading={loading}
        error={rows.length === 0 ? error : null}
        empty={rows.length === 0}
        emptyLabel="Belum ada data jadwal. Tambahkan slot pertama."
        onRetry={reload}
      />

      {!loading && rows.length > 0 && (
        <section className="space-y-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
          <h2 className="font-title-md text-title-md font-bold text-primary">
            Slot sesi {sesi === "pagi" ? "Pagi" : "Siang"} — {JURUSAN_LABEL[jurusan]}
          </h2>

          {slots.length === 0 ? (
            <p className="rounded-lg border border-dashed border-outline-variant p-space-md text-center font-body-sm text-body-sm text-on-surface-variant">
              Belum ada slot untuk jurusan + sesi ini. Klik &quot;Tambah slot&quot;.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-primary text-surface">
                  <tr>
                    <th className="px-space-md py-space-sm font-label-sm font-bold">Urutan</th>
                    <th className="px-space-md py-space-sm font-label-sm font-bold">Jam</th>
                    <th className="px-space-md py-space-sm font-label-sm font-bold">
                      Mata Pelajaran
                    </th>
                    <th className="px-space-md py-space-sm font-label-sm font-bold">Waktu</th>
                    <th className="px-space-md py-space-sm font-label-sm font-bold">Guru</th>
                    <th className="px-space-md py-space-sm">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((row) => (
                    <tr key={row.id} className="border-t border-surface-container">
                      <td className="px-space-md py-space-sm">
                        <span className="tabular-nums font-bold text-primary">{row.urutan}</span>
                      </td>
                      <td className="px-space-md py-space-sm text-on-surface-variant">
                        {row.jam ?? "—"}
                      </td>
                      <td className="px-space-md py-space-sm font-bold text-primary">
                        {row.mapel}
                      </td>
                      <td className="px-space-md py-space-sm text-on-surface-variant">
                        {row.waktu ?? "—"}
                      </td>
                      <td className="px-space-md py-space-sm text-on-surface-variant">
                        {row.guru ?? "—"}
                      </td>
                      <td className="px-space-md py-space-sm">
                        <div className="flex justify-end gap-space-xs">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className={buttonGhostClass}
                            aria-label={`Edit slot ${row.mapel}`}
                          >
                            <Pencil aria-hidden className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(row);
                            }}
                            className={buttonGhostClass}
                            aria-label={`Hapus slot ${row.mapel}`}
                          >
                            <Trash2 aria-hidden className="h-4 w-4" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!loading && rows.length > 0 && (
        <section
          aria-label="Pratinjau matriks jadwal"
          className="space-y-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"
        >
          <div>
            <p className="font-label-sm text-label-sm font-bold uppercase tracking-wide text-secondary">
              Pratinjau matriks (JadwalMatriks)
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Header kolom memakai jam dari database — bukan teks hardcoded seperti komponen
              publik saat ini.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-surface-container shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary text-surface">
                <tr>
                  <th className="px-4 py-3 font-label-sm font-bold">Sesi</th>
                  {matrix.map((col) => (
                    <th key={col.n} className="px-4 py-3 font-label-sm font-bold">
                      {col.header ? `Pukul ${col.header}` : `Slot ${col.n + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-surface-container">
                  <td className="bg-surface-container-low px-4 py-3 font-bold">Pagi</td>
                  {matrix.map((col) => (
                    <td key={col.n} className="px-4 py-3">
                      {col.pagi ? (
                        <span className="font-bold text-primary">{col.pagi.mapel}</span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="bg-surface-container-low px-4 py-3 font-bold">Siang</td>
                  {matrix.map((col) => (
                    <td key={col.n} className="px-4 py-3">
                      {col.siang ? (
                        <span className="font-bold text-primary">{col.siang.mapel}</span>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {dialogOpen && (
        <JadwalSlotDialog
          editing={editingSlot}
          jurusan={jurusan}
          sesi={sesi}
          taken={takenForDialog}
          defaultUrutan={defaultUrutan}
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            reload();
          }}
          onRefresh={reload}
          onUnauthorized={logout}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus slot jadwal?"
          description={`Slot urutan ${deleting.urutan} (${deleting.mapel}) akan dihapus permanen.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}