"use client";

/**
 * Halaman Overview dashboard admin — ringkasan kondisi sekolah.
 *
 * Susunan: header hari (di shell) → strip konteks → panel analisis chatbot
 * + ringkasan Chatbot-BK (WhatsApp Guru BK). Tidak ada daftar tugas/pekerjaan
 * bertanggal agar halaman tetap berupa monitoring, bukan ruang kerja/task manager.
 *
 * Semua angka dari backend. Kegagalan parsial dinyatakan eksplisit di baris
 * status dan per satuan di strip, tidak pernah diam-diam menjadi nol.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, RefreshCw, TriangleAlert, Phone } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, getBkWaConfig, isUnauthorized } from "@/lib/admin/api";
import {
  tanggalLocal,
  useModul,
  type ModulKey,
} from "@/lib/admin/moduleCounts";
import ContextStrip, { StatusBar, type StripUnit } from "@/components/admin/overview/ContextStrip";
import ChatAnalyticsPanel, {
  type ChatStatsState,
  type PeriodeStatistik,
} from "@/components/admin/overview/ChatAnalyticsPanel";
import type {
  ChatAnalyticsResponse,
  ChatInsightsResponse,
} from "@/lib/admin/types";

const LABEL_SUMBER: Record<ModulKey, string> = {
  berita: "Berita",
  pengumuman: "Pengumuman",
  agenda: "Agenda",
  guru: "Guru",
  fasilitas: "Fasilitas",
  ekstrakurikuler: "Ekstrakurikuler",
  galeri: "Galeri",
  bk: "Inbox BK",
  prestasi: "Pengajuan Prestasi",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function OverviewPage() {
  const modul = useModul();
  const { logout } = useAuth();
  const [chatStats, setChatStats] = useState<ChatStatsState>({ kind: "loading" });
  const [periode, setPeriode] = useState<PeriodeStatistik>("7");
  const [chatAttempt, setChatAttempt] = useState(0);

  // ---------- Mini ringkasan Chatbot-BK (WhatsApp Guru BK) ----------
  const [waSummary, setWaSummary] = useState<{
    aktif: boolean;
    jumlah: number;
    threshold: number;
    target: string;
    pengirim: string;
    status_agen: string;
    terakhir_kirim: string | null;
    total_terkirim: number;
  } | null>(null);
  const [waSummaryError, setWaSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBkWaConfig()
      .then((cfg) => {
        if (cancelled) return;
        setWaSummary({
          aktif: cfg.aktif,
          jumlah: cfg.jumlah_laporan_terbuka,
          threshold: cfg.threshold,
          target: cfg.target,
          pengirim: cfg.pengirim,
          status_agen: cfg.status_agen,
          terakhir_kirim: cfg.terakhir_kirim,
          total_terkirim: cfg.total_terkirim,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setWaSummaryError(err instanceof Error ? err.message : "Gagal memuat ringkasan WA.");
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // Statistik chatbot dipisah dari data modul karena kontrol periode (7/30 hari)
  // hanya boleh memicu refetch analytics, bukan seluruh halaman.
  useEffect(() => {
    let cancelled = false;

    async function muat() {
      const akhir = new Date();
      const mulai = new Date();
      mulai.setDate(akhir.getDate() - (Number(periode) - 1));

      const [chat, insight] = await Promise.allSettled([
        apiRequest<ChatAnalyticsResponse>(
          `/api/chat/analytics.php?dari=${tanggalLocal(mulai)}&sampai=${tanggalLocal(akhir)}`,
        ),
        apiRequest<ChatInsightsResponse>("/api/chat/insights.php"),
      ]);

      if (cancelled) return;

      if (chat.status === "rejected" && isUnauthorized(chat.reason)) {
        // Sesi kedaluwarsa: buang token, guard layout mengarahkan ke /login.
        logout();
        return;
      }

      if (chat.status === "fulfilled") {
        // Insight tidak kritis: gagal = tanpa insight, statistik tetap tampil.
        const terbaru =
          insight.status === "fulfilled" && insight.value.aktif.length > 0
            ? insight.value.aktif[0]
            : null;
        setChatStats({
          kind: "ok",
          analytics: chat.value,
          insightAktif: insight.status === "fulfilled" ? insight.value.aktif.length : 0,
          insightTerbaru: terbaru
            ? { id: terbaru.id, judul: terbaru.judul, isi: terbaru.isi }
            : null,
        });
      } else {
        setChatStats({
          kind: "error",
          message:
            chat.reason instanceof Error
              ? chat.reason.message
              : "Gagal memuat statistik chatbot.",
        });
      }
    }

    void muat();

    return () => {
      cancelled = true;
    };
  }, [periode, chatAttempt, logout]);

  // Status "memuat" dipicu dari aksi pengguna (ganti periode / muat ulang),
  // bukan dari dalam effect, supaya tidak ada render berantai.
  const gantiPeriode = useCallback((p: PeriodeStatistik) => {
    setChatStats({ kind: "loading" });
    setPeriode(p);
  }, []);

  const reload = useCallback(() => {
    setChatStats({ kind: "loading" });
    modul.reload();
    setChatAttempt((n) => n + 1);
  }, [modul]);

  /* ---------------------------- Strip konteks --------------------------- */
  const units: StripUnit[] = useMemo(() => {
    const metrik = chatStats.kind === "ok" ? chatStats.analytics.metrik : null;
    const chatState = chatStats.kind === "loading" ? "loading" : chatStats.kind;

    const bkBaru = (() => {
      if (modul.bk.kind === "loading") return { state: "loading" as const };
      if (modul.bk.kind === "error") {
        return { state: "error" as const, message: modul.bk.message };
      }
      const baru = modul.bk.value.filter((p) => p.status === "Baru").length;
      const diproses = modul.bk.value.filter((p) => p.status === "Diproses").length;
      const selesai = modul.bk.value.filter((p) => p.status === "Selesai").length;
      return {
        state: "ok" as const,
        value: formatNumber(baru),
        sub: `${formatNumber(diproses)} diproses · ${formatNumber(selesai)} selesai`,
      };
    })();

    const prestasi = (() => {
      if (modul.prestasi.kind === "loading") return { state: "loading" as const };
      if (modul.prestasi.kind === "error") {
        return { state: "error" as const, message: modul.prestasi.message };
      }
      return {
        state: "ok" as const,
        value: formatNumber(modul.prestasi.value.baru),
        sub: `${formatNumber(modul.prestasi.value.ditinjau)} sudah ditinjau`,
      };
    })();

    // Urutan mengikuti hierarki urgensi: tiga antrean manusia dulu, kesehatan
    // sistem terakhir. Lihat brief §4.
    return [
      {
        key: "bk",
        label: "Pesan BK Baru",
        state: bkBaru.state,
        value: bkBaru.state === "ok" ? bkBaru.value : null,
        sub: bkBaru.state === "ok" ? bkBaru.sub : null,
        message: bkBaru.state === "error" ? bkBaru.message : undefined,
      },
      {
        key: "eskalasi",
        label: "Perlu Intervensi",
        state: chatState,
        value: metrik ? `${formatNumber(metrik.persenEskalasi)}%` : null,
        sub: metrik ? `${formatNumber(metrik.eskalasi)} pesan perlu guru BK` : null,
        message: chatStats.kind === "error" ? chatStats.message : undefined,
      },
      {
        key: "prestasi",
        label: "Prestasi Menunggu",
        state: prestasi.state,
        value: prestasi.state === "ok" ? prestasi.value : null,
        sub: prestasi.state === "ok" ? prestasi.sub : null,
        message: prestasi.state === "error" ? prestigeMessage(prestasi.message) : undefined,
      },
      {
        key: "sesi",
        label: "Sesi Chatbot",
        state: chatState,
        value: metrik ? formatNumber(metrik.totalSesi) : null,
        sub: metrik
          ? `${formatNumber(metrik.aktifHariIni)} sesi hari ini · ${periode} hari`
          : null,
        message: chatStats.kind === "error" ? chatStats.message : undefined,
      },
    ];
  }, [modul.bk, modul.prestasi, chatStats, periode]);

  const catatanGagal = modul.failures;

  return (
    <div className="space-y-space-lg">
      <StatusBar
        terakhirDimuat={modul.loadedAt}
        memuat={modul.refreshing || chatStats.kind === "loading"}
        onReload={reload}
      >
        {catatanGagal.length > 0 ? (
          <p className="flex items-start gap-1.5 font-body-sm text-body-sm font-bold text-error">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Sebagian data gagal dimuat: {catatanGagal.map((f) => LABEL_SUMBER[f.key]).join(", ")}.
              Angka lain tetap berlaku; bagian yang gagal ditandai “Gagal”, bukan 0.
            </span>
          </p>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Semua sumber termuat. Angka berasal langsung dari database sekolah.
          </p>
        )}
      </StatusBar>

      <ContextStrip units={units} />

      <div className="grid items-stretch gap-space-lg xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,1fr)]">
        <ChatAnalyticsPanel
          state={chatStats}
          periode={periode}
          onPeriodeChange={gantiPeriode}
        />

        <section
          aria-label="Ringkasan Chatbot-BK untuk Guru BK"
          className="flex h-full flex-col rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"
        >
            <h2 className="mb-space-md flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Bot aria-hidden className="size-5" /></span>
              {waSummary?.pengirim ?? "Chatbot-BK"}
            </h2>
            {waSummaryError ? (
              <p className="font-body-sm text-body-sm text-on-error-container">
                {waSummaryError}
              </p>
            ) : waSummary === null ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Memuat…
              </p>
            ) : (
              <div className="flex-1 space-y-space-md">
                <div className="flex items-baseline justify-between gap-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Status
                  </span>
                  <span className={`font-body-sm text-body-sm font-bold ${
                    waSummary.aktif ? "text-primary" : "text-on-surface-variant"
                  }`}>
                    {waSummary.aktif ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                {waSummary.status_agen && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {waSummary.status_agen}
                  </p>
                )}
                <div className="flex items-baseline justify-between gap-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Kasus perlu intervensi
                  </span>
                  <span
                    className={`font-body-md text-body-md font-bold ${
                      waSummary.jumlah >= waSummary.threshold
                        ? "text-error"
                        : "text-on-surface"
                    }`}
                  >
                    {waSummary.jumlah} / {waSummary.threshold}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Nomor WhatsApp Guru BK
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface truncate">
                    {waSummary.target || "—"}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-space-sm">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Pesan terkirim
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface truncate">
                    {waSummary.total_terkirim}
                    {waSummary.terakhir_kirim ? ` · ${waSummary.terakhir_kirim}` : ""}
                  </span>
                </div>
                {waSummary.jumlah >= waSummary.threshold && waSummary.aktif && (
                  <p className="font-body-sm text-body-sm text-error">
                    ⚠ Ambang tercapai — {waSummary.pengirim} akan menghubungi Guru BK
                    otomatis saat laporan baru masuk.
                  </p>
                )}
              </div>
            )}
            <Link
              href="/admin/bk"
              className="mt-space-lg inline-flex min-h-11 items-center gap-1 self-start font-label-sm text-label-sm font-bold text-primary underline underline-offset-4 hover:text-secondary"
            >
              <Phone className="h-3.5 w-3.5" />
              Buka ruang {waSummary?.pengirim ?? "Chatbot-BK"}
            </Link>
        </section>
      </div>

      <p className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
        <RefreshCw aria-hidden className="h-3.5 w-3.5" />
        Gunakan muat ulang untuk mengambil pembaruan terbaru dari sumber data sekolah.
      </p>
    </div>
  );
}

/** Pesan error sumber disingkat agar tetap muat di strip. */
function prestigeMessage(message: string | undefined): string {
  if (!message) return "Data tidak dapat dimuat.";
  return message.length > 48 ? `${message.slice(0, 48)}…` : message;
}
