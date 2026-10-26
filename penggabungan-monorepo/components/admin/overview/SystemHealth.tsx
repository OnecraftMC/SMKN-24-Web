"use client";

/**
 * Kesehatan Sistem — satu baris tenang di kaki Overview.
 *
 * Bukan panel analitik (analitik lengkap ada di /admin/chat): hanya denyut
 * chatbot 7 hari, status Chatbot-BK WhatsApp, dan tautan ke halaman rinci.
 * Sumber yang gagal dinyatakan gagal, bukan ditampilkan sebagai nol.
 */

import Link from "next/link";
import type { ChatMetrik } from "@/lib/admin/types";
import { formatNumber } from "./ringkasan";

type Statistik =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; metrik: ChatMetrik };

type RingkasanWA = {
  aktif: boolean;
  jumlah: number;
  threshold: number;
} | null;

export default function SystemHealth({
  statistik,
  wa,
  waError,
}: {
  statistik: Statistik;
  wa: RingkasanWA;
  waError: string | null;
}) {
  return (
    <footer
      aria-label="Kesehatan sistem"
      className="border-t border-surface-container pt-space-md"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-label-sm text-label-sm text-on-surface-variant">
        {statistik.kind === "loading" ? (
          <span aria-live="polite">Chatbot 7 hari: memuat…</span>
        ) : statistik.kind === "error" ? (
          <span className="font-bold text-error">
            Chatbot 7 hari: statistik gagal dimuat.
          </span>
        ) : (
          <span>
            Chatbot 7 hari:{" "}
            <strong className="font-bold text-on-surface tabular-nums">
              {formatNumber(statistik.metrik.totalSesi)} sesi
            </strong>{" "}
            · {formatNumber(statistik.metrik.persenDijawab)}% dijawab ·{" "}
            {formatNumber(statistik.metrik.persenEskalasi)}% eskalasi
          </span>
        )}

        <span aria-hidden>·</span>

        {waError ? (
          <span className="font-bold text-error">Chatbot-BK: gagal dimuat.</span>
        ) : wa === null ? (
          <span>Chatbot-BK: memuat…</span>
        ) : (
          <span>
            Chatbot-BK {wa.aktif ? "aktif" : "nonaktif"} ·{" "}
            <span className="tabular-nums">
              {formatNumber(wa.jumlah)}/{formatNumber(wa.threshold)} laporan
            </span>
          </span>
        )}

        <span aria-hidden>·</span>

        <Link
          href="/admin/chat"
          className="inline-flex min-h-9 items-center font-bold text-primary underline underline-offset-4 hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Statistik chatbot
        </Link>
        <Link
          href="/admin/chat/otomatis"
          className="inline-flex min-h-9 items-center font-bold text-primary underline underline-offset-4 hover:text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Riwayat otomatis
        </Link>
      </div>
      {statistik.kind === "error" && (
        <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
          {statistik.message}
        </p>
      )}
    </footer>
  );
}
