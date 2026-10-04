"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Search, ShieldAlert, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import {
  BOBOT_KESULITAN,
  type PesanBKDTO,
  type StatusPesanBK,
  type TingkatKesulitanBK,
} from "@/lib/admin/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";

const STATUS_LIST: StatusPesanBK[] = ["Baru", "Diproses", "Selesai"];

/**
 * Samarkan nomor HP siswa: tampilkan 4 digit terakhir saja.
 *
 * Data inklusif; nomor siswa tidak perlu dibaca utuh oleh guru BK untuk
 * menangani keluhan.
 */
function maskPhone(phone: string | null): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 6) return "******";
  return `****${digits.slice(-4)}`;
}

/** Warna badge per tingkat kesulitan â€” makin berat makin menonjol. */
const GAYA_KESULITAN: Record<TingkatKesulitanBK, string> = {
  Ringan: "bg-surface-container-highest text-on-surface-variant",
  Sedang: "bg-tertiary-container text-on-tertiary-container",
  Berat: "bg-error-container text-on-error-container",
};

const FILTER_KESULITAN: (TingkatKesulitanBK | "semua")[] = [
  "semua",
  "Berat",
  "Sedang",
  "Ringan",
];

export default function BKPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<PesanBKDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [filterKesulitan, setFilterKesulitan] = useState<TingkatKesulitanBK | "semua">("semua");
  const [filterStatus, setFilterStatus] = useState<StatusPesanBK | "semua">("semua");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<PesanBKDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    apiRequest<PesanBKDTO[]>("/api/bk/index.php")
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat pesan BK.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  /** Ubah status penanganan (Baru -> Diproses -> Selesai). */
  const changeStatus = async (row: PesanBKDTO, status: StatusPesanBK) => {
    setBusyId(row.id);
    try {
      await apiRequest(`/api/bk/index.php?id=${row.id}`, {
        method: "PUT",
        body: { status },
      });
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setBusyId(null);
    }
  };

  const removeRow = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/bk/index.php?id=${deleting.id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus pesan.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filterKesulitan !== "semua" && r.tingkatKesulitan !== filterKesulitan) return false;
        if (filterStatus !== "semua" && r.status !== filterStatus) return false;
        if (!q) return true;
        return (
          r.nama.toLowerCase().includes(q) ||
          r.kelas.toLowerCase().includes(q) ||
          (r.ringkasan ?? "").toLowerCase().includes(q) ||
          (r.kategori ?? "").toLowerCase().includes(q) ||
          r.pesan.toLowerCase().includes(q)
        );
      })
      // Backend sudah mengurutkan, tapi diulang di sisi klien agar tampilan
      // tetap konsisten walau respons datang dari cache versi lama.
      .slice()
      .sort((a, b) => {
        if (a.butuhPerhatian !== b.butuhPerhatian) return a.butuhPerhatian ? -1 : 1;
        const bobotA = a.tingkatKesulitan ? BOBOT_KESULITAN[a.tingkatKesulitan] : 0;
        const bobotB = b.tingkatKesulitan ? BOBOT_KESULITAN[b.tingkatKesulitan] : 0;
        if (bobotA !== bobotB) return bobotB - bobotA;
        return b.tanggal.localeCompare(a.tanggal);
      });
  }, [rows, query, filterKesulitan, filterStatus]);

  const jumlahButuhPerhatian = rows.filter((r) => r.butuhPerhatian).length;

  return (
    <div className="space-y-space-lg">
      <header className="space-y-space-xs">
        <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Pesan BK</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Cerita siswa yang dirangkum Counsellor AI. Urutan paling atas = paling mendesak untuk
          ditangani.
        </p>
      </header>

      {jumlahButuhPerhatian > 0 && (
        <p className="flex items-start gap-2 rounded-2xl border border-error-container bg-error-container/40 p-space-md font-body-sm text-body-sm text-on-error-container">
          <ShieldAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            Ada <strong>{jumlahButuhPerhatian}</strong> laporan dengan indikasi risiko
            keselamatan. Tangani lebih dahulu.
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-space-sm">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, kelas, ringkasanâ€¦"
            aria-label="Cari pesan BK"
            className={`${fieldClass} pl-9`}
          />
        </div>
        <select
          value={filterKesulitan}
          onChange={(e) => setFilterKesulitan(e.target.value as TingkatKesulitanBK | "semua")}
          aria-label="Filter tingkat kesulitan"
          className={fieldClass}
        >
          {FILTER_KESULITAN.map((v) => (
            <option key={v} value={v}>
              {v === "semua" ? "Semua tingkat" : `Tingkat ${v}`}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StatusPesanBK | "semua")}
          aria-label="Filter status"
          className={fieldClass}
        >
          <option value="semua">Semua status</option>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <ListState
        loading={loading}
        error={error}
        empty={visible.length === 0}
        emptyLabel="Belum ada pesan BK yang cocok dengan filter."
        onRetry={reload}
      />

      <ul className="space-y-space-sm">
        {visible.map((row) => (
          <li
            key={row.id}
            className={`rounded-2xl border bg-surface-container-lowest p-space-md ${
              row.butuhPerhatian ? "border-error" : "border-surface-container"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-space-sm">
              <div className="min-w-0 space-y-1">
                <p className="font-label-md text-label-md font-bold text-on-surface">
                  {row.nama}{" "}
                  <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">
                    Â· {row.kelas}
                  </span>
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{row.tanggal}</p>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {row.butuhPerhatian && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-error px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-error">
                    <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
                    Perlu perhatian
                  </span>
                )}
                {row.tingkatKesulitan && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold ${GAYA_KESULITAN[row.tingkatKesulitan]}`}
                  >
                    {row.tingkatKesulitan}
                  </span>
                )}
                {row.kategori && (
                  <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-surface-variant">
                    {row.kategori}
                  </span>
                )}
              </div>
            </div>

            {row.ringkasan ? (
              <p className="mt-space-sm rounded-xl bg-surface-container px-3 py-2 font-body-sm text-body-sm text-on-surface">
                <span className="font-bold">Ringkasan AI: </span>
                {row.ringkasan}
              </p>
            ) : (
              <p className="mt-space-sm font-body-sm text-body-sm italic text-on-surface-variant">
                Belum ada ringkasan AI untuk pesan ini.
              </p>
            )}

            <div className="mt-space-sm flex flex-wrap items-center gap-space-sm">
              <select
                value={row.status}
                disabled={busyId === row.id}
                onChange={(e) => changeStatus(row, e.target.value as StatusPesanBK)}
                aria-label={`Status untuk ${row.nama}`}
                className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-sm text-body-sm"
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {busyId === row.id && (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin text-on-surface-variant" />
              )}

              <button
                type="button"
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                className={buttonGhostClass}
              >
                {expanded === row.id ? "Sembunyikan cerita" : "Lihat cerita siswa"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleting(row);
                  setDeleteError(null);
                }}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 font-label-sm text-label-sm font-bold text-error"
              >
                <Trash2 aria-hidden className="h-4 w-4" />
                Hapus
              </button>
            </div>

            {expanded === row.id && (
              <div className="mt-space-sm space-y-2 rounded-xl border border-surface-container p-3">
                <p className="font-body-sm text-body-sm text-on-surface">{row.pesan}</p>
                {row.keperluan && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Keperluan: {row.keperluan}
                    {row.noHp ? ` · ${maskPhone(row.noHp)}` : ""}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        title="Hapus pesan BK?"
        description="Pesan yang dihapus tidak dapat dikembalikan."
        busy={deleteBusy}
        error={deleteError}
        onConfirm={removeRow}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
