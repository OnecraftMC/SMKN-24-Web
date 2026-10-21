"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Download, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { API_BASE_URL, apiRequest, getStoredToken, isUnauthorized } from "@/lib/admin/api";
import type {
  ChatAnalyticsResponse,
  ChatInsight,
  ChatInsightsResponse,
} from "@/lib/admin/types";
import {
  ListState,
  buttonGhostClass,
  buttonPrimaryClass,
} from "@/components/admin/ui/FormBits";
import { UniversalDatePicker } from "@/components/ui/universal-date-picker";
import ChatbotBKHistory from "@/components/admin/chat/ChatbotBKHistory";
import AutomaticChatAnalyticsCta from "@/components/admin/chat/AutomaticChatAnalyticsCta";

type PeriodeKey = "hari" | "7" | "30" | "custom";

const PERIODE_LABEL: Record<PeriodeKey, string> = {
  hari: "Hari ini",
  "7": "7 hari",
  "30": "30 hari",
  custom: "Custom",
};

function isoHariIni(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

function rentang(periode: PeriodeKey, customDari: string, customSampai: string): { dari: string; sampai: string } {
  const sampai = isoHariIni();
  if (periode === "hari") return { dari: sampai, sampai };
  if (periode === "custom") {
    return {
      dari: customDari || sampai,
      sampai: customSampai || sampai,
    };
  }
  const hari = Number(periode);
  const dt = new Date();
  dt.setDate(dt.getDate() - (hari - 1));
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return { dari: `${dt.getFullYear()}-${m}-${d}`, sampai };
}

const WARNA_KATEGORI = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#dc2626", "#65a30d"];

function TrenSvg({ data }: { data: { tanggal: string; sesi: number }[] }) {
  const W = 560;
  const H = 180;
  const PAD = 28;
  const maks = Math.max(1, ...data.map((d) => d.sesi));
  const x = (i: number) =>
    data.length <= 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (data.length - 1);
  const y = (v: number) => H - PAD - (v / maks) * (H - PAD * 2);
  const garis = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.sesi).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafik tren sesi chatbot" className="h-44 w-full">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={PAD} x2={W - PAD} y1={y(maks * f)} y2={y(maks * f)} stroke="currentColor" strokeOpacity={0.12} />
      ))}
      {garis && <path d={garis} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinejoin="round" />}
      {data.map((d, i) => (
        <circle key={`${d.tanggal}-${i}`} cx={x(i)} cy={y(d.sesi)} r={3.5} fill="#2563eb">
          <title>{`${d.tanggal}: ${d.sesi} sesi`}</title>
        </circle>
      ))}
      {data.length > 0 && (
        <>
          <text x={PAD} y={H - 8} fontSize={10} fill="currentColor" opacity={0.7}>{data[0].tanggal}</text>
          <text x={W - PAD} y={H - 8} fontSize={10} fill="currentColor" opacity={0.7} textAnchor="end">
            {data[data.length - 1].tanggal}
          </text>
        </>
      )}
    </svg>
  );
}

export default function ChatAnalyticsPage() {
  const { logout } = useAuth();
  const [periode, setPeriode] = useState<PeriodeKey>("7");
  const [customDari, setCustomDari] = useState("");
  const [customSampai, setCustomSampai] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<ChatAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<ChatInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [aksiError, setAksiError] = useState<string | null>(null);

  const { dari, sampai } = useMemo(
    () => rentang(periode, customDari, customSampai),
    [periode, customDari, customSampai],
  );

  const muat = useCallback(() => {
    setLoading(true);
    setError(null);
    let cancelled = false;
    apiRequest<ChatAnalyticsResponse>(
      `/api/chat/analytics.php?dari=${dari}&sampai=${sampai}`,
    )
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          logout();
          return;
        }
        setError(err instanceof Error ? err.message : "Gagal memuat analytics.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dari, sampai, logout]);

  const muatInsights = useCallback(() => {
    setInsightsLoading(true);
    let cancelled = false;
    apiRequest<ChatInsightsResponse>("/api/chat/insights.php")
      .then((res) => {
        if (cancelled) return;
        setInsights(res.aktif);
        setInsightsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setInsights([]);
        setInsightsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pemuatan awal + tiap ganti periode: setState sinkron (loading) adalah bagian
  // sinkronisasi data server, pola yang sama dipakai modul BK/prestasi.
  // Rule react-hooks/set-state-in-effect dimatikan lokal untuk dua baris ini.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => muat(), [muat, reloadKey]);
  useEffect(() => muatInsights(), [muatInsights]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function generate() {
    setGenerateBusy(true);
    setAksiError(null);
    try {
      const res = await apiRequest<{ insights: ChatInsight[] }>(
        "/api/chat/insights.php",
        { method: "POST", body: { periode: periode === "30" ? "30" : "7" } },
      );
      if (res.insights.length > 0) setInsights((cur) => [...res.insights, ...cur]);
      else muatInsights();
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setAksiError(err instanceof Error ? err.message : "Gagal generate insight.");
    } finally {
      setGenerateBusy(false);
    }
  }

  async function ubahStatus(id: number, status: "selesai" | "diabaikan") {
    setAksiError(null);
    try {
      await apiRequest("/api/chat/insights.php", {
        method: "PUT",
        body: { id, status },
      });
      setInsights((cur) => cur.filter((i) => i.id !== id));
    } catch (err: unknown) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setAksiError(err instanceof Error ? err.message : "Gagal memperbarui insight.");
    }
  }

  function exportCsv() {
    const token = getStoredToken();
    const url =
      `${API_BASE_URL}/api/chat/export.php?dari=${dari}&sampai=${sampai}` +
      (token ? `#` : "");
    // Token dikirim via Authorization header tidak bisa lewat <a>; unduh via fetch blob.
    void (async () => {
      try {
        const res = await fetch(url.split("#")[0], {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Export gagal (HTTP ${res.status}).`);
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = obj;
        a.download = `chatbot-analytics-${dari}_${sampai}.csv`;
        document.body.append(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(obj), 1000);
      } catch (err: unknown) {
        setAksiError(err instanceof Error ? err.message : "Gagal export CSV.");
      }
    })();
  }

  const metrik = data?.metrik;
  const totalSentimen =
    (data?.sentimen.positif ?? 0) + (data?.sentimen.netral ?? 0) + (data?.sentimen.negatif ?? 0);
  const maksKategori = Math.max(1, ...(data?.kategori.map((k) => k.jumlah) ?? [1]));
  // Backend lama belum mengirim metrik terjawab/tidakTerjawab — fallback ke
  // angka yang sudah ada supaya kartu tidak pernah menampilkan "undefined".
  const terjawab = metrik?.terjawab ?? metrik?.dijawab ?? 0;
  const tidakTerjawab = metrik?.tidakTerjawab ?? 0;
  const persenTerjawab = metrik?.persenTerjawab ?? metrik?.persenDijawab ?? 0;
  const persenTidakTerjawab = metrik?.persenTidakTerjawab ?? 0;
  // Halaman tetap terisi bila ada aktivitas Chatbot-BK walau belum ada
  // percakapan chatbot pada periode ini.
  const kosong =
    !loading &&
    !error &&
    (metrik?.totalSesi ?? 0) === 0 &&
    (data?.chatbotBK?.totalNotifikasi ?? 0) === 0;

  const kartu = [
    { label: "Total Percakapan", nilai: String(metrik?.totalSesi ?? "-"), hint: `${dari} s.d. ${sampai}` },
    {
      label: "Terjawab",
      nilai: metrik ? String(terjawab) : "-",
      hint: metrik ? `${persenTerjawab}% dari ${metrik.totalJawaban} jawaban` : undefined,
    },
    {
      label: "Tidak Terjawab / Perlu Info",
      nilai: metrik ? String(tidakTerjawab) : "-",
      hint: metrik ? `${persenTidakTerjawab}% butuh info atau intervensi` : undefined,
    },
    { label: "Butuh Intervensi", nilai: metrik ? `${metrik.persenEskalasi}%` : "-", hint: metrik ? `${metrik.eskalasi} eskalasi` : undefined },
    { label: "Di Luar Konteks", nilai: metrik ? `${metrik.persenLuarKonteks}%` : "-", hint: metrik ? `${metrik.luarKonteks} pertanyaan` : undefined },
    { label: "Aktif Hari Ini", nilai: String(metrik?.aktifHariIni ?? "-"), hint: "Sesi hari ini" },
  ];

  return (
    <div className="space-y-space-lg">
      <header className="flex flex-wrap items-start justify-between gap-space-md">
        <div>
          <h1 className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary">
            <Bot aria-hidden className="h-6 w-6" />
            Analytics Chatbot
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Performa chatbot AI + insight actionable untuk admin sekolah.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-space-sm">
          <button type="button" onClick={exportCsv} className={buttonGhostClass}>
            <Download aria-hidden className="h-4 w-4" />
            Export CSV
          </button>
          <button type="button" onClick={() => setReloadKey((v) => v + 1)} className={buttonGhostClass}>
            Muat ulang
          </button>
        </div>
      </header>

      <section aria-label="Filter periode" className="flex flex-wrap items-center gap-space-sm">
        {(Object.keys(PERIODE_LABEL) as PeriodeKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriode(key)}
            aria-pressed={periode === key}
            className={
              periode === key
                ? "rounded-full bg-primary px-4 py-2 font-label-sm text-label-sm font-bold text-on-primary"
                : "rounded-full border border-outline-variant px-4 py-2 font-label-sm text-label-sm font-bold text-primary hover:bg-surface-container"
            }
          >
            {PERIODE_LABEL[key]}
          </button>
        ))}
        {periode === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <UniversalDatePicker
              defaultMode="range"
              rangeValue={{ from: customDari, to: customSampai }}
              onRangeChange={(range) => {
                if (range?.from) {
                  const y = range.from.getFullYear();
                  const m = String(range.from.getMonth() + 1).padStart(2, "0");
                  const d = String(range.from.getDate()).padStart(2, "0");
                  setCustomDari(`${y}-${m}-${d}`);
                }
                if (range?.to) {
                  const y = range.to.getFullYear();
                  const m = String(range.to.getMonth() + 1).padStart(2, "0");
                  const d = String(range.to.getDate()).padStart(2, "0");
                  setCustomSampai(`${y}-${m}-${d}`);
                }
              }}
              max={isoHariIni()}
              placeholder="Pilih rentang tanggal kustom"
              triggerClassName="h-10 rounded-full border-outline-variant bg-surface text-xs font-semibold px-4"
            />
          </div>
        )}
      </section>

      {aksiError && (
        <p role="alert" className="rounded-xl bg-error-container p-space-md text-on-error-container">
          {aksiError}
        </p>
      )}

      <ListState
        loading={loading}
        error={error}
        empty={kosong}
        emptyLabel="Belum ada percakapan chatbot pada periode ini. Chatbot akan mulai mengumpulkan data setelah digunakan oleh pengunjung."
        onRetry={() => setReloadKey((v) => v + 1)}
      />

      {!loading && !error && data && !kosong && (
        <>
          <section aria-label="Metrik utama" className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-5">
            {kartu.map((k) => (
              <article key={k.label} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
                <p className="font-label-md text-label-md font-bold text-on-surface-variant">{k.label}</p>
                <p className="mt-space-sm tabular-nums font-headline-lg text-headline-lg font-bold text-primary">{k.nilai}</p>
                {k.hint && <p className="font-body-sm text-body-sm text-on-surface-variant">{k.hint}</p>}
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-space-md xl:grid-cols-2">
            <article className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
              <h2 className="font-title-md text-title-md font-bold text-on-surface">Tren Percakapan</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Jumlah sesi per hari.</p>
              <div className="mt-space-sm text-on-surface-variant">
                <TrenSvg data={data.tren} />
              </div>
            </article>
            <article className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
              <h2 className="font-title-md text-title-md font-bold text-on-surface">Distribusi Kategori</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Topik pertanyaan hasil klasifikasi.</p>
              <ul className="mt-space-sm space-y-2">
                {data.kategori.length === 0 && (
                  <li className="font-body-sm text-body-sm italic text-on-surface-variant">Belum ada klasifikasi.</li>
                )}
                {data.kategori.map((k, i) => (
                  <li key={k.kategori}>
                    <div className="flex items-center justify-between gap-2 font-body-sm text-body-sm">
                      <span className="font-bold text-on-surface">{k.kategori}</span>
                      <span className="tabular-nums text-on-surface-variant">{k.jumlah}</span>
                    </div>
                    <div role="img" aria-label={`${k.kategori}: ${k.jumlah} pertanyaan`}
                      className="mt-1 h-2 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.round((k.jumlah / maksKategori) * 100)}%`,
                        backgroundColor: WARNA_KATEGORI[i % WARNA_KATEGORI.length],
                      }} />
                    </div>
                  </li>
                ))}
              </ul>
              {totalSentimen > 0 && (
                <p className="mt-space-md font-body-sm text-body-sm text-on-surface-variant">
                  Sentimen: {data.sentimen.positif} positif · {data.sentimen.netral} netral · {data.sentimen.negatif} negatif
                </p>
              )}
            </article>
          </section>

          <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
            <h2 className="font-title-md text-title-md font-bold text-on-surface">Top Pertanyaan</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              10 pertanyaan tersering beserta status jawaban AI.
            </p>
            {data.top.length === 0 ? (
              <p className="mt-space-sm font-body-sm text-body-sm italic text-on-surface-variant">Belum ada pertanyaan.</p>
            ) : (
              <div className="mt-space-sm overflow-x-auto">
                <table className="w-full min-w-[560px] text-left font-body-sm text-body-sm">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant">
                      <th scope="col" className="py-2 pr-3">Pertanyaan</th>
                      <th scope="col" className="py-2 pr-3">Jumlah</th>
                      <th scope="col" className="py-2 pr-3">Kategori</th>
                      <th scope="col" className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top.map((t, i) => {
                      // Backend baru mengirim label dua status; backend lama
                      // hanya mengirim status mentah (resolved/escalated/...).
                      const label =
                        t.statusLabel ??
                        (t.statusTerakhir === "resolved"
                          ? "Terjawab"
                          : t.statusTerakhir
                            ? "Tidak Terjawab/AI butuh info lebih lanjut"
                            : "Belum ada status");
                      return (
                      <tr key={`${t.pertanyaan}-${i}`} className="border-b border-surface-container/60 last:border-0">
                        <td className="max-w-[320px] truncate py-2 pr-3 text-on-surface" title={t.pertanyaan}>{t.pertanyaan}</td>
                        <td className="py-2 pr-3 tabular-nums">{t.jumlah}</td>
                        <td className="py-2 pr-3">{t.kategori ?? "-"}</td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-bold ${
                              label === "Terjawab"
                                ? "bg-primary-container text-on-primary-container"
                                : label === "Belum ada status"
                                  ? "bg-surface-container-highest text-on-surface-variant"
                                  : "bg-error-container text-on-error-container"
                            }`}
                          >
                            {label}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {data.chatbotBK && (
            <>
              <ChatbotBKHistory data={data.chatbotBK} view="summary" />
              <AutomaticChatAnalyticsCta data={data.chatbotBK} dari={dari} sampai={sampai} />
            </>
          )}
        </>
      )}

      <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <h2 className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
            <Sparkles aria-hidden className="h-5 w-5 text-primary" />
            AI Insight
          </h2>
          <button type="button" onClick={generate} disabled={generateBusy} className={buttonPrimaryClass}>
            {generateBusy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
            Generate insight baru
          </button>
        </div>
        {insightsLoading ? (
          <p className="mt-space-sm flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Memuat insight…
          </p>
        ) : insights.length === 0 ? (
          <p className="mt-space-sm font-body-sm text-body-sm italic text-on-surface-variant">
            Belum ada insight aktif. Klik Generate insight baru untuk menyusun dari data 7 hari terakhir.
          </p>
        ) : (
          <ul className="mt-space-sm space-y-space-sm">
            {insights.map((ins) => (
              <li key={ins.id} className="rounded-xl border border-surface-container p-space-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary-container px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-on-primary-container">
                    {ins.tipe}
                  </span>
                  <span className="rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                    {ins.sumber === "ai" ? "AI" : "Heuristik"}
                  </span>
                </div>
                <p className="mt-2 font-body-md text-body-md font-bold text-on-surface">{ins.judul}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{ins.isi}</p>
                <div className="mt-space-sm flex flex-wrap gap-space-sm">
                  <button type="button" onClick={() => ubahStatus(ins.id, "selesai")} className={buttonGhostClass}>
                    Tandai selesai
                  </button>
                  <button type="button" onClick={() => ubahStatus(ins.id, "diabaikan")} className={buttonGhostClass}>
                    Abaikan
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


