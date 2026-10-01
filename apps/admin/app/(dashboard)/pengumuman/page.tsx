"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Home, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, isUnauthorized } from "@/lib/api";
import { formatDateId } from "@/lib/format";
import type { PengumumanDTO } from "@/lib/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/ui/FormBits";
import PengumumanDialog from "./PengumumanDialog";

type BerandaFilter = "semua" | "beranda" | "lain";

export default function PengumumanPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<PengumumanDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PengumumanDTO | null>(null);

  const [deleting, setDeleting] = useState<PengumumanDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [berandaBusyId, setBerandaBusyId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [berandaFilter, setBerandaFilter] = useState<BerandaFilter>("semua");

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    apiRequest<PengumumanDTO[]>("/api/pengumuman/index.php")
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
        setError(err instanceof Error ? err.message : "Gagal memuat pengumuman.");
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
        if (berandaFilter === "semua") return true;
        const tampil = row.tampilBeranda ?? false;
        return berandaFilter === "beranda" ? tampil : !tampil;
      })
      .filter((row) => (keyword === "" ? true : row.judul.toLowerCase().includes(keyword)));
  }, [rows, query, berandaFilter]);

  const preview = useMemo(
    () => rows.find((row) => row.tampilBeranda) ?? null,
    [rows],
  );

  async function toggleBeranda(row: PengumumanDTO) {
    setBerandaBusyId(row.id);
    setError(null);
    try {
      await apiRequest(`/api/pengumuman/index.php?id=${row.id}`, {
        method: "PUT",
        body: {
          judul: row.judul,
          tanggal: row.tanggalIso ?? row.tanggal,
          kategori: row.kategori,
          isi: row.isi ?? "",
          penting: row.penting,
          tampilBeranda: !(row.tampilBeranda ?? false),
          gambar: row.gambar,
          badge: row.badge,
          status: row.status,
          linkLabel: row.linkLabel,
          linkHref: row.linkHref,
          icon: row.icon,
          actionIcon: row.actionIcon,
          variant: row.variant,
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
      await apiRequest(`/api/pengumuman/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus pengumuman.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Pengumuman &amp; Papan Informasi
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Satu modul untuk seluruh pengumuman, termasuk yang tampil di papan
            informasi beranda.
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
          Tambah pengumuman
        </button>
      </header>

      {preview && (
        <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
          <h2 className="mb-space-sm font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
            Pratinjau kartu beranda
          </h2>
          <div
            className={`max-w-xl rounded-2xl border p-space-md ${
              preview.variant === "secondary"
                ? "border-secondary-container/20 bg-secondary-container/15"
                : "border-surface-container bg-surface-container-low"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wide text-surface ${
                  preview.variant === "secondary" ? "bg-secondary" : "bg-primary"
                }`}
              >
                {preview.badge ?? preview.kategori}
              </span>
              {preview.status && (
                <span className="font-label-sm text-label-sm font-bold text-secondary">
                  {preview.status}
                </span>
              )}
            </div>
            <p className="font-title-md text-title-md font-bold text-primary">{preview.judul}</p>
            {preview.isi && (
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                {preview.isi}
              </p>
            )}
            {preview.linkLabel && (
              <p className="mt-space-sm flex items-center gap-1 font-label-sm text-label-sm font-bold text-secondary">
                {preview.linkLabel}
                {preview.icon && <span className="text-on-surface-variant">({preview.icon})</span>}
              </p>
            )}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-end gap-space-md">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="peng-cari" className="sr-only">
            Cari judul pengumuman
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              id="peng-cari"
              className={`${fieldClass} pl-9`}
              placeholder="Cari judul…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="peng-beranda-filter" className="sr-only">
            Filter tampil beranda
          </label>
          <select
            id="peng-beranda-filter"
            className={fieldClass}
            value={berandaFilter}
            onChange={(e) => setBerandaFilter(e.target.value as BerandaFilter)}
          >
            <option value="semua">Semua</option>
            <option value="beranda">Tampil di beranda</option>
            <option value="lain">Tidak tampil di beranda</option>
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
            ? "Belum ada pengumuman. Tambahkan pengumuman pertama."
            : "Tidak ada pengumuman yang cocok dengan pencarian/filter."
        }
        onRetry={reload}
      />

      {!loading && visibleRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
          <table className="w-full min-w-[48rem] text-left font-body-sm text-body-sm">
            <caption className="sr-only">Daftar pengumuman</caption>
            <thead className="bg-surface-container-low">
              <tr>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Pengumuman
                </th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Kategori
                </th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Tanggal
                </th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Papan beranda
                </th>
                <th scope="col" className="px-space-md py-space-sm text-right font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const tampil = row.tampilBeranda ?? false;
                return (
                  <tr key={row.id} className="border-t border-surface-container">
                    <td className="px-space-md py-space-sm">
                      <p className="font-bold text-primary">{row.judul}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {row.badge && (
                          <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-surface">
                            {row.badge}
                          </span>
                        )}
                        {row.status && (
                          <span className="font-label-sm text-label-sm font-bold text-secondary">
                            {row.status}
                          </span>
                        )}
                        {row.penting && (
                          <span className="font-label-sm text-label-sm font-bold text-error">
                            Penting
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-space-md py-space-sm text-on-surface-variant">{row.kategori}</td>
                    <td className="px-space-md py-space-sm text-on-surface-variant">
                      {formatDateId(row.tanggalIso ?? row.tanggal)}
                    </td>
                    <td className="px-space-md py-space-sm">
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
                          <Home aria-hidden className="h-3 w-3" />
                        )}
                        {tampil ? "Tampil" : "Tidak tampil"}
                      </button>
                    </td>
                    <td className="px-space-md py-space-sm">
                      <div className="flex flex-wrap items-center justify-end gap-space-xs">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <PengumumanDialog
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
          title="Hapus pengumuman?"
          description={`Pengumuman "${deleting.judul}" akan dihapus permanen.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
