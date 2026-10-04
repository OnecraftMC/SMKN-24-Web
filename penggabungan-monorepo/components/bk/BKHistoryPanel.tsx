"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { getDeviceId } from "./device";

type Tingkat = "Ringan" | "Sedang" | "Berat" | null;

type RiwayatItem = {
  id: number;
  tanggal: string;
  ringkasan: string | null;
  tingkatKesulitan: Tingkat;
  kategori: string | null;
  butuhPerhatian: boolean;
  status: string;
  messages: { id?: string; role?: string; sender?: string; text?: string }[] | null;
};

const GAYA: Record<string, string> = {
  Ringan: "bg-surface-container-highest text-on-surface-variant",
  Sedang: "bg-tertiary-container text-on-tertiary-container",
  Berat: "bg-error-container text-on-error-container",
};

/** Format tanggal ringkas dari string MySQL ("2026-10-04 18:30:00"). */
function formatTanggal(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!match) return value;
  const [, y, m, d, hh, mm] = match;
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ][Number(m) - 1];
  return `${Number(d)} ${bulan} ${y}, ${hh}.${mm}`;
}

/**
 * Riwayat chat Bimbingan Konseling milik perangkat ini saja.
 *
 * Data diambil memakai deviceId (ID di localStorage), bukan IP — lihat
 * device.ts untuk alasannya.
 */
export default function BKHistoryPanel({
  onMulaiBaru,
}: {
  onMulaiBaru?: () => void;
}) {
  const [items, setItems] = useState<RiwayatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    const deviceId = getDeviceId();
    if (!deviceId) {
      setError("Penyimpanan browser tidak tersedia, history tidak dapat dimuat.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/bk/history?deviceId=${encodeURIComponent(deviceId)}`,
        { cache: "no-store" },
      );
      const result: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "error" in result &&
          typeof (result as Record<string, unknown>).error === "string"
            ? (result as Record<string, unknown>).error as string
            : `Server merespons HTTP ${response.status}.`;
        setError(message);
        return;
      }

      setItems(Array.isArray(result) ? (result as RiwayatItem[]) : []);
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi internetmu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);


  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-surface-container">
        <h3 className="font-label-md text-label-md font-bold text-on-surface">
          Riwayat Ceritamu
        </h3>
        <button
          type="button"
          onClick={() => void load()}
          aria-label="Muat ulang riwayat"
          className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
        >
          <RefreshCw aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {loading && (
          <p className="flex items-center gap-2 py-4 text-sm text-on-surface-variant">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Memuat riwayat…
          </p>
        )}

        {!loading && error && (
          <p className="rounded-2xl bg-error-container px-4 py-2.5 text-sm text-on-error-container">
            {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Belum ada riwayat. Ceritakan dulu apa yang sedang kamu rasakan.
            </p>
            {onMulaiBaru && (
              <button
                type="button"
                onClick={onMulaiBaru}
                className="mt-3 rounded-full bg-primary px-5 py-2.5 shadow-sm text-surface font-label-md font-bold"
              >
                Mulai bercerita
              </button>
            )}
          </div>
        )}

        {!loading &&
          items.map((item) => {
            const isOpen = expanded === item.id;
            return (
              <article
                key={item.id}
                className={`rounded-3xl border p-4 shadow-sm ${
                  item.butuhPerhatian
                    ? "border-error bg-error-container/20"
                    : "border-surface-container bg-surface-container-lowest"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-on-surface-variant">
                    {formatTanggal(item.tanggal)}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {item.butuhPerhatian && (
                      <span className="rounded-full bg-error px-2 py-0.5 text-[11px] font-bold text-on-error">
                        Perlu perhatian
                      </span>
                    )}
                    {item.tingkatKesulitan && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${GAYA[item.tingkatKesulitan]}`}
                      >
                        {item.tingkatKesulitan}
                      </span>
                    )}
                  </span>
                </div>

                <p className="mt-1.5 text-sm text-on-surface">
                  {item.ringkasan ?? "Cerita kamu sudah tercatat."}
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                    {item.status}
                  </span>
                  {item.messages && item.messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : item.id)}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {isOpen ? "Sembunyikan" : "Lihat percakapan"}
                    </button>
                  )}
                </div>

                {isOpen && item.messages && (
                  <div className="mt-2 space-y-2 rounded-2xl bg-surface-container/70 p-3">
                    {item.messages.map((m, i) => {
                      const isUser = (m.sender ?? m.role) === "user";
                      const text = m.text ?? "";
                      if (!text) return null;
                      return (
                        <p
                          key={m.id ?? i}
                          className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                            isUser
                              ? "ml-auto bg-primary text-surface"
                              : "bg-surface-container-highest text-on-surface"
                          }`}
                        >
                          {text}
                        </p>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
      </div>
    </div>
  );
}
