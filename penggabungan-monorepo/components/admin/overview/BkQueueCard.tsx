"use client";

import Link from "next/link";
import { ArrowRight, Loader2, MessageSquareHeart, TriangleAlert } from "lucide-react";

/**
 * Kartu antrean konseling BK di Overview — adaptasi "Student Counseling
 * Queue" dari template-and-promt/new-overview.md.
 *
 * ATURAN PRIVASI: halaman Overview HANYA menampilkan ringkasan anonim
 * (jumlah per status). Nama, kelas, dan isi pesan siswa TIDAK pernah dirender
 * di sini; detail pesan tetap eksklusif di `/admin/bk` (aturan privasi PRD §5
 * dan roadmap: identitas siswa tidak tampil sebagai default).
 */
export type BkRingkasState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; baru: number; diproses: number; selesai: number };

function StatusTile({
  label,
  nilai,
  warna,
}: {
  label: string;
  nilai: number;
  warna: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container p-space-md text-center">
      <p
        className={`font-label-sm text-label-sm font-bold uppercase tracking-wide ${warna}`}
      >
        {label}
      </p>
      <p
        className={`mt-1 tabular-nums font-headline-md text-headline-md font-bold ${warna}`}
      >
        {nilai}
      </p>
    </div>
  );
}

export default function BkQueueCard({ state }: { state: BkRingkasState }) {
  return (
    <article
      aria-label="Antrean konseling siswa BK"
      className="flex h-full flex-col rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-space-sm">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-error"
          >
            <MessageSquareHeart className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-title-md text-title-md font-bold text-on-surface">
              Antrean Konseling BK
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Ringkasan anonim per status — detail di Inbox BK.
            </p>
          </div>
        </div>
        {state.kind === "ok" && state.baru > 0 && (
          <span className="shrink-0 rounded-full bg-surface-container px-2.5 py-0.5 font-label-sm text-label-sm font-bold text-error">
            {state.baru} baru
          </span>
        )}
      </div>

      <div className="mt-space-md flex-1">
        {state.kind === "loading" && (
          <p className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Memuat ringkasan inbox…
          </p>
        )}

        {state.kind === "error" && (
          <p className="flex items-start gap-1.5 font-body-sm text-body-sm font-bold text-error">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">Gagal memuat: {state.message}</span>
          </p>
        )}

        {state.kind === "ok" && (
          <div className="grid grid-cols-3 gap-space-sm">
            <StatusTile label="Baru" nilai={state.baru} warna="text-error" />
            <StatusTile
              label="Diproses"
              nilai={state.diproses}
              warna="text-on-surface"
            />
            <StatusTile
              label="Selesai"
              nilai={state.selesai}
              warna="text-tertiary"
            />
          </div>
        )}
      </div>

      <div className="mt-space-md flex flex-wrap items-center justify-between gap-space-sm border-t border-surface-container pt-space-md">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Pesan siswa bersifat privat — tidak ditampilkan di halaman ini.
        </p>
        <Link
          href="/admin/bk"
          className="inline-flex shrink-0 items-center gap-space-xs rounded-lg bg-primary px-space-md py-2 font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-primary-container"
        >
          Buka Inbox BK
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
