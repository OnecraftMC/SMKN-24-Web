"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, assetUrl, isUnauthorized } from "@/lib/admin/api";
import type { FasilitasDTO } from "@/lib/admin/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import FasilitasDialog from "./FasilitasDialog";

export default function FasilitasPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<FasilitasDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FasilitasDTO | null>(null);

  const [deleting, setDeleting] = useState<FasilitasDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiRequest<FasilitasDTO[]>("/api/fasilitas/index.php");
        if (cancelled) return;
        setRows(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat data fasilitas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return rows;
    return rows.filter(
      (row) =>
        row.judul.toLowerCase().includes(q) || (row.deskripsi ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/fasilitas/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus fasilitas.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Fasilitas Sekolah
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Grid menyerupai kartu FasilitasKampus pada situs publik.
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
          Tambah fasilitas
        </button>
      </header>

      <div className="max-w-md">
        <label htmlFor="fasilitas-cari" className="sr-only">
          Cari fasilitas
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            id="fasilitas-cari"
            className={`${fieldClass} pl-9`}
            placeholder="Cari judul/deskripsi…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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
            ? "Belum ada data fasilitas. Tambahkan fasilitas pertama."
            : "Tidak ada fasilitas yang cocok dengan pencarian."
        }
        onRetry={reload}
      />

      {!loading && visibleRows.length > 0 && (
        <div className="grid grid-cols-1 gap-gutter-md md:grid-cols-3">
          {visibleRows.map((row) => {
            const src = assetUrl(row.gambar);
            return (
              <article
                key={row.id}
                className="group overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm"
              >
                <div className="h-52 overflow-hidden bg-surface-container-low">
                  {src ? (
                    <Image
                      src={src}
                      alt={row.judul}
                      width={640}
                      height={208}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-body-sm text-body-sm text-on-surface-variant">
                      Tidak ada gambar
                    </div>
                  )}
                </div>
                <div className="space-y-space-sm p-space-md">
                  <h2 className="font-title-md font-bold text-primary">{row.judul}</h2>
                  <p className="text-body-sm text-on-surface-variant">{row.deskripsi}</p>
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
        <FasilitasDialog
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
          title="Hapus fasilitas?"
          description={`Fasilitas "${deleting.judul}" akan dihapus permanen.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}