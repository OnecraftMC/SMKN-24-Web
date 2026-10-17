"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, CalendarDays, RefreshCw, Sparkles } from "lucide-react";

/**
 * Banner sapaan eksekutif Overview admin — adaptasi "Hero Executive Strip"
 * dari template-and-promt/new-overview.md ke design system dashboard:
 * gradien memakai token `primary`, tanpa tanggal/tabs hardcode, semua chip
 * angka berasal dari props (data backend nyata), jam realtime zona WIB
 * (pola Navbar E19). Tabs periode pada template TIDAK dirender palsu di sini
 * — kontrol periode yang sesungguhnya ada di kartu Tren statistik chatbot.
 */
export type OverviewHeroProps = {
  /** Sesi chatbot hari ini; null = analytics belum/tidak termuat. */
  sesiHariIni: number | null;
  /** Jumlah insight aktif; null = belum termuat. */
  insightAktif: number | null;
  /** Pesan BK berstatus Baru; null = inbox belum termuat. */
  bkBaru: number | null;
  onReload: () => void;
};

/** Sapaan berdasarkan jam lokal (dihitung dari jam WIB). */
function sapaan(jam: number): string {
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function OverviewHero({
  sesiHariIni,
  insightAktif,
  bkBaru,
  onReload,
}: OverviewHeroProps) {
  // Tanggal/jam baru dihitung di client (tanpa kejutan hydration): render
  // pertama sengaja "null" lalu diisi oleh effect.
  const [kini, setKini] = useState<Date | null>(null);
  useEffect(() => {
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      setKini(new Date());
      intervalId = window.setInterval(() => setKini(new Date()), 30_000);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, []);

  const tanggal = kini
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(kini)
    : "";
  const jamTeks = kini
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(kini)
    : "";
  const jamWIB = kini
    ? Number(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          hourCycle: "h23",
        }).format(kini),
      )
    : 12;

  const chips = [
    sesiHariIni !== null ? `${sesiHariIni} sesi chatbot hari ini` : null,
    bkBaru !== null ? `${bkBaru} pesan BK baru` : null,
    insightAktif !== null ? `${insightAktif} insight aktif` : null,
  ].filter((c): c is string => c !== null);

  return (
    <section
      aria-label="Sapaan dan ringkasan cepat"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/85 p-space-lg text-on-primary shadow-md md:p-10"
    >
      {/* dekorasi ornamen (steril, aria-hidden) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/5"
      />

      <div className="relative flex flex-col gap-space-md lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 font-label-sm text-label-sm font-bold">
              <Sparkles aria-hidden className="h-3.5 w-3.5" />
              Command Center
            </span>
            {(tanggal || jamTeks) && (
              <span className="flex items-center gap-1.5 font-body-sm text-body-sm text-on-primary">
                <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                {tanggal}
                {jamTeks && ` \u2022 ${jamTeks} WIB`}
              </span>
            )}
          </div>

          <h1 className="mt-space-sm font-headline-md text-headline-md font-bold">
            {kini ? sapaan(jamWIB) : "Halo"}, Administrator
          </h1>
          <p className="mt-1 max-w-2xl font-body-sm text-body-sm text-on-primary">
            Ringkasan langsung konten website, chatbot AI, dan inbox bimbingan
            konseling — seluruh angka dibaca dari backend, bukan data statis.
          </p>

          {chips.length > 0 && (
            <ul className="mt-space-sm flex flex-wrap gap-space-sm">
              {chips.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 font-label-sm text-label-sm font-bold"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-space-sm">
          <Link
            href="/admin/chat"
            className="inline-flex items-center gap-space-xs rounded-lg bg-white px-space-md py-2.5 font-label-md text-label-md font-bold text-primary shadow-sm transition-colors hover:bg-white/90"
          >
            <Bot aria-hidden className="h-4 w-4" />
            Analitik Chatbot
          </Link>
          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-space-xs rounded-lg border border-white/40 px-space-md py-2.5 font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-white/10"
          >
            <RefreshCw aria-hidden className="h-4 w-4" />
            Muat ulang
          </button>
        </div>
      </div>
    </section>
  );
}
