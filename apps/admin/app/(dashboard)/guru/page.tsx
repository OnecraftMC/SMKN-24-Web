"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, assetUrl, isUnauthorized } from "@/lib/api";
import type { GuruDTO } from "@/lib/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/ui/FormBits";
import GuruDialog from "./GuruDialog";

export default function GuruPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<GuruDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GuruDTO | null>(null);

  const [deleting, setDeleting] = useState<GuruDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("semua");

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiRequest<GuruDTO[]>("/api/guru/index.php");
        if (cancelled) return;
        setRows(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat data guru.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  const kategoriOptions = useMemo(() => {
    const set = new Set(rows.map((row) => row.kategori));
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (kategoriFilter !== "semua" && row.kategori !== kategoriFilter) return false;
      if (q === "") return true;
      return row.nama.toLowerCase().includes(q) || row.jabatan.toLowerCase().includes(q);
    });
  }, [rows, query, kategoriFilter]);

  const previewRow = visibleRows[0] ?? null;
  const previewSrc = assetUrl(previewRow ? previewRow.gambar : null);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/guru/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus data guru.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Direktori Guru
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Kategori, urutan, dan foto mengikuti kartu publik DewanGuru.
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
          Tambah guru
        </button>
      </header>

      <div className="flex flex-wrap items-end gap-space-md">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="guru-cari" className="sr-only">
            Cari nama atau jabatan
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              id="guru-cari"
              className={`${fieldClass} pl-9`}
              placeholder="Cari nama/jabatan…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="guru-filter-kategori" className="sr-only">
            Filter kategori
          </label>
          <select
            id="guru-filter-kategori"
            className={fieldClass}
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
          >
            <option value="semua">Semua kategori</option>
            {kategoriOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
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

      {previewRow && !loading && (
        <section
          aria-label="Pratinjau kartu publik"
          className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"
        >
          <p className="mb-space-sm font-label-sm text-label-sm font-bold uppercase tracking-wide text-secondary">
            Pratinjau kartu publik (DewanGuru)
          </p>
          <div className="max-w-xs rounded-2xl bg-surface-container-low p-space-md text-center">
            {previewSrc ? (
              <Image
                src={previewSrc}
                alt={previewRow.nama}
                width={112}
                height={112}
                className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-primary/10"
                unoptimized
              />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-surface-container-high font-title-md font-bold text-on-surface-variant">
                ?
              </div>
            )}
            <p className="mt-3 font-title-md font-bold text-primary">{previewRow.nama}</p>
            <p className="text-xs font-semibold text-secondary">{previewRow.jabatan}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{previewRow.deskripsi}</p>
          </div>
        </section>
      )}

      <ListState
        loading={loading}
        error={rows.length === 0 ? error : null}
        empty={visibleRows.length === 0}
        emptyLabel={
          rows.length === 0
            ? "Belum ada data guru. Tambahkan guru pertama."
            : "Tidak ada guru yang cocok dengan pencarian/filter."
        }
        onRetry={reload}
      />

      {!loading && visibleRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-primary text-surface">
              <tr>
                <th className="px-space-md py-space-sm font-label-sm font-bold">Foto</th>
                <th className="px-space-md py-space-sm font-label-sm font-bold">Nama</th>
                <th className="px-space-md py-space-sm font-label-sm font-bold">Jabatan</th>
                <th className="px-space-md py-space-sm font-label-sm font-bold">Kategori</th>
                <th className="px-space-md py-space-sm font-label-sm font-bold">Urutan</th>
                <th className="px-space-md py-space-sm">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const src = assetUrl(row.gambar);
                return (
                  <tr key={row.id} className="border-t border-surface-container">
                    <td className="px-space-md py-space-sm">
                      {src ? (
                        <Image
                          src={src}
                          alt={row.nama}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-label-sm font-bold text-on-surface-variant">
                          ?
                        </div>
                      )}
                    </td>
                    <td className="px-space-md py-space-sm font-bold text-primary">{row.nama}</td>
                    <td className="px-space-md py-space-sm text-on-surface-variant">
                      {row.jabatan}
                    </td>
                    <td className="px-space-md py-space-sm">
                      <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-surface">
                        {row.kategori}
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm tabular-nums">{row.urutan ?? 0}</td>
                    <td className="px-space-md py-space-sm">
                      <div className="flex justify-end gap-space-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(row);
                            setDialogOpen(true);
                          }}
                          className={buttonGhostClass}
                          aria-label={`Edit ${row.nama}`}
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
                          aria-label={`Hapus ${row.nama}`}
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
        <GuruDialog
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
          title="Hapus guru?"
          description={`Data "${deleting.nama}" akan dihapus permanen.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}