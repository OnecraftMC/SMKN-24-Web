"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, assetUrl, isUnauthorized } from "@/lib/admin/api";
import type { GaleriDTO } from "@/lib/admin/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import GaleriDialog from "./GaleriDialog";

export default function GaleriPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<GaleriDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GaleriDTO | null>(null);

  const [deleting, setDeleting] = useState<GaleriDTO | null>(null);
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
        const data = await apiRequest<GaleriDTO[]>("/api/galeri/index.php");
        if (cancelled) return;
        setRows(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat galeri.");
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
      return row.judul.toLowerCase().includes(q);
    });
  }, [rows, query, kategoriFilter]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/galeri/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus foto galeri.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Galeri Kegiatan
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Foto wajib berjudul + kategori; hanya untuk dokumentasi, bukan pengajuan prestasi.
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
          Tambah foto
        </button>
      </header>

      <div className="flex flex-wrap items-end gap-space-md">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="galeri-cari" className="sr-only">
            Cari judul
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              id="galeri-cari"
              className={`${fieldClass} pl-9`}
              placeholder="Cari judul…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="galeri-filter-kategori" className="sr-only">
            Filter kategori
          </label>
          <select
            id="galeri-filter-kategori"
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

      <ListState
        loading={loading}
        error={rows.length === 0 ? error : null}
        empty={visibleRows.length === 0}
        emptyLabel={
          rows.length === 0
            ? "Belum ada foto galeri. Tambahkan foto pertama."
            : "Tidak ada foto yang cocok dengan pencarian/filter."
        }
        onRetry={reload}
      />

      {!loading && visibleRows.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {visibleRows.map((row) => {
            const src = assetUrl(row.gambar);
            return (
              <article
                key={row.id}
                className="group overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm"
              >
                <div className="relative aspect-square overflow-hidden bg-surface-container-low">
                  {src ? (
                    <Image
                      src={src}
                      alt={row.judul}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-body-sm text-body-sm text-on-surface-variant">
                      Tidak ada gambar
                    </div>
                  )}
                </div>
                <div className="space-y-space-xs p-space-sm">
                  <p className="truncate font-title-sm font-bold text-primary" title={row.judul}>
                    {row.judul}
                  </p>
                  <span className="inline-block rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-surface">
                    {row.kategori}
                  </span>
                  <div className="flex justify-end gap-space-xs pt-1">
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
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <GaleriDialog
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
          title="Hapus foto galeri?"
          description={`Foto "${deleting.judul}" akan dihapus permanen.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}