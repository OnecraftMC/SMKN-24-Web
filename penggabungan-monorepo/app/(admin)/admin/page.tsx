"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  GraduationCap,
  Images,
  Loader2,
  Megaphone,
  MessageSquareHeart,
  Newspaper,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import type {
  AgendaDTO,
  BeritaDTO,
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
  bk: { kind: "loading" },
};

const CARD_META: { id: string; label: string; icon: LucideIcon; href: string }[] = [
  { id: "berita", label: "Berita", icon: Newspaper, href: "/admin/berita" },
  { id: "pengumuman", label: "Pengumuman", icon: Megaphone, href: "/admin/pengumuman" },
  { id: "agenda", label: "Agenda", icon: CalendarDays, href: "/admin/agenda" },
  { id: "guru", label: "Direktori Guru", icon: GraduationCap, href: "/admin/guru" },
  { id: "fasilitas", label: "Fasilitas", icon: Building2, href: "/admin/fasilitas" },
  { id: "galeri", label: "Galeri", icon: Images, href: "/admin/galeri" },
  { id: "bk", label: "Pesan BK Baru", icon: MessageSquareHeart, href: "/admin/bk" },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/** Tanggal hari ini zona lokal, format ISO YYYY-MM-DD (m cocok kolom tglMulai). */
function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function OverviewPage() {
  const [cards, setCards] = useState<Cards>(INITIAL_CARDS);
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
        const mendatang = agenda.value.filter((a) => (a.tglMulai ?? "") >= batas).length;
        next.agenda = {
          kind: "ok",
          value: formatNumber(agenda.value.length),
          hint: `${formatNumber(mendatang)} mendatang`,
        };
      } else {
        next.agenda = { kind: "error", message: errMessage(agenda) };
      }

      next.guru = countCard(guru);
      next.fasilitas = countCard(fasilitas);
      next.galeri = countCard(galeri);

      const inboxCard = (
        r: PromiseSettledResult<{ status: string }[]>,
      ): CardState => {
        if (r.status === "fulfilled") {
          const baru = r.value.filter((p) => p.status === "Baru").length;
          return { kind: "ok", value: formatNumber(baru), hint: "status Baru" };
        }
        return { kind: "error", message: errMessage(r) };
      };

      next.bk = inboxCard(bk);

      setCards(next);
    });

    return () => {
      cancelled = true;
    };
  }, [attempt, logout]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Overview</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Ringkasan kondisi konten dan inbox — data langsung dari backend.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-space-xs rounded-lg bg-primary px-space-md py-2.5 font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-primary-container"
        >
          <RefreshCw aria-hidden className="h-4 w-4" />
          Muat ulang
        </button>
      </header>

      <section
        aria-label="Ringkasan konten dan inbox"
        className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4"
      >
        {CARD_META.map(({ id, label, icon: Icon, href }) => {
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

      <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Modul konten (Berita, Pengumuman, Agenda, Guru, Fasilitas, Galeri, Jadwal, Pesan BK)
          sudah aktif. Arsip, Pengajuan Prestasi, Riwayat Chatbot, dan Pengaturan dibangun
          bertahap sesuai rencana. Item menu yang nonaktif di sidebar menandai modul yang
          belum tersedia.
        </p>
      </section>
    </div>
  );
}

