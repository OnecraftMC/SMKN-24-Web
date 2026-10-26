"use client";

/**
 * Halaman Overview dashboard admin — “Meja Moderasi”.
 *
 * Lima detik pertama harus menjawab: ada siswa yang perlu perhatian? ada
 * konten yang menunggu terbit atau tidak tayang? apa satu hal pertama yang
 * harus dibuka? Karena itu halaman ini bekerja sebagai meja kerja, bukan
 * panggung analitik: strip keadaan → antrean keputusan → ledger konten →
 * hari ini & aktivitas → satu baris kesehatan sistem.
 *
 * Analitik chatbot lengkap tinggal di `/admin/chat`; di sini hanya denyut
 * 7 hari di kaki halaman. Semua angka berasal dari `ModulProvider` (tanpa
 * request baru) plus dua endpoint yang sudah ada (`chat/analytics.php` dan
 * `bk/wa-config.php`). Kegagalan parsial dinyatakan per sumber — tidak
 * pernah diam-diam menjadi nol.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, getBkWaConfig, isUnauthorized } from "@/lib/admin/api";
import { tanggalLocal, useModul, type ModulKey } from "@/lib/admin/moduleCounts";
import ContextStrip, { StatusBar, type StripUnit } from "@/components/admin/overview/ContextStrip";
import DecisionQueues from "@/components/admin/overview/DecisionQueues";
import ContentLedger from "@/components/admin/overview/ContentLedger";
import AgendaActivity from "@/components/admin/overview/AgendaActivity";
import SystemHealth from "@/components/admin/overview/SystemHealth";
import ChatAnalyticsChart, {
  type StatistikChatState,
} from "@/components/admin/overview/ChatAnalyticsChart";
import { formatNumber } from "@/components/admin/overview/ringkasan";
import type { ChatAnalyticsResponse } from "@/lib/admin/types";

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

type RingkasanWA = {
  aktif: boolean;
  jumlah: number;
  threshold: number;
};

/** Periode kesehatan sistem dikunci 7 hari — rincian periode ada di /admin/chat. */
const HARI_STATISTIK = 7;

export default function OverviewPage() {
  const modul = useModul();
  const { logout } = useAuth();
  const [statistik, setStatistik] = useState<StatistikChatState>({ kind: "loading" });
  const [statistikAttempt, setStatistikAttempt] = useState(0);

  // ---------- Mini ringkasan Chatbot-BK (WhatsApp Guru BK) ----------
  const [waSummary, setWaSummary] = useState<RingkasanWA | null>(null);
  const [waError, setWaError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBkWaConfig()
      .then((cfg) => {
        if (cancelled) return;
        setWaSummary({
          aktif: cfg.aktif,
          jumlah: cfg.jumlah_laporan_terbuka,
          threshold: cfg.threshold,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setWaError(err instanceof Error ? err.message : "Gagal memuat ringkasan WA.");
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function muat() {
      const akhir = new Date();
      const mulai = new Date();
      mulai.setDate(akhir.getDate() - (HARI_STATISTIK - 1));

      try {
        const data = await apiRequest<ChatAnalyticsResponse>(
          `/api/chat/analytics.php?dari=${tanggalLocal(mulai)}&sampai=${tanggalLocal(akhir)}`,
        );
        if (!cancelled) {
          setStatistik({
            kind: "ok",
            metrik: data.metrik,
            tren: data.tren,
          });
        }
      } catch (err) {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          // Sesi kedaluwarsa: buang token, guard layout mengarahkan ke /login.
          logout();
          return;
        }
        setStatistik({
          kind: "error",
          message:
            err instanceof Error ? err.message : "Gagal memuat statistik chatbot.",
        });
      }
    }

    void muat();

    return () => {
      cancelled = true;
    };
  }, [statistikAttempt, logout]);

  const reload = useCallback(() => {
    setStatistik({ kind: "loading" });
    modul.reload();
    setStatistikAttempt((n) => n + 1);
  }, [modul]);

  /* ---------------------------- Strip keadaan --------------------------- */
  const units: StripUnit[] = useMemo(() => {
    const bk = (() => {
      if (modul.bk.kind === "loading") return { state: "loading" as const };
      if (modul.bk.kind === "error") {
        return { state: "error" as const, message: modul.bk.message };
      }
      const baru = modul.bk.value.filter((pesan) => pesan.status === "Baru");
      const perlu = baru.filter((pesan) => pesan.butuhPerhatian).length;
      const diproses = modul.bk.value.filter((pesan) => pesan.status === "Diproses").length;
      return {
        state: "ok" as const,
        value: formatNumber(baru.length),
        sub: `${formatNumber(perlu)} perlu perhatian · ${formatNumber(diproses)} diproses`,
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

    const berita = (() => {
      if (modul.berita.kind === "loading") return { state: "loading" as const };
      if (modul.berita.kind === "error") {
        return { state: "error" as const, message: modul.berita.message };
      }
      const draft = modul.berita.value.filter((item) => item.status === "draft");
      const lengkap = draft.filter(
        (item) => item.gambar && item.ringkasan && item.isi,
      ).length;
      return {
        state: "ok" as const,
        value: formatNumber(draft.length),
        sub: `${formatNumber(lengkap)} lengkap · ${formatNumber(draft.length - lengkap)} perlu dilengkapi`,
      };
    })();

    // “Tidak tayang di beranda” = pengumuman (dihitung dari selisih respons
    // beranda, bukan flag per item) + agenda yang ditandai tidak tampil.
    const tidakTayang = (() => {
      if (modul.pengumuman.kind === "error" || modul.agenda.kind === "error") {
        const message =
          modul.pengumuman.kind === "error"
            ? modul.pengumuman.message
            : modul.agenda.kind === "error"
              ? modul.agenda.message
              : "";
        return { state: "error" as const, message };
      }
      if (modul.pengumuman.kind === "loading" || modul.agenda.kind === "loading") {
        return { state: "loading" as const };
      }
      const pengumuman = Math.max(
        0,
        modul.pengumuman.value.items.length - modul.pengumuman.value.tampilBeranda,
      );
      const agenda = modul.agenda.value.filter(
        (item) => item.tampilBeranda === false,
      ).length;
      return {
        state: "ok" as const,
        value: formatNumber(pengumuman + agenda),
        sub: `${formatNumber(pengumuman)} pengumuman · ${formatNumber(agenda)} agenda`,
      };
    })();

    // Urutan mengikuti hierarki urgensi: tiga antrean manusia dulu, lalu
    // konten publik yang tidak tayang.
    return [
      {
        key: "bk",
        label: "Pesan BK Baru",
        state: bk.state,
        value: bk.state === "ok" ? bk.value : null,
        sub: bk.state === "ok" ? bk.sub : null,
        message: bk.state === "error" ? bk.message : undefined,
      },
      {
        key: "prestasi",
        label: "Prestasi Menunggu",
        state: prestasi.state,
        value: prestasi.state === "ok" ? prestasi.value : null,
        sub: prestasi.state === "ok" ? prestasi.sub : null,
        message: prestasi.state === "error" ? singkat(prestasi.message) : undefined,
      },
      {
        key: "berita",
        label: "Berita Draft",
        state: berita.state,
        value: berita.state === "ok" ? berita.value : null,
        sub: berita.state === "ok" ? berita.sub : null,
        message: berita.state === "error" ? berita.message : undefined,
      },
      {
        key: "tidak-tayang",
        label: "Tidak Tayang di Beranda",
        state: tidakTayang.state,
        value: tidakTayang.state === "ok" ? tidakTayang.value : null,
        sub: tidakTayang.state === "ok" ? tidakTayang.sub : null,
        message: tidakTayang.state === "error" ? tidakTayang.message : undefined,
      },
    ];
  }, [modul.bk, modul.prestasi, modul.berita, modul.pengumuman, modul.agenda]);

  const catatanGagal = modul.failures;
  const memuat = modul.refreshing || statistik.kind === "loading";

  return (
    <div className="space-y-space-lg">
      <StatusBar
        terakhirDimuat={modul.loadedAt}
        memuat={memuat}
        onReload={reload}
      >
        {catatanGagal.length > 0 ? (
          <p className="flex items-start gap-1.5 font-body-sm text-body-sm font-bold text-error">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Sebagian data gagal dimuat:{" "}
              {catatanGagal.map((f) => LABEL_SUMBER[f.key]).join(", ")}. Angka lain
              tetap berlaku; bagian yang gagal ditandai “Gagal”, bukan 0.
            </span>
          </p>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Semua sumber termuat. Angka berasal langsung dari database sekolah.
          </p>
        )}
      </StatusBar>

      <ContextStrip units={units} />

      <DecisionQueues
        bk={modul.bk}
        prestasi={modul.prestasi}
        berita={modul.berita}
      />

      <div className="grid items-start gap-space-lg xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
        <ContentLedger
          berita={modul.berita}
          pengumuman={modul.pengumuman}
          agenda={modul.agenda}
          guru={modul.guru}
          fasilitas={modul.fasilitas}
          ekstrakurikuler={modul.ekstrakurikuler}
          galeri={modul.galeri}
        />
        <AgendaActivity
          agenda={modul.agenda}
          berita={modul.berita}
          pengumuman={modul.pengumuman}
          bk={modul.bk}
          prestasi={modul.prestasi}
        />
      </div>

      <ChatAnalyticsChart state={statistik} />

      <SystemHealth statistik={statistik} wa={waSummary} waError={waError} />
    </div>
  );
}

/** Pesan error sumber disingkat agar tetap muat di strip. */
function singkat(message: string | undefined): string {
  if (!message) return "Data tidak dapat dimuat.";
  return message.length > 48 ? `${message.slice(0, 48)}…` : message;
}
