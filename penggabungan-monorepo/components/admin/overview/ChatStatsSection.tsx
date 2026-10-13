"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  FileText,
  MessageSquareHeart,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { ChatAnalyticsResponse, ChatInsightsResponse } from "@/lib/admin/types";

/**
 * Seksi statistik chatbot di halaman Overview admin.
 * Adaptasi tata letak template-and-promt/stats-template.txt (grid kartu +
 * grafik tren + aksi cepat + sorotan insight) ke design system dashboard:
 * token surface dan space (mis. surface-container, space-lg), ikon lucide-react,
 * tanpa shadcn/recharts.
 * Grafik digambar murni SVG supaya tidak menambah dependensi.
 * Semua angka dari props (respons backend nyata), bukan hardcode.
 */
export type ChatStatsState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      analytics: ChatAnalyticsResponse;
      insightAktif: number;
      insightTerbaru: { id: number; judul: string; isi: string } | null;
    };

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/** Label sumbu ringkas: "2026-10-12" -> "12/10". */
function labelTanggal(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}` : iso;
}

/** Grafik garis tren sesi, SVG murni (peran RevenueChart pada template). */
function TrenMini({ tren }: { tren: { tanggal: string; sesi: number }[] }) {
  const W = 520;
  const H = 150;
  const PAD = 26;
  const data = tren.slice(-14);
  const maks = Math.max(1, ...data.map((d) => d.sesi));
  const x = (i: number) =>
    data.length <= 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (data.length - 1);
  const y = (v: number) => H - PAD - (v / maks) * (H - PAD * 2);
  const garis = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.sesi).toFixed(1)}`)
    .join(" ");
  const area =
    data.length > 0
      ? `${garis} L${x(data.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`
      : "";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Grafik tren sesi chatbot 14 hari terakhir" className="h-36 w-full">
      {[0.33, 0.66, 1].map((f) => (
        <line key={f} x1={PAD} x2={W - PAD} y1={y(maks * f)} y2={y(maks * f)}
          stroke="currentColor" strokeOpacity={0.12} />
      ))}
      {area && <path d={area} fill="#2563eb" fillOpacity={0.12} stroke="none" />}
      {garis && (
        <path d={garis} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinejoin="round" />
      )}
      {data.map((d, i) => (
        <circle key={`${d.tanggal}-${i}`} cx={x(i)} cy={y(d.sesi)} r={3} fill="#2563eb">
          <title>{`${d.tanggal}: ${d.sesi} sesi`}</title>
        </circle>
      ))}
      {data.length > 0 && (
        <>
          <text x={PAD} y={H - 8} fontSize={10} fill="currentColor" opacity={0.7}>
            {labelTanggal(data[0].tanggal)}
          </text>
          <text x={W - PAD} y={H - 8} fontSize={10} fill="currentColor" opacity={0.7} textAnchor="end">
            {labelTanggal(data[data.length - 1].tanggal)}
          </text>
        </>
      )}
    </svg>
  );
}

const WARNA_BAR = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#dc2626"];

/** Bar horizontal kategori (peran CategoryRankChart pada template). */
function KategoriMini({ kategori }: { kategori: { kategori: string; jumlah: number }[] }) {
  const top = kategori.slice(0, 5);
  const maks = Math.max(1, ...top.map((k) => k.jumlah));
  if (top.length === 0) {
    return (
      <p className="font-body-sm text-body-sm italic text-on-surface-variant">
        Belum ada klasifikasi kategori pada periode ini.
      </p>
    );
  }
  return (
    <ol className="space-y-space-sm">
      {top.map((k, i) => (
        <li key={k.kategori}>
          <div className="flex items-baseline justify-between gap-2 font-body-sm text-body-sm">
            <span className="truncate font-bold text-on-surface">{k.kategori}</span>
            <span className="shrink-0 tabular-nums text-on-surface-variant">{formatNumber(k.jumlah)}</span>
          </div>
          <div role="img" aria-label={`${k.kategori}: ${k.jumlah} pertanyaan`}
            className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container">
            <div className="h-full rounded-full" style={{
              width: `${Math.max(4, Math.round((k.jumlah / maks) * 100))}%`,
              backgroundColor: WARNA_BAR[i % WARNA_BAR.length],
            }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ChatStatsSection({ state }: { state: ChatStatsState }) {
  const skeleton = useMemo(
    () => (
      <div aria-hidden className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}
            className="h-28 animate-pulse rounded-2xl border border-surface-container bg-surface-container-lowest" />
        ))}
      </div>
    ),
    [],
  );

  if (state.kind === "loading") {
    return <section aria-label="Statistik chatbot">{skeleton}</section>;
  }

  if (state.kind === "error") {
    return (
      <section aria-label="Statistik chatbot"
        className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
        <p className="font-body-sm text-body-sm font-bold text-error">
          Statistik chatbot gagal dimuat
        </p>
        <p className="mt-1 break-words font-body-sm text-body-sm text-on-surface-variant">
          {state.message} Detail lengkap tetap tersedia di halaman Analytics.
        </p>
        <Link href="/admin/chat"
          className="mt-space-sm inline-flex items-center gap-1 font-label-md text-label-md font-bold text-primary hover:underline">
          Buka Analytics Chatbot
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  const { analytics, insightAktif, insightTerbaru } = state;
  const m = analytics.metrik;
  const tren14 = analytics.tren.slice(-14);
  const totalSesi14 = tren14.reduce((acc, d) => acc + d.sesi, 0);
  const kartu = [
    { label: "Sesi Chatbot", nilai: formatNumber(m.totalSesi),
      hint: `${m.aktifHariIni} sesi hari ini`, icon: Bot },
    { label: "Dijawab AI", nilai: `${m.persenDijawab}%`,
      hint: `${formatNumber(m.dijawab)} dari ${formatNumber(m.totalJawaban)}`, icon: MessageSquareHeart },
    { label: "Butuh Intervensi", nilai: `${m.persenEskalasi}%`,
      hint: `${formatNumber(m.eskalasi)} eskalasi`, icon: TriangleAlert },
    { label: "Insight Aktif", nilai: formatNumber(insightAktif),
      hint: "menunggu tindak lanjut", icon: Sparkles },
  ];

  return (
    <section aria-label="Statistik chatbot" className="space-y-space-md">
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        {kartu.map(({ label, nilai, hint, icon: Icon }) => (
          <article key={label}
            className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm transition-colors hover:border-primary/40">
            <div className="flex items-center justify-between gap-2">
              <p className="font-label-md text-label-md font-bold text-on-surface-variant">{label}</p>
              <Icon aria-hidden className="h-5 w-5 shrink-0 text-secondary" />
            </div>
            <p className="mt-space-sm tabular-nums font-headline-lg text-headline-lg font-bold text-primary">
              {nilai}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{hint}</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-3">
        <article className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-title-md text-title-md font-bold text-on-surface">Tren Sesi Chatbot</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                14 hari terakhir · {formatNumber(totalSesi14)} sesi
              </p>
            </div>
            <Link href="/admin/chat"
              className="inline-flex items-center gap-1 font-label-md text-label-md font-bold text-primary hover:underline">
              Lihat analytics
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-space-sm text-on-surface-variant">
            {tren14.length === 0 ? (
              <p className="font-body-sm text-body-sm italic text-on-surface-variant">
                Belum ada sesi chatbot pada periode ini.
              </p>
            ) : (
              <TrenMini tren={tren14} />
            )}
          </div>
        </article>

        <article className="flex flex-col gap-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
          <div>
            <h2 className="font-title-md text-title-md font-bold text-on-surface">Aksi Cepat</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Tindak lanjut chatbot tanpa membuka banyak halaman.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-space-sm">
            <Link href="/admin/chat"
              className="inline-flex items-center justify-center gap-space-xs rounded-lg bg-primary px-space-md py-2.5 font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-primary-container">
              <Bot aria-hidden className="h-4 w-4" />
              Buka Analytics Chatbot
            </Link>
            <Link href="/admin/bk"
              className="inline-flex items-center justify-center gap-space-xs rounded-lg border border-outline-variant px-space-md py-2.5 font-label-md text-label-md font-bold text-primary transition-colors hover:bg-surface-container">
              <FileText aria-hidden className="h-4 w-4" />
              Periksa Pesan BK
            </Link>
          </div>
          {insightTerbaru ? (
            <div className="rounded-xl bg-surface-container p-space-md">
              <p className="font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                Insight terbaru
              </p>
              <p className="mt-1 line-clamp-2 font-body-sm text-body-sm font-bold text-on-surface">
                {insightTerbaru.judul}
              </p>
              <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                {insightTerbaru.isi}
              </p>
            </div>
          ) : (
            <p className="font-body-sm text-body-sm italic text-on-surface-variant">
              Belum ada insight aktif. Generate dari halaman Analytics.
            </p>
          )}
        </article>
      </div>

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-2">
        <article className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
          <h2 className="font-title-md text-title-md font-bold text-on-surface">Kategori Teratas</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Topik tersering · {analytics.periode.dari} s.d. {analytics.periode.sampai}
          </p>
          <div className="mt-space-sm">
            <KategoriMini kategori={analytics.kategori} />
          </div>
        </article>
        <article className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
          <h2 className="font-title-md text-title-md font-bold text-on-surface">Sentimen & Konteks</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Hasil klasifikasi otomatis pesan user.
          </p>
          <dl className="mt-space-sm grid grid-cols-3 gap-space-sm text-center">
            {(
              [
                ["Positif", analytics.sentimen.positif, "text-tertiary"],
                ["Netral", analytics.sentimen.netral, "text-on-surface-variant"],
                ["Negatif", analytics.sentimen.negatif, "text-error"],
              ] as const
            ).map(([label, nilai, warna]) => (
              <div key={label} className="rounded-xl bg-surface-container p-space-md">
                <dt className="font-label-sm text-label-sm font-bold uppercase tracking-wide text-on-surface-variant">
                  {label}
                </dt>
                <dd className={`tabular-nums font-headline-md text-headline-md font-bold ${warna}`}>
                  {formatNumber(nilai)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">
            {formatNumber(m.luarKonteks)} pertanyaan di luar konteks ({m.persenLuarKonteks}%)
            {analytics.top.length > 0
              ? ` · "${analytics.top[0].pertanyaan.slice(0, 60)}" diulang ${analytics.top[0].jumlah}x.`
              : "."}
          </p>
        </article>
      </div>
    </section>
  );
}

export type { ChatAnalyticsResponse, ChatInsightsResponse };





