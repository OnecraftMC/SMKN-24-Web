"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChatMetrik, ChatTren } from "@/lib/admin/types";

export type StatistikChatState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; metrik: ChatMetrik; tren: ChatTren[] };

type TitikGrafik = ChatTren & { label: string };

function tanggalISO(date: Date): string {
  const tahun = date.getFullYear();
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const hari = String(date.getDate()).padStart(2, "0");
  return `${tahun}-${bulan}-${hari}`;
}

function labelTanggal(value: string): string {
  const [, bulan, hari] = value.split("-");
  return bulan && hari ? `${hari}/${bulan}` : value;
}

function formatTanggal(value: string): string {
  const [tahun, bulan, hari] = value.split("-").map(Number);
  if (!tahun || !bulan || !hari) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
    new Date(tahun, bulan - 1, hari),
  );
}

function buatTrenMingguan(tren: ChatTren[]): TitikGrafik[] {
  const nilaiPerTanggal = new Map(tren.map((titik) => [titik.tanggal, titik.sesi]));
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const tanggal = new Date(hariIni);
    tanggal.setDate(hariIni.getDate() - 6 + index);
    const iso = tanggalISO(tanggal);
    return {
      tanggal: iso,
      label: labelTanggal(iso),
      sesi: nilaiPerTanggal.get(iso) ?? 0,
    };
  });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function ChatAnalyticsChart({
  state,
}: {
  state: StatistikChatState;
}) {
  const tren = state.kind === "ok" ? buatTrenMingguan(state.tren) : [];

  return (
    <section
      aria-labelledby="chat-analytics-title"
      className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-space-sm">
        <div>
          <h2
            id="chat-analytics-title"
            className="font-title-md text-title-md font-bold text-on-surface"
          >
            Aktivitas chatbot
          </h2>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
            Jumlah sesi per hari · 7 hari terakhir
          </p>
        </div>
        {state.kind === "ok" && (
          <p className="font-label-md text-label-md font-bold text-on-surface">
            {formatNumber(state.metrik.totalSesi)} sesi
          </p>
        )}
      </div>

      {state.kind === "loading" ? (
        <div
          role="status"
          aria-label="Memuat tren aktivitas chatbot"
          aria-busy="true"
          className="mt-space-md h-56 animate-pulse rounded-lg bg-surface-container-low"
        />
      ) : state.kind === "error" ? (
        <p role="alert" className="mt-space-md font-body-sm text-body-sm text-error">
          Tren chatbot gagal dimuat: {state.message}
        </p>
      ) : (
        <>
          <div
            className="mt-space-md h-56 w-full"
            role="group"
            aria-label="Grafik jumlah sesi chatbot per hari selama 7 hari terakhir"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                accessibilityLayer
                data={tren}
                margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-outline-variant)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
                  minTickGap={12}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
                  width={40}
                />
                <Tooltip
                  labelFormatter={(label, payload) => {
                    const tanggal = payload[0]?.payload?.tanggal;
                    return tanggal ? formatTanggal(tanggal) : String(label);
                  }}
                  formatter={(value) => [`${formatNumber(Number(value))} sesi`, "Sesi"]}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    borderColor: "var(--color-outline-variant)",
                    color: "var(--color-on-surface)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sesi"
                  name="Sesi"
                  stroke="var(--color-chart-series)"
                  fill="var(--color-chart-series)"
                  fillOpacity={0.12}
                  strokeWidth={2.5}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {state.metrik.totalSesi === 0 && (
            <p className="mt-space-xs font-label-sm text-label-sm text-on-surface-variant">
              Belum ada sesi chatbot pada periode ini.
            </p>
          )}
        </>
      )}
    </section>
  );
}
