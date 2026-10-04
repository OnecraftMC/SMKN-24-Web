"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import { formatDateId } from "@/lib/admin/format";
import type { PesanBKDTO, StatusPesanBK } from "@/lib/admin/types";
import {
  ConfirmDialog,
  Modal,
  buttonGhostClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import CategoryField from "@/components/admin/ui/CategoryField";

type StatusFilter = "semua" | StatusPesanBK;

const STATUS_OPTIONS: StatusPesanBK[] = ["Baru", "Diproses", "Selesai"];

/**
 * Samarkan nomor HP: tampilkan 4 digit awal + **** + 2 digit akhir.
 * Data inbox bersifat sensitif; daftar tidak pernah menampilkan nomor utuh.
 */
function maskPhone(phone: string | null): string {
  if (!phone) return "â€”";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 6) return "******";
  return `${digits.slice(0, 4)}****${digits.slice(-2)}`;
}

function statusBadge(status: StatusPesanBK): string {
  switch (status) {
    case "Baru":
      return "bg-error-container text-on-error-container";
    case "Diproses":
      return "bg-secondary-container text-on-secondary-container";
    case "Selesai":
      return "bg-primary text-surface";
  }
}

export default function PesanBKPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<PesanBKDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");

  const [detail, setDetail] = useState<PesanBKDTO | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);

  const [deleting, setDeleting] = useState<PesanBKDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // GET terproteksi: tanpa JWT valid backend menjawab 401 â†’ logout.
    apiRequest<PesanBKDTO[]>("/api/bk/index.php")
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
        setError(err instanceof Error ? err.message : "Gagal memuat pesan BK.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [logout]);

  const visibleRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows
      .filter((row) => (statusFilter === "semua" ? true : row.status === statusFilter))
      .filter((row) =>
        keyword === ""
          ? true
          : [row.nama, row.kelas, row.keperluan, row.pesan]
              .join(" ")
              .toLowerCase()
              .includes(keyword),
      );
  }, [rows, query, statusFilter]);

  const counts = useMemo(() => {
    const next: Record<StatusPesanBK, number> = { Baru: 0, Diproses: 0, Selesai: 0 };
    for (const row of rows) next[row.status] += 1;
    return next;
  }, [rows]);

  async function updateStatus(row: PesanBKDTO, status: StatusPesanBK) {
    if (row.status === status || statusBusyId !== null) return;
    setStatusBusyId(row.id);
    setError(null);
    try {
      await apiRequest(`/api/bk/index.php?id=${row.id}`, {
        method: "PUT",
        body: { status },
      });
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, status } : item)));
      setDetail((prev) => (prev?.id === row.id ? { ...prev, status } : prev));
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setStatusBusyId(null);
    }
  }

  async function updateCategory(row: PesanBKDTO, kategori: string | null) {
    if (row.kategori === kategori || statusBusyId !== null) return;
    setStatusBusyId(row.id);
    setError(null);
    try {
      await apiRequest(`/api/bk/index.php?id=${row.id}`, {
        method: "PUT",
        body: { kategori },
      });
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, kategori } : item)));
      setDetail((prev) => (prev?.id === row.id ? { ...prev, kategori } : prev));
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memperbarui kategori pesan.");
    } finally {
      setStatusBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/bk/index.php?id=${deleting.id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((item) => item.id !== deleting.id));
      if (detail?.id === deleting.id) setDetail(null);
      setDeleting(null);
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus pesan.");
    } finally {
      setDeleteBusy(false);
    }
  }
  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Pesan BK</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Inbox konseling dari form publik â€” hanya admin login yang dapat membaca. Nomor HP
            disamarkan di daftar.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-space-sm rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Cari pesan BK</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, kelas, keperluan, isi pesanâ€¦"
            className={`${fieldClass} pl-9`}
          />
        </label>
        <label className="flex items-center gap-space-xs">
          <span className="font-label-sm text-label-sm font-bold text-on-surface-variant">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className={fieldClass}
          >
            <option value="semua">Semua ({rows.length})</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status} ({counts[status]})
              </option>
            ))}
          </select>
        </label>
      </div>

      {!loading && !error && visibleRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
          <table className="w-full min-w-[900px] border-collapse font-body-sm text-body-sm">
            <thead>
              <tr className="border-b border-surface-container text-left">
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm font-bold text-on-surface-variant">Nama</th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm font-bold text-on-surface-variant">Kelas</th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm font-bold text-on-surface-variant">Keperluan</th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm font-bold text-on-surface-variant">Kategori admin</th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm font-bold text-on-surface-variant">No. HP</th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm font-bold text-on-surface-variant">Tanggal</th>
                <th scope="col" className="px-space-md py-space-sm font-label-sm text-label-sm font-bold text-on-surface-variant">Status</th>
                <th scope="col" className="px-space-md py-space-sm text-right font-label-sm text-label-sm font-bold text-on-surface-variant">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-surface-container align-top last:border-0">
                  <td className="px-space-md py-space-sm font-bold text-on-surface">{row.nama}</td>
                  <td className="px-space-md py-space-sm text-on-surface-variant">{row.kelas}</td>
                  <td className="max-w-56 px-space-md py-space-sm text-on-surface-variant">
                    <span className="line-clamp-2">{row.keperluan}</span>
                  </td>
                  <td className="px-space-md py-space-sm text-on-surface-variant">{row.kategori ?? "—"}</td>
                  <td className="px-space-md py-space-sm text-on-surface-variant tabular-nums">
                    {maskPhone(row.noHp)}
                  </td>
                  <td className="px-space-md py-space-sm whitespace-nowrap text-on-surface-variant">
                    {formatDateId(row.tanggal)}
                  </td>
                  <td className="px-space-md py-space-sm">
                    <label className="inline-flex items-center gap-1">
                      <span className="sr-only">Status pesan dari {row.nama}</span>
                      {statusBusyId === row.id ? (
                        <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary" />
                      ) : null}
                      <select
                        value={row.status}
                        disabled={statusBusyId === row.id}
                        onChange={(event) =>
                          void updateStatus(row, event.target.value as StatusPesanBK)
                        }
                        aria-label={`Ubah status pesan dari ${row.nama}`}
                        className={`rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-bold ${statusBadge(row.status)}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </td>
                  <td className="px-space-md py-space-sm">
                    <div className="flex flex-wrap items-center justify-end gap-space-xs">
                      <button
                        type="button"
                        onClick={() => setDetail(row)}
                        className={buttonGhostClass}
                        aria-label={`Lihat detail pesan dari ${row.nama}`}
                      >
                        <Eye aria-hidden className="h-4 w-4" />
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(row);
                        }}
                        className={buttonGhostClass}
                        aria-label={`Hapus pesan dari ${row.nama}`}
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

      {detail && (
        <Modal
          title={`Pesan dari ${detail.nama}`}
          description={`${detail.kelas} â€¢ ${formatDateId(detail.tanggal)} â€¢ Status: ${detail.status}`}
          onClose={() => setDetail(null)}
        >
          <dl className="space-y-space-sm font-body-sm text-body-sm">
            <div>
              <dt className="font-label-sm text-label-sm font-bold text-on-surface-variant">Kategori admin</dt>
              <dd className="mt-2">
                <CategoryField
                  module="bk"
                  value={detail.kategori}
                  onChange={(kategori) => void updateCategory(detail, kategori)}
                  onUnauthorized={logout}
                  label="Klasifikasi internal"
                />
              </dd>
            </div>
            <div>
              <dt className="font-label-sm text-label-sm font-bold text-on-surface-variant">Keperluan</dt>
              <dd className="text-on-surface">{detail.keperluan}</dd>
            </div>
            <div>
              <dt className="font-label-sm text-label-sm font-bold text-on-surface-variant">Isi pesan</dt>
              <dd className="rounded-lg bg-surface-container p-space-sm whitespace-pre-wrap text-on-surface">
                {detail.pesan}
              </dd>
            </div>
            <div>
              <dt className="font-label-sm text-label-sm font-bold text-on-surface-variant">No. HP (disamarkan)</dt>
              <dd className="text-on-surface tabular-nums">{maskPhone(detail.noHp)}</dd>
            </div>
          </dl>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Hapus pesan BK?"
          description={`Pesan dari "${deleting.nama}" (${deleting.kelas}) akan dihapus permanen.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
