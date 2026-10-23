"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CalendarClock, MapPin, Pencil, Plus, Search, Sparkles, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, assetUrl, isNotFound, isUnauthorized } from "@/lib/admin/api";
import type { EkstrakurikulerDTO } from "@/lib/admin/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import EkstrakurikulerDialog from "./EkstrakurikulerDialog";

export default function EkstrakurikulerPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<EkstrakurikulerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EkstrakurikulerDTO | null>(null);

  const [deleting, setDeleting] = useState<EkstrakurikulerDTO | null>(null);
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
        const data = await apiRequest<EkstrakurikulerDTO[]>("/api/ekstrakurikuler/index.php");
        if (cancelled) return;
        setRows(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        if (isNotFound(err)) {
          setError(
            "Endpoint ekstrakurikuler belum ada di server (HTTP 404). Unggah folder backend/api/ekstrakurikuler ke backend produksi, lalu muat ulang halaman ini.",
          );
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat data ekstrakurikuler.");
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
        row.nama.toLowerCase().includes(q) ||
        (row.deskripsi ?? "").toLowerCase().includes(q) ||
        (row.kategori ?? "").toLowerCase().includes(q) ||
        (row.pembina ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const featuredCount = useMemo(() => rows.filter((row) => row.unggulan).length, [rows]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/ekstrakurikuler/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus ekstrakurikuler.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Ekstrakurikuler
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Kelola logo, info, pembina, jadwal, dan lokasi kegiatan siswa. Kartu ini tampil di
            halaman publik <span className="font-semibold text-primary">/ekstrakurikuler</span>.
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
          Tambah ekstrakurikuler
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-space-sm">
        <div className="w-full max-w-md">
          <label htmlFor="ekstrakurikuler-cari" className="sr-only">
            Cari ekstrakurikuler
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              id="ekstrakurikuler-cari"
              className={`${fieldClass} pl-9`}
              placeholder="Cari nama, kategori, atau pembina…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <span className="micro-pop inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1.5 text-xs font-bold text-on-secondary-container">
          <Sparkles aria-hidden className="h-3.5 w-3.5" />
          {rows.length} kegiatan · {featuredCount} unggulan
        </span>
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
            ? "Belum ada ekstrakurikuler. Tambahkan kegiatan pertama."
            : "Tidak ada ekstrakurikuler yang cocok dengan pencarian."
        }
        onRetry={reload}
      />

      {!loading && visibleRows.length > 0 && (
        <div className="micro-stagger grid grid-cols-1 gap-gutter-md md:grid-cols-2 xl:grid-cols-3">
          {visibleRows.map((row) => {
            const src = assetUrl(row.logo);
            return (
              <article
                key={row.id}
                className="micro-card micro-shine group flex flex-col overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm"
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),rgba(236,241,248,0.9))]">
                  {src ? (
                    <Image
                      src={src}
                      alt={`Logo ${row.nama}`}
                      width={160}
                      height={160}
                      className="h-28 w-28 object-contain p-2 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                      <Sparkles aria-hidden className="h-8 w-8 text-primary/40" />
                      Belum ada logo
                    </div>
                  )}
                  {row.unggulan && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-[11px] font-bold text-on-secondary-container">
                      <Sparkles aria-hidden className="h-3 w-3" />
                      Unggulan
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-space-sm p-space-md">
                  <div className="space-y-1">
                    {row.kategori && (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                        {row.kategori}
                      </span>
                    )}
                    <h2 className="font-title-md text-lg font-bold text-primary">{row.nama}</h2>
                  </div>
                  <p className="line-clamp-3 flex-1 text-body-sm text-on-surface-variant">
                    {row.deskripsi || "Belum ada info kegiatan."}
                  </p>
                  <div className="flex flex-wrap gap-x-space-sm gap-y-1 text-xs text-on-surface-variant">
                    {row.pembina && (
                      <span className="inline-flex items-center gap-1">
                        <UserRound aria-hidden className="h-3.5 w-3.5 text-secondary" />
                        {row.pembina}
                      </span>
                    )}
                    {row.jadwal && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock aria-hidden className="h-3.5 w-3.5 text-secondary" />
                        {row.jadwal}
                      </span>
                    )}
                    {row.lokasi && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin aria-hidden className="h-3.5 w-3.5 text-secondary" />
                        {row.lokasi}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-space-xs border-t border-surface-container pt-space-sm">
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
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <EkstrakurikulerDialog
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
          title="Hapus ekstrakurikuler?"
          description={`Ekstrakurikuler "${deleting.nama}" akan dihapus permanen dari halaman publik.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
