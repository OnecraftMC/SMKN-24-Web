"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Loader2, TriangleAlert } from "lucide-react";

/**
 * Kartu Agenda Mendatang di Overview — peran "school-agenda/calendar events"
 * pada template-and-promt/new-overview.md, memakai data riil dari modul
 * Agenda (bukan daftar acara hardcode).
 */
export type AgendaItemRingkas = {
  id: number;
  judul: string;
  tglMulai: string;
  badge: string | null;
};

export type AgendaListState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; items: AgendaItemRingkas[] };

const BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** "2026-10-14" -> chip tanggal; sengaja tanpa new Date (hindari geser zona). */
function chipTanggal(iso: string): { hari: string; bulan: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return { hari: "—", bulan: "" };
  const idx = Number(m[2]) - 1;
  return { hari: m[3], bulan: BULAN[idx] ?? m[2] };
}

export default function AgendaMendatang({
  state,
}: {
  state: AgendaListState;
}) {
  return (
    <article
      aria-label="Agenda mendatang"
      className="flex h-full flex-col rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-space-sm">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary"
          >
            <CalendarDays className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-title-md text-title-md font-bold text-on-surface">
              Agenda Mendatang
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Acara sekolah dari modul Agenda.
            </p>
          </div>
        </div>
        <Link
          href="/admin/agenda"
          className="inline-flex shrink-0 items-center gap-1 font-label-md text-label-md font-bold text-primary hover:underline"
        >
          Kelola
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-space-md flex-1">
        {state.kind === "loading" && (
          <p className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Memuat agenda…
          </p>
        )}

        {state.kind === "error" && (
          <p className="flex items-start gap-1.5 font-body-sm text-body-sm font-bold text-error">
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">Gagal memuat: {state.message}</span>
          </p>
        )}

        {state.kind === "ok" && state.items.length === 0 && (
          <p className="font-body-sm text-body-sm italic text-on-surface-variant">
            Belum ada agenda mendatang. Tambahkan acara dari modul Agenda.
          </p>
        )}

        {state.kind === "ok" && state.items.length > 0 && (
          <ul className="space-y-space-sm">
            {state.items.map((item) => {
              const chip = chipTanggal(item.tglMulai);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-space-sm rounded-xl bg-surface-container p-space-md"
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className="tabular-nums font-title-md text-title-md font-bold text-primary">
                      {chip.hari}
                    </p>
                    <p className="font-label-sm text-label-sm font-bold uppercase text-on-surface-variant">
                      {chip.bulan}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-label-md text-label-md font-bold text-on-surface">
                      {item.judul}
                    </p>
                    {item.badge && (
                      <p className="truncate font-body-sm text-body-sm text-on-surface-variant">
                        {item.badge}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}
