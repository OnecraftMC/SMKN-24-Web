"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Building2, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, assetUrl, isUnauthorized } from "@/lib/admin/api";
import type { HubIndustriDTO } from "@/lib/admin/types";
import {
  ConfirmDialog,
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import HubIndustriDialog from "./HubIndustriDialog";

export default function HubIndustriAdminPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<HubIndustriDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HubIndustriDTO | null>(null);
  const [deleting, setDeleting] = useState<HubIndustriDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setError(null);
    setLoading(true);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiRequest<HubIndustriDTO[]>("/api/hub-industri/index.php");
        if (!cancelled) setRows(data);
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat mitra industri.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadKey, logout]);

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    return rows.filter((row) => [row.nama, row.alamat, row.deskripsi].some((value) => value.toLocaleLowerCase("id").includes(needle)));
  }, [rows, query]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/hub-industri/index.php?id=${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      reload();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus mitra industri.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Hub Industri</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Kelola logo, informasi kemitraan, kontak, dan urutan tampil di Profil.</p>
        </div>
        <button type="button" className={buttonPrimaryClass} onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus aria-hidden className="size-4" /> Tambah mitra
        </button>
      </header>

      <div className="max-w-md">
        <label htmlFor="hub-industri-cari" className="sr-only">Cari mitra industri</label>
        <div className="relative"><Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
          <input id="hub-industri-cari" className={`${fieldClass} pl-9`} placeholder="Cari nama, alamat, deskripsi…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>

      <ListState loading={loading} error={rows.length === 0 ? error : null} empty={visibleRows.length === 0} emptyLabel={rows.length === 0 ? "Belum ada mitra. Tambahkan data mitra pertama." : "Tidak ada mitra yang cocok dengan pencarian."} onRetry={reload} />

      {!loading && visibleRows.length > 0 && (
        <div className="grid gap-gutter-md md:grid-cols-2 xl:grid-cols-3">
          {visibleRows.map((row) => {
            const logo = assetUrl(row.logo);
            return (
              <article key={row.id} className="flex h-full flex-col rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm">
                <div className="flex min-h-14 items-center justify-between gap-3">
                  {logo ? <Image src={logo} alt={`Logo ${row.nama}`} width={140} height={56} className="h-12 max-w-36 object-contain object-left" unoptimized /> : <span className="grid size-11 place-items-center rounded-xl bg-surface-container-low text-primary"><Building2 aria-hidden className="size-5" /></span>}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.aktif ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"}`}>{row.aktif ? "Tayang" : "Disembunyikan"}</span>
                </div>
                <h2 className="mt-3 font-title-md font-bold text-primary">{row.nama}</h2>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-on-surface-variant"><MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />{row.alamat}</p>
                <p className="mt-2 flex-1 text-sm text-on-surface-variant">{row.deskripsi}</p>
                <p className="mt-3 text-xs text-on-surface-variant">Urutan tampil: {row.urutan}{row.linkLabel ? ` · Aksi: ${row.linkLabel}` : ""}</p>
                <div className="mt-3 flex justify-end gap-2 border-t border-surface-container pt-3">
                  <button type="button" className={buttonGhostClass} onClick={() => { setEditing(row); setDialogOpen(true); }} aria-label={`Edit ${row.nama}`}><Pencil aria-hidden className="size-4" />Edit</button>
                  <button type="button" className={buttonGhostClass} onClick={() => { setDeleting(row); setDeleteError(null); }} aria-label={`Hapus ${row.nama}`}><Trash2 aria-hidden className="size-4" />Hapus</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dialogOpen && <HubIndustriDialog editing={editing} onClose={() => setDialogOpen(false)} onSaved={() => { setDialogOpen(false); reload(); }} onUnauthorized={logout} />}
      {deleting && <ConfirmDialog title="Hapus mitra industri?" description={`Data "${deleting.nama}" akan dihapus permanen.`} busy={deleteBusy} error={deleteError} onConfirm={() => void confirmDelete()} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
