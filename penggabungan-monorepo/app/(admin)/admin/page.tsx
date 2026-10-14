"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Building2,
  CalendarDays,
  GraduationCap,
  Images,
  Loader2,
  Megaphone,
  MessageSquareHeart,
  Newspaper,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import ChatStatsSection, {
  type ChatStatsState,
  type PeriodeStatistik,
} from "@/components/admin/overview/ChatStatsSection";
import OverviewHero from "@/components/admin/overview/OverviewHero";
import BkQueueCard, { type BkRingkasState } from "@/components/admin/overview/BkQueueCard";
import AgendaMendatang, { type AgendaListState } from "@/components/admin/overview/AgendaMendatang";
import type {
  AgendaDTO,
  BeritaDTO,
  ChatAnalyticsResponse,
  ChatInsightsResponse,
  FasilitasDTO,
  GaleriDTO,
  GuruDTO,
  PesanBKDTO,
  PengumumanDTO,
} from "@/lib/admin/types";

type CardState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; value: string; hint?: string };

type Cards = Record<string, CardState>;

const INITIAL_CARDS: Cards = {
  berita: { kind: "loading" },
  pengumuman: { kind: "loading" },
  agenda: { kind: "loading" },
  guru: { kind: "loading" },
  fasilitas: { kind: "loading" },
  galeri: { kind: "loading" },
};

/**
 * Enam modul konten inti (adaptasi "Website Content Grid" pada
 * template-and-promt/new-overview.md). KPI chatbot/BK/insight tidak lagi
 * jadi kartu di sini — dirender baris "Metrik utama" tersendiri.
 */
const CMS_META: { id: string; label: string; icon: LucideIcon; href: string }[] = [
  { id: "berita", label: "Berita", icon: Newspaper, href: "/admin/berita" },
  { id: "pengumuman", label: "Pengumuman", icon: Megaphone, href: "/admin/pengumuman" },
  { id: "agenda", label: "Agenda", icon: CalendarDays, href: "/admin/agenda" },
  { id: "guru", label: "Direktori Guru", icon: GraduationCap, href: "/admin/guru" },
  { id: "fasilitas", label: "Fasilitas", icon: Building2, href: "/admin/fasilitas" },
  { id: "galeri", label: "Galeri", icon: Images, href: "/admin/galeri" },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/** Format ISO YYYY-MM-DD dari objek Date lokal (cocok kolom tglMulai). */
function isoTanggal(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Tanggal hari ini zona lokal, format ISO YYYY-MM-DD. */
function todayISO(): string {
  return isoTanggal(new Date());
}

export default function OverviewPage() {
  const [cards, setCards] = useState<Cards>(INITIAL_CARDS);
  const [bkRingkas, setBkRingkas] = useState<BkRingkasState>({ kind: "loading" });
  const [agendaMendatang, setAgendaMendatang] = useState<AgendaListState>({ kind: "loading" });
  const [chatStats, setChatStats] = useState<ChatStatsState>({ kind: "loading" });
  const [periode, setPeriode] = useState<PeriodeStatistik>("7");
  const [attempt, setAttempt] = useState(0);
  const { logout } = useAuth();

  useEffect(() => {
    let cancelled = false;

    // Satu request per resource; per-card error, jangan samakan dengan sukses.
    // Backend belum punya endpoint agregasi summary (rencana B-lanjutan).
    void Promise.allSettled([
      apiRequest<BeritaDTO[]>("/api/berita/index.php"),
      apiRequest<PengumumanDTO[]>("/api/pengumuman/index.php"),
      apiRequest<PengumumanDTO[]>("/api/pengumuman/index.php?beranda=1"),
      apiRequest<AgendaDTO[]>("/api/agenda/index.php"),
      apiRequest<GuruDTO[]>("/api/guru/index.php"),
      apiRequest<FasilitasDTO[]>("/api/fasilitas/index.php"),
      apiRequest<GaleriDTO[]>("/api/galeri/index.php"),
      apiRequest<PesanBKDTO[]>("/api/bk/index.php"),
    ]).then((results) => {
      if (cancelled) return;

      const expired = results.some(
        (r) => r.status === "rejected" && isUnauthorized(r.reason),
      );
      if (expired) {
        // Sesi kedaluwarsa: buang token, guard layout mengarahkan ke /login.
        logout();
        return;
      }

      const [berita, pengumuman, pengumumanBeranda, agenda, guru, fasilitas, galeri, bk] =
        results;

      const errMessage = (r: PromiseSettledResult<unknown>): string =>
        r.status === "rejected" && r.reason instanceof Error
          ? r.reason.message
          : "Gagal memuat data.";

      const countCard = (r: PromiseSettledResult<unknown[]>): CardState =>
        r.status === "fulfilled"
          ? { kind: "ok", value: formatNumber(r.value.length) }
          : { kind: "error", message: errMessage(r) };

      const next: Cards = {};

      if (berita.status === "fulfilled") {
        const terbit = berita.value.filter((b) => b.status === "terbit").length;
        const draft = berita.value.filter((b) => b.status === "draft").length;
        next.berita = {
          kind: "ok",
          value: formatNumber(terbit),
          hint: `${formatNumber(draft)} draft`,
        };
      } else {
        next.berita = { kind: "error", message: errMessage(berita) };
      }

      if (pengumuman.status === "fulfilled" && pengumumanBeranda.status === "fulfilled") {
        next.pengumuman = {
          kind: "ok",
          value: formatNumber(pengumuman.value.length),
          hint: `${formatNumber(pengumumanBeranda.value.length)} tampil di beranda`,
        };
      } else {
        const failed = pengumuman.status === "rejected" ? pengumuman : pengumumanBeranda;
        next.pengumuman = { kind: "error", message: errMessage(failed) };
      }

      if (agenda.status === "fulfilled") {
        const batas = todayISO();
        // Agenda mendatang (tglMulai >= hari ini) untuk kartu Agenda Overview.
        const keDepan = agenda.value
          .filter((a) => (a.tglMulai ?? "") >= batas)
          .sort((a, b) => (a.tglMulai ?? "").localeCompare(b.tglMulai ?? ""));
        next.agenda = {
          kind: "ok",
          value: formatNumber(agenda.value.length),
          hint: `${formatNumber(keDepan.length)} mendatang`,
        };
        setAgendaMendatang({
          kind: "ok",
          items: keDepan.slice(0, 5).map((a) => ({
            id: a.id,
            judul: a.judul,
            tglMulai: a.tglMulai,
            badge: a.badge,
          })),
        });
      } else {
        next.agenda = { kind: "error", message: errMessage(agenda) };
        setAgendaMendatang({ kind: "error", message: errMessage(agenda) });
      }

      next.guru = countCard(guru);
      next.fasilitas = countCard(fasilitas);
      next.galeri = countCard(galeri);

      // Ringkasan inbox BK (anonymized): hanya jumlah per status — nama dan
      // isi pesan siswa tidak dirender di halaman Overview (privasi PRD §5);
      // detail pesan tetap eksklusif di /admin/bk.
      if (bk.status === "fulfilled") {
        setBkRingkas({
          kind: "ok",
          baru: bk.value.filter((p) => p.status === "Baru").length,
          diproses: bk.value.filter((p) => p.status === "Diproses").length,
          selesai: bk.value.filter((p) => p.status === "Selesai").length,
        });
      } else {
        setBkRingkas({ kind: "error", message: errMessage(bk) });
      }

      setCards(next);
    });

    return () => {
      cancelled = true;
    };
  }, [attempt, logout]);

  // Statistik chatbot + insight di effect terpisah: kontrol periode (7/30 hari)
  // pada kartu Tren cukup memicu refetch analytics di sini, tanpa memuat ulang
  // kartu konten. Query dari/sampai ikut dikirim ke /api/chat/analytics.php.
  useEffect(() => {
    let cancelled = false;
    setChatStats({ kind: "loading" });

    const akhir = new Date();
    const mulai = new Date();
    mulai.setDate(akhir.getDate() - (Number(periode) - 1));

    void Promise.allSettled([
      apiRequest<ChatAnalyticsResponse>(
        `/api/chat/analytics.php?dari=${isoTanggal(mulai)}&sampai=${isoTanggal(akhir)}`,
      ),
      apiRequest<ChatInsightsResponse>("/api/chat/insights.php"),
    ]).then(([chat, insight]) => {
      if (cancelled) return;

      if (chat.status === "rejected" && isUnauthorized(chat.reason)) {
        // Sesi kedaluwarsa: buang token, guard layout mengarahkan ke /login.
        logout();
        return;
      }

      const errMessage = (r: PromiseSettledResult<unknown>): string =>
        r.status === "rejected" && r.reason instanceof Error
          ? r.reason.message
          : "Gagal memuat statistik chatbot.";

      if (chat.status === "fulfilled") {
        // Insight tidak kritis: gagal = tanpa insight, statistik tetap tampil.
        const terbaru =
          insight.status === "fulfilled" && insight.value.aktif.length > 0
            ? insight.value.aktif[0]
            : null;
        setChatStats({
          kind: "ok",
          analytics: chat.value,
          insightAktif:
            insight.status === "fulfilled" ? insight.value.aktif.length : 0,
          insightTerbaru: terbaru
            ? { id: terbaru.id, judul: terbaru.judul, isi: terbaru.isi }
            : null,
        });
      } else {
        setChatStats({ kind: "error", message: errMessage(chat) });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [attempt, periode, logout]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  const metrik = chatStats.kind === "ok" ? chatStats.analytics.metrik : null;
  const insightAktif = chatStats.kind === "ok" ? chatStats.insightAktif : null;
  const statusChat: "loading" | "error" | "ok" =
    chatStats.kind === "ok" ? "ok" : chatStats.kind;
  const statusBk: "loading" | "error" | "ok" =
    bkRingkas.kind === "ok" ? "ok" : bkRingkas.kind;
  const pesanChat = chatStats.kind === "error" ? chatStats.message : "";
  const pesanBk = bkRingkas.kind === "error" ? bkRingkas.message : "";

  // Baris KPI utama (adaptasi KPI-row template, angka dari backend nyata).
  const kpiDefs: {
    id: string;
    label: string;
    icon: LucideIcon;
    status: "loading" | "error" | "ok";
    value?: string;
    hint?: string;
    message: string;
  }[] = [
    {
      id: "sesi",
      label: "Sesi Chatbot",
      icon: Bot,
      status: statusChat,
      value: metrik ? formatNumber(metrik.totalSesi) : undefined,
      hint: metrik ? `${metrik.aktifHariIni} sesi hari ini · ${periode} hari` : undefined,
      message: pesanChat,
    },
    {
      id: "dijawab",
      label: "Dijawab AI",
      icon: Sparkles,
      status: statusChat,
      value: metrik ? `${metrik.persenDijawab}%` : undefined,
      hint: metrik
        ? `${formatNumber(metrik.dijawab)} dari ${formatNumber(metrik.totalJawaban)} jawaban`
        : undefined,
      message: pesanChat,
    },
    {
      id: "eskalasi",
      label: "Butuh Intervensi",
      icon: TriangleAlert,
      status: statusChat,
      value: metrik ? `${metrik.persenEskalasi}%` : undefined,
      hint: metrik ? `${formatNumber(metrik.eskalasi)} pesan eskalasi` : undefined,
      message: pesanChat,
    },
    {
      id: "bk",
      label: "Pesan BK Baru",
      icon: MessageSquareHeart,
      status: statusBk,
      value: bkRingkas.kind === "ok" ? formatNumber(bkRingkas.baru) : undefined,
      hint:
        bkRingkas.kind === "ok"
          ? `${formatNumber(bkRingkas.diproses)} diproses · ${formatNumber(bkRingkas.selesai)} selesai`
          : undefined,
      message: pesanBk,
    },
  ];

  return (
    <div className="space-y-space-lg">
      <OverviewHero
        sesiHariIni={metrik ? metrik.aktifHariIni : null}
        insightAktif={insightAktif}
        bkBaru={bkRingkas.kind === "ok" ? bkRingkas.baru : null}
        onReload={reload}
      />

      <section aria-label="Metrik utama" className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        {kpiDefs.map(({ id, label, icon: Icon, status, value, hint, message }) => (
          <article
            key={id}
            aria-live="polite"
            className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-label-md text-label-md font-bold text-on-surface-variant">{label}</p>
              <Icon aria-hidden className="h-5 w-5 shrink-0 text-secondary" />
            </div>

            {status === "loading" && (
              <p className="mt-space-sm flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                Memuat…
              </p>
            )}

            {status === "error" && (
              <div className="mt-space-sm space-y-1">
                <p className="flex items-center gap-1.5 font-body-sm text-body-sm font-bold text-error">
                  <AlertTriangle aria-hidden className="h-4 w-4" />
                  Gagal memuat
                </p>
                <p className="break-words font-body-sm text-body-sm text-on-surface-variant">
                  {message}
                </p>
              </div>
            )}

            {status === "ok" && (
              <div className="mt-space-sm">
                <p className="tabular-nums font-headline-lg text-headline-lg font-bold text-primary">
                  {value}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{hint}</p>
              </div>
            )}
          </article>
        ))}
      </section>

      <section
        aria-label="Ringkasan modul konten"
        className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-3"
      >
        {CMS_META.map(({ id, label, icon: Icon, href }) => {
          const state = cards[id] ?? { kind: "loading" as const };

          return (
            <article
              key={id}
              aria-live="polite"
              className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={href}
                  className="rounded font-label-md text-label-md font-bold text-on-surface-variant underline-offset-4 hover:text-primary hover:underline"
                >
                  {label}
                </Link>
                <Icon aria-hidden className="h-5 w-5 shrink-0 text-secondary" />
              </div>

              {state.kind === "loading" && (
                <p className="mt-space-sm flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  Memuat…
                </p>
              )}

              {state.kind === "error" && (
                <div className="mt-space-sm space-y-1">
                  <p className="flex items-center gap-1.5 font-body-sm text-body-sm font-bold text-error">
                    <AlertTriangle aria-hidden className="h-4 w-4" />
                    Gagal memuat
                  </p>
                  <p className="break-words font-body-sm text-body-sm text-on-surface-variant">
                    {state.message}
                  </p>
                </div>
              )}

              {state.kind === "ok" && (
                <div className="mt-space-sm">
                  <p className="tabular-nums font-headline-lg text-headline-lg font-bold text-primary">
                    {state.value}
                  </p>
                  {state.hint && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {state.hint}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <ChatStatsSection
        state={chatStats}
        periode={periode}
        onPeriodeChange={setPeriode}
      />

      <section aria-label="Konseling dan agenda" className="grid grid-cols-1 gap-space-md lg:grid-cols-12">
        <div className="lg:col-span-5">
          <BkQueueCard state={bkRingkas} />
        </div>
        <div className="lg:col-span-7">
          <AgendaMendatang state={agendaMendatang} />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Modul konten (Berita, Pengumuman, Agenda, Guru, Fasilitas, Galeri, Jadwal, Pesan BK,
          Riwayat Chatbot) sudah aktif. Arsip, Pengajuan Prestasi, dan Pengaturan dibangun
          bertahap sesuai rencana. Item menu yang nonaktif di sidebar menandai modul yang
          belum tersedia.
        </p>
      </section>
    </div>
  );
}

