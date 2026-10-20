"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import {
  type PesanBKDTO,
  type StatusPesanBK,
  type TingkatKesulitanBK,
} from "@/lib/admin/types";
import { ConfirmDialog } from "@/components/admin/ui/FormBits";
import BKDetailPanel from "@/components/admin/bk/BKDetailPanel";
import BKQueueList from "@/components/admin/bk/BKQueueList";
import {
  parseTranskrip,
  pilihPrioritasTerbuka,
  sortAntrean,
} from "@/components/admin/bk/bk-helpers";

/**
 * Halaman Pesan BK (`/admin/bk`) — layout master–detail (P9.1/E22).
 *
 * Helper tampilan (maskPhone, badge, transkrip, draf AI, urutan antrean)
 * tinggal di `components/admin/bk/bk-helpers.ts`; lampiran di
 * `components/admin/bk/BKEvidence.tsx`; antrean di
 * `components/admin/bk/BKQueueList.tsx`; detail di
 * `components/admin/bk/BKDetailPanel.tsx`. File ini hanya wadah data/state.
 */
export default function BKPage() {
  const { logout } = useAuth();
  const [rows, setRows] = useState<PesanBKDTO[]>([]);
  const [showDetailMobile, setShowDetailMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [filterKesulitan, setFilterKesulitan] = useState<TingkatKesulitanBK | "semua">("semua");
  const [filterStatus, setFilterStatus] = useState<StatusPesanBK | "semua">("semua");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<PesanBKDTO | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    apiRequest<PesanBKDTO[]>("/api/bk/index.php")
      .then((data) => {
        if (cancelled) return;
        setRows(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat pesan BK.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, logout]);

  /** Ubah status penanganan (Baru -> Diproses -> Selesai). */
  const changeStatus = async (row: PesanBKDTO, status: StatusPesanBK) => {
    setBusyId(row.id);
    try {
      await apiRequest(`/api/bk/index.php?id=${row.id}`, {
        method: "PUT",
        body: { status },
      });
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memperbarui status.");
    } finally {
      setBusyId(null);
    }
  };

  const removeRow = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/bk/index.php?id=${deleting.id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus pesan.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cocok = rows.filter((r) => {
        if (filterKesulitan !== "semua" && r.tingkatKesulitan !== filterKesulitan) return false;
        if (filterStatus !== "semua" && r.status !== filterStatus) return false;
        if (!q) return true;
        return (
          r.nama.toLowerCase().includes(q) ||
          r.kelas.toLowerCase().includes(q) ||
          (r.ringkasan ?? "").toLowerCase().includes(q) ||
          (r.kategori ?? "").toLowerCase().includes(q) ||
          r.pesan.toLowerCase().includes(q)
        );
      });
    // Backend sudah mengurutkan; antrean prioritas P9.1/E22 ditegaskan di
    // sisi klien agar konsisten walau respons datang dari cache versi lama.
    return sortAntrean(cocok);
  }, [rows, query, filterKesulitan, filterStatus]);

  const jumlahPrioritasTerbuka = rows.filter(
    (row) =>
      row.status !== "Selesai" &&
      (row.butuhPerhatian || row.tingkatKesulitan === "Berat"),
  ).length;

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? pilihPrioritasTerbuka(rows),
    [rows, selectedId],
  );

  const antreanGenting = useMemo(
    () =>
      selectedRow
        ? rows.filter(
            (row) =>
              row.id !== selectedRow.id &&
              row.status !== "Selesai" &&
              (row.butuhPerhatian || row.tingkatKesulitan === "Berat"),
          ).length
        : 0,
    [rows, selectedRow],
  );

  const pilihKasus = (id: number) => {
    setSelectedId(id);
    setShowDetailMobile(true);
    setReplyText("");
    setReplyError(null);
    setReplySuccess(null);
  };

  const sendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRow) return;
    const reply = replyText.trim();
    if (!reply) {
      setReplyError("Tulis balasan sebelum mengirim.");
      return;
    }
    if (!selectedRow.canReply) {
      setReplyError("Pesan ini tidak memiliki tautan riwayat perangkat siswa.");
      return;
    }

    setReplyBusy(true);
    setReplyError(null);
    setReplySuccess(null);
    try {
      const result = await apiRequest<{ message: string; status: StatusPesanBK }>(
        "/api/bk/index.php?id=" + selectedRow.id,
        { method: "PUT", body: { reply } },
      );
      const transcript = [...parseTranskrip(selectedRow.transkrip), { sender: "counselor", text: reply }];
      setRows((previous) =>
        previous.map((row) =>
          row.id === selectedRow.id
            ? { ...row, transkrip: JSON.stringify(transcript), status: result.status }
            : row,
        ),
      );
      setReplyText("");
      setReplySuccess("Balasan tersimpan. Siswa dapat membacanya di tab Riwayat BK.");
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setReplyError(err instanceof Error ? err.message : "Balasan belum berhasil dikirim.");
    } finally {
      setReplyBusy(false);
    }
  };

  return (
    <div className="space-y-space-lg">
      <header className="space-y-space-xs">
        <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Pesan BK</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Cerita siswa yang dirangkum Counsellor AI. Urutan paling atas = paling mendesak untuk
          ditangani.
        </p>
      </header>

      {jumlahPrioritasTerbuka > 0 && (
        <p className="flex items-start gap-2 rounded-2xl border border-error-container bg-error-container/40 p-space-md font-body-sm text-body-sm text-on-error-container">
          <ShieldAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            Ada <strong>{jumlahPrioritasTerbuka}</strong> laporan terbuka berprioritas tinggi.
            Periksa antrean dan tindak lanjuti sesuai penilaian Guru BK.
          </span>
        </p>
      )}

      <div className="grid items-start gap-space-lg lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className={showDetailMobile ? "hidden lg:block" : undefined}>
          <BKQueueList
            rows={visible}
            selectedId={selectedRow?.id ?? null}
            loading={loading}
            error={error}
            onRetry={reload}
            query={query}
            onQueryChange={setQuery}
            filterKesulitan={filterKesulitan}
            onFilterKesulitanChange={setFilterKesulitan}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            onSelect={pilihKasus}
          />
        </div>
        <div className={showDetailMobile ? undefined : "hidden lg:block"}>
          {rows.length === 0 && !loading && !error ? (
            <section
              aria-label="Detail pesan BK"
              className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-surface-container bg-surface-container-lowest p-space-lg text-center"
            >
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Belum ada pesan BK yang cocok dengan filter.
              </p>
            </section>
          ) : (
            <BKDetailPanel
              row={selectedRow}
              hasOpenCases={rows.some((row) => row.status !== "Selesai")}
              antreanGenting={antreanGenting}
              replyText={replyText}
              onReplyTextChange={(value) => {
                setReplyText(value);
                setReplyError(null);
                setReplySuccess(null);
              }}
              replyBusy={replyBusy}
              replyError={replyError}
              replySuccess={replySuccess}
              onSendReply={(event) => void sendReply(event)}
              busyId={busyId}
              onChangeStatus={changeStatus}
              onDelete={(row) => {
                setDeleting(row);
                setDeleteError(null);
              }}
              onBack={() => setShowDetailMobile(false)}
            />
          )}
        </div>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Hapus pesan BK?"
          description="Pesan yang dihapus tidak dapat dikembalikan."
          busy={deleteBusy}
          error={deleteError}
          onConfirm={removeRow}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
