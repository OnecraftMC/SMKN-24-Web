"use client";

import { AlertTriangle, Search } from "lucide-react";
import type {
  PesanBKDTO,
  StatusPesanBK,
  TingkatKesulitanBK,
} from "@/lib/admin/types";
import { fieldClass, ListState } from "@/components/admin/ui/FormBits";
import MorphSelect, {
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from "@/components/ui/select-morph";
import { GAYA_KESULITAN, STATUS_LIST } from "./bk-helpers";

const FILTER_KESULITAN: (TingkatKesulitanBK | "semua")[] = [
  "semua",
  "Berat",
  "Sedang",
  "Ringan",
];

type Props = {
  rows: PesanBKDTO[];
  selectedId: number | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  filterKesulitan: TingkatKesulitanBK | "semua";
  onFilterKesulitanChange: (value: TingkatKesulitanBK | "semua") => void;
  filterStatus: StatusPesanBK | "semua";
  onFilterStatusChange: (value: StatusPesanBK | "semua") => void;
  onSelect: (id: number) => void;
};

export default function BKQueueList({
  rows,
  selectedId,
  loading,
  error,
  onRetry,
  query,
  onQueryChange,
  filterKesulitan,
  onFilterKesulitanChange,
  filterStatus,
  onFilterStatusChange,
  onSelect,
}: Props) {
  const terbuka = rows.filter((row) => row.status !== "Selesai");
  const selesai = rows.filter((row) => row.status === "Selesai");

  const renderBaris = (row: PesanBKDTO) => {
    const aktif = row.id === selectedId;
    return (
      <li key={row.id}>
        <button
          type="button"
          onClick={() => onSelect(row.id)}
          aria-current={aktif}
          className={`block w-full rounded-2xl border p-space-md text-left transition-colors ${
            aktif
              ? "border-primary bg-primary/5"
              : row.butuhPerhatian
                ? "border-error bg-surface-container-lowest hover:border-primary/50"
                : "border-surface-container bg-surface-container-lowest hover:border-primary/50"
          }`}
        >
          <span className="flex flex-wrap items-start justify-between gap-space-xs">
            <span className="min-w-0">
              <span className="block truncate font-label-md text-label-md font-bold text-on-surface">
                {row.nama}{" "}
                <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">
                  · {row.kelas}
                </span>
              </span>
              <span className="mt-0.5 block font-body-sm text-body-sm text-on-surface-variant">
                {row.tanggal}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-1">
              {row.butuhPerhatian && (
                <span className="inline-flex items-center gap-1 rounded-full bg-error px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-error">
                  <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
                  Perlu perhatian
                </span>
              )}
              {row.tingkatKesulitan && (
                <span className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold ${GAYA_KESULITAN[row.tingkatKesulitan]}`}>
                  {row.tingkatKesulitan}
                </span>
              )}
              <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-surface-variant">
                {row.status}
              </span>
            </span>
          </span>
          {row.ringkasan ? (
            <span className="mt-space-xs line-clamp-2 block font-body-sm text-body-sm text-on-surface-variant">
              {row.ringkasan}
            </span>
          ) : (
            <span className="mt-space-xs block truncate font-body-sm text-body-sm italic text-on-surface-variant">
              {row.pesan}
            </span>
          )}
        </button>
      </li>
    );
  };
  return (
    <section aria-label="Antrean pesan BK" className="space-y-space-sm">
      <div className="flex flex-wrap gap-space-sm">
        <div className="relative min-w-[12rem] flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cari nama, kelas, ringkasan…"
            aria-label="Cari pesan BK"
            className={`${fieldClass} pl-9`}
          />
        </div>
        <MorphSelect value={filterKesulitan} onValueChange={(v) => onFilterKesulitanChange(v as TingkatKesulitanBK | "semua")} className="min-w-[9rem]">
          <MorphSelectTrigger className={fieldClass}>
            <MorphSelectValue />
          </MorphSelectTrigger>
          <MorphSelectContent>
            {FILTER_KESULITAN.map((v) => (
              <MorphSelectItem key={v} value={v}>
                {v === "semua" ? "Semua tingkat" : `Tingkat ${v}`}
              </MorphSelectItem>
            ))}
          </MorphSelectContent>
        </MorphSelect>
        <MorphSelect value={filterStatus} onValueChange={(v) => onFilterStatusChange(v as StatusPesanBK | "semua")} className="min-w-[9rem]">
          <MorphSelectTrigger className={fieldClass}>
            <MorphSelectValue />
          </MorphSelectTrigger>
          <MorphSelectContent>
            <MorphSelectItem value="semua">Semua status</MorphSelectItem>
            {STATUS_LIST.map((s) => (
              <MorphSelectItem key={s} value={s}>
                {s}
              </MorphSelectItem>
            ))}
          </MorphSelectContent>
        </MorphSelect>
      </div>

      <ListState
        loading={loading}
        error={error}
        empty={rows.length === 0}
        emptyLabel="Belum ada pesan BK yang cocok dengan filter."
        onRetry={onRetry}
      />

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-space-md">
          {terbuka.length > 0 && (
            <div>
              <p className="mb-space-xs font-label-md text-label-md font-bold text-on-surface">
                Perlu tindakan ({terbuka.length})
              </p>
              <ul className="space-y-space-sm">{terbuka.map(renderBaris)}</ul>
            </div>
          )}
          {selesai.length > 0 && (
            <div>
              <p className="mb-space-xs font-label-md text-label-md font-bold text-on-surface-variant">
                Selesai ({selesai.length})
              </p>
              <ul className="space-y-space-sm">{selesai.map(renderBaris)}</ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
