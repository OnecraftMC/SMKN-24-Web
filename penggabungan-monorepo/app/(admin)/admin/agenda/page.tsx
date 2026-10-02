"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import { agendaTiming, formatDateRangeId } from "@/lib/admin/format";
import type { AgendaDTO } from "@/lib/admin/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import AgendaDialog from "./AgendaDialog";

type TimingFilter = "semua" | "mendatang" | "terlewat";

const TIMING_LABEL: Record<string, string> = {
  mendatang: "Mendatang",
  berlangsung: "Hari ini",
  terlewat: "Terlewat",
};

export default function AgendaPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<AgendaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaDTO | null>(null);

  const [deleting, setDeleting] = useState<AgendaDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [berandaBusyId, setBerandaBusyId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [timingFilter, setTimingFilter] = useState<TimingFilter>("semua");

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    apiRequest<AgendaDTO[]>("/api/agenda/index.php")
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat agenda.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  const visibleRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (timingFilter === "semua") return true;
        const timing = agendaTiming(row.tglMulai);
        if (timingFilter === "mendatang") {
          return timing === "mendatang" || timing === "berlangsung";
        }
        return timing === "terlewat";
      })
      .filter((row) => (keyword === "" ? true : row.judul.toLowerCase().includes(keyword)));
  }, [rows, query, timingFilter]);

  async function toggleBeranda(row: AgendaDTO) {
    setBerandaBusyId(row.id);
    setError(null);
    try {
      await apiRequest(`/api/agenda/index.php?id=${row.id}`, {
        method: "PUT",
        body: {
          judul: row.judul,
          tglMulai: row.tglMulai,
          tglSelesai: row.tglSelesai,
          waktu: row.waktu,
          lokasi: row.lokasi,
          badge: row.badge,
          deskripsi: row.deskripsi,
          gambar: row.gambar,
          tampilBeranda: !(row.tampilBeranda ?? false),
        },
      });
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal mengubah status beranda.");
    } finally {
      setBerandaBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/agenda/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus agenda.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Agenda Kegiatan
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Agenda mendukung rentang beberapa hari dan penanda tampil di beranda.
          </p>
        </div>
        <button
          type="button"
          className={buttonPrimaryClass}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus aria-hidden className="h-4 w-4" />
          Tambah agenda
        </button>
      </header>

      <div className="flex flex-wrap items-end gap-space-md">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="agenda-cari" className="sr-only">
            Cari judul agenda
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              id="agenda-cari"
              className={`${fieldClass} pl-9`}
              placeholder="Cari judul…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="agenda-timing" className="sr-only">
            Filter waktu
          </label>
          <select
            id="agenda-timing"
            className={fieldClass}
            value={timingFilter}
            onChange={(e) => setTimingFilter(e.target.value as TimingFilter)}
          >
            <option value="semua">Semua agenda</option>
            <option value="mendatang">Mendatang &amp; hari ini</option>
            <option value="terlewat">Terlewat</option>
          </select>
        </div>
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
        empty={visibleRows.length === 0}
        emptyLabel={
          rows.length === 0
            ? "Belum ada agenda. Tambahkan agenda pertama."
            : "Tidak ada agenda yang cocok dengan pencarian/filter."
        }
        onRetry={reload}
      />

      {!loading && visibleRows.length > 0 && (
        <ul className="space-y-space-sm">
          {visibleRows.map((row) => {
            const timing = agendaTiming(row.tglMulai);
            const tampil = row.tampilBeranda ?? false;

            return (
              <li
                key={row.id}
                className="flex flex-wrap items-start gap-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"
              >
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-surface">
                  <span className="tabular-nums font-headline-md text-headline-md font-extrabold leading-none text-secondary-container">
                    {String(row.day).padStart(2, "0")}
                  </span>
                  <span className="font-label-sm text-label-sm font-bold uppercase tracking-wide">
                    {row.month}
                  </span>
                </div>

                <div className="min-w-[14rem] flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.badge && (
                      <span className="rounded bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-surface">
                        {row.badge}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold ${
                        timing === "terlewat"
                          ? "bg-surface-container-high text-on-surface-variant"
                          : "bg-secondary-container text-on-secondary-container"
                      }`}
                    >
                      {TIMING_LABEL[timing]}
                    </span>
                  </div>
                  <p className="font-title-md text-title-md font-bold text-primary">{row.judul}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {formatDateRangeId(row.tglMulai, row.tglSelesai)}
                    {row.waktu ? ` • ${row.waktu}` : ""}
                    {row.lokasi ? ` • ${row.lokasi}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-space-xs">
                  <button
                    type="button"
                    onClick={() => void toggleBeranda(row)}
                    disabled={berandaBusyId === row.id}
                    aria-pressed={tampil}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-bold transition-colors ${
                      tampil
                        ? "bg-primary text-surface hover:bg-primary-container"
                        : "bg-surface-container-high text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {berandaBusyId === row.id ? (
                      <Loader2 aria-hidden className="h-3 w-3 animate-spin" />
                    ) : (
                      <CalendarDays aria-hidden className="h-3 w-3" />
                    )}
                    {tampil ? "Tampil" : "Tidak tampil"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(row);
                      setDialogOpen(true);
                    }}
                    className={buttonGhostClass}
                    aria-label={`Edit ${row.judul}`}
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
                    aria-label={`Hapus ${row.judul}`}
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialogOpen && (
        <AgendaDialog
          editing={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            setDialogOpen(false);
            reload();
          }}
          onUnauthorized={logout}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus agenda?"
          description={`Agenda "${deleting.judul}" akan dihapus permanen.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
