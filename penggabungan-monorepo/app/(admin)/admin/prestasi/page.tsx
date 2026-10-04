"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Eye, Loader2, Search } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiDownload, apiRequest, isUnauthorized } from "@/lib/admin/api";
import type { PrestasiDTO, StatusPrestasi } from "@/lib/admin/types";
import {
  ListState,
  Modal,
  buttonGhostClass,
  fieldClass,
} from "@/components/admin/ui/FormBits";
import CategoryField from "@/components/admin/ui/CategoryField";

const statuses: StatusPrestasi[] = ["Baru", "Ditinjau", "Disetujui", "Ditolak"];
type StatusFilter = "semua" | StatusPrestasi;
type PrestasiPage = { items: PrestasiDTO[]; page: number; pageSize: number; total: number };

function maskNisn(value: string): string {
  if (value.length < 5) return "••••";
  return `${value.slice(0, 2)}${"•".repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

export default function PrestasiAdminPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<PrestasiDTO[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [detail, setDetail] = useState<PrestasiDTO | null>(null);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page) });
    if (query.trim()) params.set("q", query.trim());
    if (statusFilter !== "semua") params.set("status", statusFilter);

    apiRequest<PrestasiPage>(`/api/prestasi/index.php?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        setRows(data.items);
        setPageSize(data.pageSize);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat pengajuan prestasi.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout, page, query, statusFilter]);

  async function updateStatus(row: PrestasiDTO, status: StatusPrestasi) {
    if (row.status === status || statusBusyId !== null) return;
    setStatusBusyId(row.id);
    setError(null);
    try {
      await apiRequest(`/api/prestasi/index.php?id=${row.id}`, {
        method: "PUT",
        body: { status },
      });
      const updated = { ...row, status };
      setRows((current) => current.map((item) => item.id === row.id ? updated : item));
      setDetail((current) => current?.id === row.id ? updated : current);
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

  async function updateCategory(row: PrestasiDTO, kategori: string | null) {
    if (row.kategori === kategori || statusBusyId !== null) return;
    setStatusBusyId(row.id);
    setError(null);
    try {
      await apiRequest(`/api/prestasi/index.php?id=${row.id}`, {
        method: "PUT",
        body: { kategori },
      });
      const updated = { ...row, kategori };
      setRows((current) => current.map((item) => item.id === row.id ? updated : item));
      setDetail((current) => current?.id === row.id ? updated : current);
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memperbarui kategori pengajuan.");
    } finally {
      setStatusBusyId(null);
    }
  }

  async function downloadEvidence(row: PrestasiDTO) {
    if (!row.downloadUrl) return;
    try {
      const blob = await apiDownload(row.downloadUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = row.namaFile ?? "bukti-prestasi";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal mengunduh bukti.");
    }
  }

  return (
    <div className="space-y-space-lg">
      <header>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">
          Pengajuan Prestasi
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Data siswa dan bukti hanya ditampilkan pada area admin. Persetujuan tidak
          memublikasikan pengajuan ke website.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-error-container p-space-md text-on-error-container">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-space-sm rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md md:flex-row md:items-end">
        <label className="relative flex-1">
          <span className="sr-only">Cari pengajuan prestasi</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            placeholder="Cari nama, kelas, lomba, penyelenggara…"
            className={`${fieldClass} pl-9`}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-label-sm font-bold text-on-surface-variant">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value as StatusFilter);
            }}
            className={fieldClass}
          >
            <option value="semua">Semua</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>

      {!error && (
        <ListState
          loading={loading}
          error={null}
          empty={!loading && total === 0}
          emptyLabel={query || statusFilter !== "semua" ? "Tidak ada pengajuan yang sesuai filter." : "Belum ada pengajuan prestasi."}
          onRetry={reload}
        />
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <caption className="sr-only">Daftar pengajuan prestasi siswa</caption>
            <thead>
              <tr className="border-b border-surface-container">
                <th scope="col" className="px-space-md py-space-sm">Siswa</th>
                <th scope="col" className="px-space-md py-space-sm">NISN (disamarkan)</th>
                <th scope="col" className="px-space-md py-space-sm">Lomba</th>
                <th scope="col" className="px-space-md py-space-sm">Tanggal</th>
                <th scope="col" className="px-space-md py-space-sm">Kategori internal</th>
                <th scope="col" className="px-space-md py-space-sm">Status</th>
                <th scope="col" className="px-space-md py-space-sm">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-container last:border-0">
                  <th scope="row" className="px-space-md py-space-md font-semibold text-primary">
                    {row.namaSiswa}
                    <span className="block font-normal text-on-surface-variant">{row.kelas} · {row.jurusan}</span>
                  </th>
                  <td className="px-space-md py-space-md">{maskNisn(row.nisn)}</td>
                  <td className="px-space-md py-space-md">{row.perlombaan}</td>
                  <td className="px-space-md py-space-md">{formatDate(row.tanggalLomba)}</td>
                  <td className="px-space-md py-space-md">{row.kategori ?? "—"}</td>
                  <td className="px-space-md py-space-md">
                    <label className="block">
                      <span className="sr-only">Status pengajuan {row.namaSiswa}</span>
                      <select
                        value={row.status}
                        disabled={statusBusyId !== null}
                        onChange={(event) => void updateStatus(row, event.target.value as StatusPrestasi)}
                        className={fieldClass}
                      >
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                      {statusBusyId === row.id && <span className="sr-only">Menyimpan status…</span>}
                    </label>
                  </td>
                  <td className="px-space-md py-space-md">
                    <button type="button" className={buttonGhostClass} onClick={() => setDetail(row)}>
                      <Eye aria-hidden className="h-4 w-4" /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <nav aria-label="Halaman pengajuan prestasi" className="flex flex-wrap items-center justify-between gap-space-sm">
          <p role="status" className="text-sm text-on-surface-variant">
            Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total}
          </p>
          <div className="flex gap-space-sm">
            <button
              type="button"
              className={buttonGhostClass}
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Sebelumnya
            </button>
            <button
              type="button"
              className={buttonGhostClass}
              disabled={page * pageSize >= total}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
            </button>
          </div>
        </nav>
      )}

      {detail && (
        <Modal
          title={`Detail pengajuan — ${detail.namaSiswa}`}
          description={`Diterima ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(detail.createdAt))}`}
          onClose={() => setDetail(null)}
          footer={
            <button type="button" className={buttonGhostClass} onClick={() => setDetail(null)}>
              Tutup
            </button>
          }
        >
          <dl className="grid gap-space-md sm:grid-cols-2">
            <Detail label="NISN">{detail.nisn}</Detail>
            <Detail label="Nama siswa">{detail.namaSiswa}</Detail>
            <Detail label="Kelas">{detail.kelas}</Detail>
            <Detail label="Jurusan">{detail.jurusan}</Detail>
            <Detail label="Perlombaan">{detail.perlombaan}</Detail>
            <Detail label="Tingkat">{detail.tingkat}</Detail>
            <Detail label="Tanggal">{formatDate(detail.tanggalLomba)}</Detail>
            <Detail label="Penyelenggara">{detail.penyelenggara}</Detail>
            <Detail label="Prestasi / peringkat">{detail.prestasi}</Detail>
            <Detail label="Status">{detail.status}</Detail>
            <div className="sm:col-span-2">
              <CategoryField
                module="prestasi"
                value={detail.kategori}
                onChange={(kategori) => void updateCategory(detail, kategori)}
                onUnauthorized={logout}
                label="Kategori internal"
              />
            </div>
            <div className="sm:col-span-2">
              <Detail label="Uraian">{detail.deskripsi || "Tidak ada uraian."}</Detail>
            </div>
          </dl>
          {detail.adaBukti && (
            <button
              type="button"
              className={`${buttonGhostClass} mt-space-md`}
              onClick={() => void downloadEvidence(detail)}
            >
              <Download aria-hidden className="h-4 w-4" />
              Unduh bukti — {detail.namaFile}
            </button>
          )}
          {statusBusyId === detail.id && (
            <p role="status" className="mt-space-sm inline-flex items-center gap-2 text-sm text-on-surface-variant">
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Memperbarui status…
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-label-sm font-bold text-on-surface-variant">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-on-surface">{children}</dd>
    </div>
  );
}
