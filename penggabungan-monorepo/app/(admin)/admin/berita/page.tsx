"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import Link from "next/link";
import { apiRequest, assetUrl, isUnauthorized } from "@/lib/admin/api";
import { formatDateId } from "@/lib/admin/format";
import type { BeritaDTO } from "@/lib/admin/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";

type StatusFilter = "semua" | "draft" | "terbit";

export default function BeritaPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<BeritaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Tambah/edit kini halaman penuh (/admin/berita/baru, /admin/berita/[id]).

  const [deleting, setDeleting] = useState<BeritaDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [highlightBusyId, setHighlightBusyId] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    apiRequest<BeritaDTO[]>("/api/berita/index.php")
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
        setError(err instanceof Error ? err.message : "Gagal memuat berita.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  const visibleRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows
      .filter((row) => (statusFilter === "semua" ? true : (row.status ?? "terbit") === statusFilter))
      .filter((row) => (keyword === "" ? true : row.judul.toLowerCase().includes(keyword)))
      .sort((a, b) => (b.tanggalIso ?? b.tanggal).localeCompare(a.tanggalIso ?? a.tanggal));
  }, [rows, query, statusFilter]);

  async function toggleHighlight(row: BeritaDTO) {
    setHighlightBusyId(row.id);
    setError(null);
    try {
      await apiRequest(`/api/berita/index.php?id=${row.id}`, {
        method: "PUT",
        body: {
          judul: row.judul,
          kategori: row.kategori,
          tanggal: row.tanggalIso ?? row.tanggal,
          gambar: row.gambar,
          ringkasan: row.ringkasan ?? "",
          isi: row.isi ?? "",
          status: row.status ?? "terbit",
          utama: !row.utama,
        },
      });
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal mengubah berita utama.");
    } finally {
      setHighlightBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/berita/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus berita.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            Berita &amp; Highlight
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Kelola berita, status terbit/draft, dan berita utama. Hanya satu berita
            utama aktif pada satu waktu.
          </p>
        </div>
        <Link href="/admin/berita/baru" className={buttonPrimaryClass}>
          <Plus aria-hidden className="h-4 w-4" />
          Tambah berita
        </Link>
      </header>

      <div className="flex flex-wrap items-end gap-space-md">
        <div className="min-w-[16rem] flex-1">
          <label htmlFor="berita-cari" className="sr-only">
            Cari judul berita
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              id="berita-cari"
              className={`${fieldClass} pl-9`}
              placeholder="Cari judul…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="berita-status-filter" className="sr-only">
            Filter status
          </label>
          <select
            id="berita-status-filter"
            className={fieldClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="semua">Semua status</option>
            <option value="terbit">Terbit</option>
            <option value="draft">Draft</option>
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
            ? "Belum ada berita. Tambahkan berita pertama."
            : "Tidak ada berita yang cocok dengan pencarian/filter."
        }
        onRetry={reload}
      />

      {!loading && visibleRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
          <table className="w-full min-w-[52rem] text-left font-body-sm text-body-sm">
            <caption className="sr-only">Daftar berita</caption>
            <thead className="bg-surface-container-low">
              <tr>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Berita
                </th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Kategori
                </th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Tanggal
                </th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Status
                </th>
                <th scope="col" className="px-space-md py-space-sm text-right font-label-sm text-label-sm uppercase text-on-surface-variant">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const thumb = assetUrl(row.gambar);
                const utama = row.utama;
                const status = row.status ?? "terbit";

                return (
                  <tr key={row.id} className="border-t border-surface-container">
                    <td className="px-space-md py-space-sm">
                      <div className="flex items-center gap-space-sm">
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface-container">
                          {thumb && (
                            <Image
                              src={thumb}
                              alt=""
                              width={64}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-primary">{row.judul}</p>
                          {utama && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-container">
                              <Star aria-hidden className="h-3 w-3" />
                              Utama
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-space-md py-space-sm text-on-surface-variant">{row.kategori}</td>
                    <td className="px-space-md py-space-sm text-on-surface-variant">
                      {formatDateId(row.tanggalIso ?? row.tanggal)}
                    </td>
                    <td className="px-space-md py-space-sm">
                      <span
                        className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold ${
                          status === "terbit"
                            ? "bg-primary text-surface"
                            : "bg-surface-container-high text-on-surface"
                        }`}
                      >
                        {status === "terbit" ? "Terbit" : "Draft"}
                      </span>
                    </td>
                    <td className="px-space-md py-space-sm">
                      <div className="flex flex-wrap items-center justify-end gap-space-xs">
                        <button
                          type="button"
                          onClick={() => void toggleHighlight(row)}
                          disabled={highlightBusyId === row.id}
                          className={buttonGhostClass}
                          aria-label={utama ? `Batalkan utama pada ${row.judul}` : `Jadikan utama: ${row.judul}`}
                        >
                          {highlightBusyId === row.id ? (
                            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star aria-hidden className="h-4 w-4" />
                          )}
                          {utama ? "Batalkan" : "Utamakan"}
                        </button>
                        <Link
                          href={`/admin/berita/${row.id}`}
                          className={buttonGhostClass}
                          aria-label={`Edit ${row.judul}`}
                        >
                          <Pencil aria-hidden className="h-4 w-4" />
                          Edit
                        </Link>
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

      {deleting && (
        <ConfirmDialog
          title="Hapus berita?"
          description={`Berita "${deleting.judul}" akan dihapus permanen.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
