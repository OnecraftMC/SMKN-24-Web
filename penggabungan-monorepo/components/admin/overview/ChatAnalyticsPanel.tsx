"use client";

/**
 * Panel analisis chatbot — kolom konteks kanan halaman Overview.
 *
 * Ini panel utama, bukan pelengkap: tren sesi dengan onset perubahan ditandai,
 * porsi eskalasi, pembagian kategori, dan topik tersering. Kontrol periode
 * 7/30 hari tetap seperti sebelumnya dan hanya memicu pemuatan ulang
 * analytics, bukan seluruh halaman.
 *
 * Semua angka datang dari props (respons backend nyata). Grafik memakai token
 * `--color-chart-series`; nilai #2563eb yang sebelumnya di-hardcode di sini
 * sudah tidak ada lagi.
 */

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import type { ChatAnalyticsResponse, ChatInsightsResponse } from "@/lib/admin/types";

export type PeriodeStatistik = "7" | "30";

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

/** "2026-10-12" -> "12/10" untuk label sumbu. */
function labelTanggal(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}` : iso;
}

type Titik = { tanggal: string; sesi: number };

/**
 * Onset perubahan: titik yang offen berubah dari titik sebelumnya (naik ≥ 2×
 * atau jatuh ≥ 2×, termasuk bangun dari nol). Ditandai supaya admin tahu
 * kapan derivasi grafik berubah, bukan hanya melihat garis naik diam-diam.
 */
function tandaiOnset(tren: Titik[]): Map<number, "naik" | "turun"> {
  const onset = new Map<number, "naik" | "turun">();
  for (let i = 1; i < tren.length; i += 1) {
    const sebelum = tren[i - 1].sesi;
    const sekarang = tren[i].sesi;
    if (sebelum === 0 && sekarang > 0) onset.set(i, "naik");
    else if (sebelum > 0 && sekarang === 0) onset.set(i, "turun");
    else if (sebelum > 0 && sekarang >= sebelum * 2) onset.set(i, "naik");
    else if (sebelum > 0 && sekarang * 2 <= sebelum) onset.set(i, "turun");
  }
  return onset;
}

function TrenSesi({ tren }: { tren: Titik[] }) {
  const W = 320;
  const H = 150;
  const PAD = 22;
  const onset = tandaiOnset(tren);
  const maks = Math.max(1, ...tren.map((d) => d.sesi));

  const x = (i: number) =>
    tren.length <= 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (tren.length - 1);
  const y = (v: number) => H - PAD - (v / maks) * (H - PAD * 2);

  const garis = tren
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.sesi).toFixed(1)}`)
    .join(" ");
  const area =
    tren.length > 0
      ? `${garis} L${x(tren.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Grafik tren sesi chatbot, ${formatNumber(
        tren.reduce((a, d) => a + d.sesi, 0),
      )} sesi pada periode terpilih`}
      className="h-36 w-full text-on-surface-variant"
    >
      {[0.33, 0.66, 1].map((f) => (
        <line
          key={f}
          x1={PAD}
          x2={W - PAD}
          y1={y(maks * f)}
          y2={y(maks * f)}
          stroke="currentColor"
          strokeOpacity={0.14}
        />
      ))}

      {onset.size > 0 && (
        <>
          {[...onset.entries()].map(([i, arah]) => (
            <g key={`${tren[i].tanggal}-${i}`}>
              <line
                x1={x(i)}
                x2={x(i)}
                y1={PAD - 6}
                y2={H - PAD}
                stroke="currentColor"
                strokeOpacity={0.45}
                strokeDasharray="3 3"
              />
              <text x={x(i) + 3} y={PAD - 8} fontSize={9} fill="currentColor" opacity={0.8}>
                {arah === "naik" ? "▲" : "▼"}
              </text>
            </g>
          ))}
        </>
      )}

      {area && <path d={area} fill="var(--color-chart-series)" fillOpacity={0.12} />}
      {garis && (
        <path
          d={garis}
          fill="none"
          stroke="var(--color-chart-series)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      )}
      {tren.map((d, i) => (
        <circle key={`${d.tanggal}-${i}`} cx={x(i)} cy={y(d.sesi)} r={2.5} fill="var(--color-chart-series)">
          <title>{`${d.tanggal}: ${formatNumber(d.sesi)} sesi`}</title>
        </circle>
      ))}

      {tren.length > 0 && (
        <>
          <text x={PAD} y={H - 6} fontSize={9} fill="currentColor" opacity={0.75}>
            {labelTanggal(tren[0].tanggal)}
          </text>
          <text x={W - PAD} y={H - 6} fontSize={9} fill="currentColor" opacity={0.75} textAnchor="end">
            {labelTanggal(tren[tren.length - 1].tanggal)}
          </text>
        </>
      )}
    </svg>
  );
}

/** Porsi eskalasi: satu batang proporsi, bukan kartu metrik. */
function PorsiEskalasi({ persen, jumlah }: { persen: number; jumlah: number }) {
  const nilai = Math.max(0, Math.min(100, persen));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-label-md text-label-md font-bold text-on-surface">Porsi eskalasi</p>
        <p className="tabular-nums font-label-md text-label-md font-bold text-on-surface">
          {formatNumber(persen)}%
        </p>
      </div>
      <div
        role="img"
        aria-label={`${formatNumber(persen)} persen sesi chatbot diescalasi, ${formatNumber(
          jumlah,
        )} pesan`}
        className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container"
      >
        <div className="h-full rounded-full bg-error" style={{ width: `${nilai}%` }} />
      </div>
      <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
        {formatNumber(jumlah)} pesan diteruskan ke guru BK
      </p>
    </div>
  );
}

function KategoriBar({
  kategori,
}: {
  kategori: { kategori: string; jumlah: number }[];
}) {
  const top = kategori.slice(0, 5);
  const maks = Math.max(1, ...top.map((k) => k.jumlah));
  return (
    <ol className="space-y-2">
      {top.map((k) => (
        <li key={k.kategori}>
          <div className="flex items-baseline justify-between gap-2 font-body-sm text-body-sm">
            <span className="truncate font-bold text-on-surface">{k.kategori}</span>
            <span className="shrink-0 tabular-nums text-on-surface-variant">
              {formatNumber(k.jumlah)}
            </span>
          </div>
          <div
            role="img"
            aria-label={`${k.kategori}: ${formatNumber(k.jumlah)} pertanyaan`}
            className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container"
          >
            <div
              className="h-full rounded-full bg-chart-series"
              style={{ width: `${Math.max(4, Math.round((k.jumlah / maks) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function ChatAnalyticsPanel({
  state,
  periode,
  onPeriodeChange,
}: {
  state: ChatStatsState;
  periode: PeriodeStatistik;
  onPeriodeChange: (p: PeriodeStatistik) => void;
}) {
  const tren = useMemo(
    () => (state.kind === "ok" ? state.analytics.tren.slice(-Number(periode)) : []),
    [state, periode],
  );

  const kepala = (
    <div className="flex flex-wrap items-center justify-between gap-space-sm">
      <h2 className="font-title-md text-title-md font-bold text-on-surface">
        Analisis Chatbot
      </h2>
      <div
        role="group"
        aria-label="Periode statistik chatbot"
        className="flex rounded-lg border border-outline-variant p-0.5"
      >
        {(["7", "30"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodeChange(p)}
            aria-pressed={periode === p}
            className={`rounded-md px-2.5 py-1 font-label-sm text-label-sm font-bold transition-colors ${
              periode === p
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {p} hari
          </button>
        ))}
      </div>
    </div>
  );

  if (state.kind === "loading") {
    return (
      <section
        aria-label="Analisis chatbot"
        className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"
        aria-busy="true"
      >
        {kepala}
        <p className="mt-space-sm flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-outline-variant border-t-primary"
          />
          Memuat analisis…
        </p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <section
        aria-label="Analisis chatbot"
        className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"
      >
        {kepala}
        <p className="mt-space-sm flex items-start gap-1.5 font-body-sm text-body-sm font-bold text-error">
          <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Analisis gagal dimuat
        </p>
        <p className="mt-1 break-words font-body-sm text-body-sm text-on-surface-variant">
          {state.message}
        </p>
        <Link
          href="/admin/chat"
          className="mt-space-sm inline-flex items-center gap-1 font-label-md text-label-md font-bold text-primary underline underline-offset-4 hover:text-secondary"
        >
          Buka Riwayat Chatbot
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  const { analytics, insightTerbaru } = state;
  const m = analytics.metrik;
  const totalPeriode = tren.reduce((acc, d) => acc + d.sesi, 0);
  const adaIsi = totalPeriode > 0 || analytics.kategori.length > 0;

  return (
    <section
      aria-label="Analisis chatbot"
      className="flex flex-col gap-space-lg rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"
    >
      {kepala}

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-label-md text-label-md font-bold text-on-surface">
            Tren Sesi
          </p>
          <p className="tabular-nums font-label-sm text-label-sm text-on-surface-variant">
            {formatNumber(totalPeriode)} sesi / {periode} hari
          </p>
        </div>
        <div className="mt-1 text-on-surface-variant">
          {tren.length === 0 ? (
            <p className="font-body-sm text-body-sm italic text-on-surface-variant">
              Belum ada sesi chatbot pada periode ini.
            </p>
          ) : (
            <>
              <TrenSesi tren={tren} />
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Garis putus-putus menandai onset: hari saat volume sesi berubah
                ≥ dua kali lipat dari sehari sebelumnya.
              </p>
            </>
          )}
        </div>
      </div>

      <PorsiEskalasi persen={m.persenEskalasi} jumlah={m.eskalasi} />

      <div>
        <p className="font-label-md text-label-md font-bold text-on-surface">
          Kategori Teratas
        </p>
        {analytics.kategori.length === 0 ? (
          <p className="mt-1 font-body-sm text-body-sm italic text-on-surface-variant">
            Belum ada klasifikasi kategori pada periode ini.
          </p>
        ) : (
          <div className="mt-2">
            <KategoriBar kategori={analytics.kategori} />
          </div>
        )}
      </div>

      <div>
        <p className="font-label-md text-label-md font-bold text-on-surface">
          Topik Tersering
        </p>
        {analytics.top.length === 0 ? (
          <p className="mt-1 font-body-sm text-body-sm italic text-on-surface-variant">
            Belum ada pertanyaan yang berulang pada periode ini.
          </p>
        ) : (
          <ol className="mt-2 space-y-2">
            {analytics.top.slice(0, 3).map((t) => (
              <li key={t.pertanyaan} className="text-body-sm text-body-sm">
                <p className="line-clamp-2 font-bold text-on-surface">{t.pertanyaan}</p>
                <p className="tabular-nums font-label-sm text-label-sm text-on-surface-variant">
                  diulang {formatNumber(t.jumlah)}×
                  {t.kategori ? ` · ${t.kategori}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {formatNumber(m.luarKonteks)} pertanyaan di luar konteks ({m.persenLuarKonteks}%)
        · {formatNumber(m.dijawab)} dari {formatNumber(m.totalJawaban)} jawaban dijawab AI (
        {formatNumber(m.persenDijawab)}%)
      </p>

      {insightTerbaru ? (
        <div className="rounded-xl bg-surface-container p-space-md">
          <p className="font-label-sm text-label-sm font-bold text-on-surface-variant">
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
          Belum ada insight aktif. Generate dari halaman Riwayat Chatbot.
        </p>
      )}

      {!adaIsi && (
        <p className="font-body-sm text-body-sm italic text-on-surface-variant">
          Belum ada aktivitas chatbot yang bisa ditampilkan.
        </p>
      )}

      <Link
        href="/admin/chat"
        className="inline-flex items-center gap-1 font-label-md text-label-md font-bold text-primary underline underline-offset-4 hover:text-secondary"
      >
        Buka Riwayat Chatbot
        <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
    </section>
  );
}

export type { ChatAnalyticsResponse, ChatInsightsResponse };