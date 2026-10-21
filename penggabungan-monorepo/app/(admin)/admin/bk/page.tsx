"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldAlert, Send, Save, Phone, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import {
  apiRequest,
  getBkWaConfig,
  saveBkWaConfig,
  testBkWa,
  isUnauthorized,
} from "@/lib/admin/api";
import {
  type PesanBKDTO,
  type StatusPesanBK,
  type TingkatKesulitanBK,
  type BkWaSetting,
  type WaProvider,
} from "@/lib/admin/types";
import { ConfirmDialog, Modal, fieldClass, labelClass } from "@/components/admin/ui/FormBits";
import BKDetailPanel from "@/components/admin/bk/BKDetailPanel";
import BKQueueList from "@/components/admin/bk/BKQueueList";
import {
  parseTranskrip,
  pilihPrioritasTerbuka,
  sortAntrean,
} from "@/components/admin/bk/bk-helpers";

/**
 * Link verifikasi WhatsApp Guru BK.
 *
 * Format: https://wa.me/<nomor tanpa "+">?text=<pesan prefilled>.
 * Ganti NOMOR_VERIFIKASI_WA dengan nomor Guru BK yang sebenarnya.
 */
const NOMOR_VERIFIKASI_WA = "6289526417406";
const PESAN_VERIFIKASI_WA = "bk-registery";
const WA_VERIFIKASI_URL = `https://wa.me/${NOMOR_VERIFIKASI_WA}?text=${encodeURIComponent(PESAN_VERIFIKASI_WA)}`;

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

  // ---------- Konfigurasi WhatsApp Guru BK ----------
  const [waConfig, setWaConfig] = useState<BkWaSetting | null>(null);
  const [waLoading, setWaLoading] = useState(true);
  const [waError, setWaError] = useState<string | null>(null);
  const [waSaving, setWaSaving] = useState(false);
  const [waTesting, setWaTesting] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{
    ok: boolean;
    status: string;
    detail: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const muatWaConfig = useCallback(async () => {
    try {
      const cfg = await getBkWaConfig();
      setWaConfig(cfg);
      setWaError(null);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setWaError(err instanceof Error ? err.message : "Gagal memuat konfigurasi WA.");
    } finally {
      setWaLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function muat() {
      try {
        const cfg = await getBkWaConfig();
        if (cancelled) return;
        setWaConfig(cfg);
        setWaError(null);
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setWaError(err instanceof Error ? err.message : "Gagal memuat konfigurasi WA.");
      } finally {
        if (!cancelled) setWaLoading(false);
      }
    }

    void muat();

    return () => {
      cancelled = true;
    };
  }, [logout]);

  const simpanWaConfig = async () => {
    if (!waConfig) return;
    setWaSaving(true);
    setWaError(null);
    try {
      const cfg = await saveBkWaConfig({
        target: waConfig.target,
        aktif: waConfig.aktif,
        threshold: waConfig.threshold,
        provider: waConfig.provider,
      });
      setWaConfig(cfg);
      setWaTestResult(null);
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setWaError(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi WA.");
    } finally {
      setWaSaving(false);
    }
  };

  const ujiKirimWa = async () => {
    setWaTesting(true);
    setWaError(null);
    setWaTestResult(null);
    try {
      const res = await testBkWa();
      setWaTestResult({
        ok: res.ok,
        status: res.status,
        detail: res.detail,
      });
      // Muat ulang config agar jumlah_laporan_terbuka terkini
      await muatWaConfig();
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setWaError(err instanceof Error ? err.message : "Uji kirim WA gagal.");
    } finally {
      setWaTesting(false);
    }
  };

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

      {/* ---------- Chatbot-BK ↔ Guru BK (WhatsApp) ---------- */}
      <section
        aria-label="Konfigurasi Chatbot-BK untuk Guru BK"
        className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-space-lg"
      >
        <div className="mb-space-lg flex flex-wrap items-start justify-between gap-space-sm">
          <div>
            <h2 className="flex items-center gap-space-xs font-title-sm text-title-sm font-bold text-orange-700">
              <MessageCircle className="h-5 w-5" aria-hidden />
              Chatbot-BK ↔ Guru BK
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              <strong className="font-bold text-orange-700">Chatbot-BK</strong> adalah sistem pendamping
              Bimbingan Konseling. Saat ada laporan siswa yang perlu intervensi manusia, Chatbot-BK
              menghubungi Guru BK lewat WhatsApp dengan ringkasan kasus dan saran tindak lanjut.
            </p>
          </div>
          <a
            id="wa-verifikasi-btn"
            href={WA_VERIFIKASI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-space-xs rounded-lg bg-green-600 px-space-md py-2.5 font-label-md text-label-md font-bold text-white transition-colors hover:bg-green-700"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Verifikasi Nomor Chatbot-BK
          </a>
        </div>

        {waConfig && (
          <div className="mb-space-lg flex flex-wrap items-center gap-space-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-3 py-1 font-label-sm text-label-sm font-bold text-orange-700">
              🤖 Pengirim: {waConfig.pengirim}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-label-sm text-label-sm font-bold ${
                waConfig.aktif
                  ? "bg-green-600/15 text-green-700"
                  : "bg-on-surface-variant/15 text-on-surface-variant"
              }`}
            >
              <span aria-hidden>{waConfig.aktif ? "●" : "○"}</span>
              {waConfig.status_agen}
            </span>
          </div>
        )}

        {waLoading ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">Memuat konfigurasi…</p>
        ) : waError ? (
          <div
            className="rounded-lg border border-error-container bg-error-container/40 p-space-md font-body-sm text-body-sm text-on-error-container"
          >
            <p>{waError}</p>
          </div>
        ) : (
          <>
            {/* Pratinjau bubble WhatsApp — dibuka lewat modal agar halaman tetap ringkas */}
            <div className="mb-space-lg">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center justify-center gap-space-xs rounded-lg border border-orange-500/50 px-space-md py-2.5 font-label-md text-label-md font-bold text-orange-600 transition-colors hover:bg-orange-500/10"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Lihat pratinjau pesan masuk
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); simpanWaConfig(); }} className="grid gap-space-md">
              <div className="grid gap-1 sm:grid-cols-3 sm:items-center">
                <label htmlFor="wa-target" className={labelClass}>
                  Nomor WhatsApp Guru BK
                </label>
                <input
                  id="wa-target"
                  type="tel"
                  className={`${fieldClass} border-orange-500/40 focus:border-orange-500 focus:ring-orange-500/30`}
                  value={waConfig?.target ?? ""}
                  onChange={(e) =>
                    setWaConfig((prev) =>
                      prev ? { ...prev, target: e.target.value.replace(/\D/g, "") } : prev,
                    )}
                  placeholder="62812xxxx"
                  disabled={waSaving}
                />
                <p className="col-span-full sm:col-span-2 font-body-sm text-body-sm text-on-surface-variant">
                  Format internasional tanpa &quot;+&quot;, contoh 628123456789.
                </p>
              </div>

              <div className="grid gap-1 sm:grid-cols-3 sm:items-center">
                <label htmlFor="wa-aktif" className={labelClass}>
                  Izin Chatbot-BK menghubungi Guru BK
                </label>
                <label
                  htmlFor="wa-aktif"
                  className="flex min-h-11 cursor-pointer items-center gap-space-sm rounded-lg border border-surface-container px-space-md font-body-sm text-body-sm text-on-surface transition-colors has-checked:border-orange-500/50 has-checked:bg-orange-500/10"
                >
                  <input
                    id="wa-aktif"
                    type="checkbox"
                    checked={waConfig?.aktif ?? false}
                    onChange={(e) =>
                      setWaConfig((prev) =>
                        prev ? { ...prev, aktif: e.target.checked } : prev,
                      )}
                    disabled={waSaving}
                    className="h-4 w-4 shrink-0 accent-orange-500"
                  />
                  <span>Aktifkan pesan otomatis dari Chatbot-BK</span>
                </label>
              </div>

              <div className="grid gap-1 sm:grid-cols-3 sm:items-center">
                <label htmlFor="wa-threshold" className={labelClass}>
                  Ambang eskalasi laporan
                </label>
                <input
                  id="wa-threshold"
                  type="number"
                  min="1"
                  className={`${fieldClass} border-orange-500/40 focus:border-orange-500 focus:ring-orange-500/30`}
                  value={waConfig?.threshold ?? 10}
                  onChange={(e) =>
                    setWaConfig((prev) =>
                      prev ? { ...prev, threshold: Math.max(1, parseInt(e.target.value) || 1) } : prev,
                    )}
                  disabled={waSaving}
                />
                <p className="col-span-full sm:col-span-2 font-body-sm text-body-sm text-on-surface-variant">
                  Saat jumlah laporan yang perlu intervensi mencapai angka ini, Chatbot-BK
                  akan menghubungi Guru BK lewat WhatsApp.
                </p>
              </div>

              <div className="grid gap-1 sm:grid-cols-3 sm:items-center">
                <label htmlFor="wa-provider" className={labelClass}>
                  Gateway provider
                </label>
                <select
                  id="wa-provider"
                  className={`${fieldClass} border-orange-500/40 focus:border-orange-500 focus:ring-orange-500/30`}
                  value={waConfig?.provider ?? "fonnte"}
                  onChange={(e) =>
                    setWaConfig((prev) =>
                      prev ? { ...prev, provider: e.target.value as WaProvider } : prev,
                    )}
                  disabled={waSaving}
                >
                  <option value="fonnte">Fonnte</option>
                  <option value="wablas">Wablas</option>
                </select>
                <p className="col-span-full sm:col-span-2 font-body-sm text-body-sm text-on-surface-variant">
                  Token dan URL gateway dibaca dari file `.env` backend (server-only).
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-space-sm pt-space-sm border-t border-surface-container">
                <button
                  type="button"
                  onClick={ujiKirimWa}
                  disabled={waTesting || waSaving}
                  className="inline-flex items-center justify-center gap-space-xs rounded-lg border border-orange-500/50 px-space-md py-2.5 font-label-md text-label-md font-bold text-orange-600 transition-colors hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {waTesting && <Send className="h-4 w-4 animate-spin" />}
                  {!waTesting && <Send className="h-4 w-4" />}
                  Uji pesan Chatbot-BK
                </button>
                <button
                  type="submit"
                  disabled={waSaving}
                  className="inline-flex items-center justify-center gap-space-xs rounded-lg bg-orange-500 px-space-md py-2.5 font-label-md text-label-md font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {waSaving && <Save className="h-4 w-4 animate-spin" />}
                  {!waSaving && <Save className="h-4 w-4" />}
                  Simpan preferensi Chatbot-BK
                </button>
              </div>
            </form>

            <div className="mt-space-lg pt-space-lg border-t border-surface-container grid gap-space-sm sm:grid-cols-2 sm:items-start">
              <div>
                <p className="font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant mb-1">
                  Status Chatbot-BK
                </p>
                <p className={`font-body-sm text-body-sm ${waConfig?.aktif ? "text-orange-500" : "text-on-surface-variant"}`}>
                  {waConfig?.aktif ? "Aktif" : "Nonaktif"}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Sumber:{" "}
                  {waConfig?.sumber === "database" ? "Database (dashboard)" : "Env (.env fallback)"}
                </p>
                {waConfig?.status_agen && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {waConfig.status_agen}
                  </p>
                )}
              </div>
              <div className="text-right sm:text-left">
                <p className="font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant mb-1">
                  Laporan berat terbuka
                </p>
                <p className="font-body-md text-body-md font-bold text-on-surface">
                  {waConfig?.jumlah_laporan_terbuka ?? 0}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Ambang: {waConfig?.threshold ?? 10}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Pesan terkirim: {waConfig?.total_terkirim ?? 0}
                  {waConfig?.terakhir_status ? ` · terakhir ${waConfig.terakhir_status}` : ""}
                </p>
              </div>
            </div>

            {waTestResult && (
              <div
                className={`rounded-lg p-space-md font-body-sm text-body-sm ${
                  waTestResult.ok
                    ? "border border-success-container bg-success-container/40 text-on-success-container"
                    : "border border-error-container bg-error-container/40 text-on-error-container"
                }`}
              >
                <p>
                  {waTestResult.ok ? "✓ Berhasil" : "✗ Gagal"}:{" "}
                  {waTestResult.detail}
                </p>
              </div>
            )}
          </>
        )}
      </section>

        <div className="grid gap-space-lg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
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
      {showPreview && (
        <Modal
          title="Pratinjau pesan masuk (belum dikirim)"
          description="Tampilan persis seperti yang diterima Guru BK dari Chatbot-BK."
          onClose={() => setShowPreview(false)}
        >
          <div className="max-w-xl rounded-2xl rounded-tl-sm bg-[#DCF8C6] p-space-md shadow-sm">
            <p className="mb-1 font-label-sm text-label-sm font-bold text-[#075E54]">
              🤖 {waConfig?.pengirim}
            </p>
            <pre className="whitespace-pre-wrap break-words font-body-sm text-body-sm text-[#0F1419]">
              {waConfig?.preview_pesan ?? "Belum ada pratinjau."}
            </pre>
            <p className="mt-1 text-right font-label-sm text-label-sm text-[#667781]">
              {waConfig?.terakhir_kirim
                ? `Terakhir dikirim: ${waConfig.terakhir_kirim}`
                : "Belum pernah dikirim"}
            </p>
          </div>
        </Modal>
      )}
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
