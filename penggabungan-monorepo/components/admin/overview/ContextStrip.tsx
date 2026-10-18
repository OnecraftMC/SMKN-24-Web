"use client";

/**
 * Strip konteks — pita angka di bawah header hari.
 *
 * Bentuknya satu pita navy setinggi tetap dengan angka dipisah garis rambut
 * vertikal: dibaca sebagai SATU keadaan sistem, bukan empat kartu. Tidak ada
 * ikon, gradien, bayangan, atau tautan masuk; strip ini instrumentation,
 * bukan pernyataan dan bukan panggung.
 *
 * Urutan unit mengikuti hierarki urgensi, bukan urutan lama: tiga unit pertama
 * menghitung pekerjaan yang menunggu keputusan manusia, unit keempat adalah
 * kesehatan sistem dan tidak boleh mendahului antrean manusia.
 *
 * Keadaan setiap unit berdiri sendiri (memuat / gagal / ada), jadi satu sumber
 * yang gagal tidak membuat unit lain menampilkan angka palsu.
 */

import type { ReactNode } from "react";

export type StripUnit = {
  key: string;
  label: string;
  /** Angka utama. Null saat memuat atau gagal. */
  value: string | null;
  /** Pecahan angka utama, satu kalimat pendek. */
  sub: string | null;
  state: "loading" | "error" | "ok";
  /** Dipakai pembaca layar dan judul tooltip saat gagal. */
  message?: string;
};

function IsiUnit({ unit }: { unit: StripUnit }) {
  if (unit.state === "loading") {
    return (
      <div className="flex h-full flex-col justify-center gap-1" aria-live="polite">
        <span className="font-label-sm text-label-sm text-primary-fixed-dim">
          {unit.label}
        </span>
        <span className="h-6 w-12 animate-pulse rounded bg-primary-fixed/25" />
        <span className="sr-only">Memuat {unit.label}…</span>
      </div>
    );
  }

  if (unit.state === "error") {
    return (
      <div className="flex h-full flex-col justify-center gap-1">
        <span className="font-label-sm text-label-sm text-primary-fixed-dim">
          {unit.label}
        </span>
        <span className="font-headline-sm text-headline-sm font-bold text-error-container">
          Gagal
        </span>
        <span className="truncate font-label-sm text-label-sm text-primary-fixed/70">
          {unit.message ?? "Data tidak dapat dimuat."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-1">
      <span className="font-label-sm text-label-sm text-primary-fixed-dim">
        {unit.label}
      </span>
      <span className="tabular-nums font-headline-sm text-headline-sm font-bold text-on-primary">
        {unit.value}
      </span>
      <span className="truncate font-label-sm text-label-sm text-primary-fixed/70">
        {unit.sub}
      </span>
    </div>
  );
}

export default function ContextStrip({ units }: { units: StripUnit[] }) {
  return (
    <section
      aria-label="Keadaan sistem"
      className="overflow-hidden rounded-xl border border-primary-container bg-primary"
    >
      {/* Tinggi tetap 72px CSS = 54px ter-render pada zoom 0,75 — sesuai
          brief (±56px ter-render). Ponsel: dua baris dua kolom, tetap satu pita. */}
      <dl className="grid grid-cols-2 sm:grid-cols-4">
        {units.map((unit) => (
          <div
            key={unit.key}
            className="-mt-px -ml-px min-h-[72px] border-t border-l border-primary-container px-space-md py-space-sm sm:px-space-lg"
          >
            <dt className="sr-only">{unit.label}</dt>
            <dd>
              <IsiUnit unit={unit} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Baris utilitas di atas strip: jam pemuatan terakhir, aksi muat ulang, dan
 * pernyataan kegagalan parsial — di sini sumber yang gagal disebut sebagai
 * data yang gagal, bukan dibiarkan muncul sebagai angka nol.
 */
export function StatusBar({
  children,
  terakhirDimuat,
  memuat,
  onReload,
}: {
  children?: ReactNode;
  terakhirDimuat: Date | null;
  memuat: boolean;
  onReload: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm">
      {children}
      <div className="flex items-center gap-space-sm">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Terakhir dimuat{" "}
          <span className="tabular-nums font-bold text-on-surface">
            {terakhirDimuat
              ? `${String(terakhirDimuat.getHours()).padStart(2, "0")}:${String(
                  terakhirDimuat.getMinutes(),
                ).padStart(2, "0")}:${String(terakhirDimuat.getSeconds()).padStart(2, "0")}`
              : "—"}
          </span>
        </p>
        <button
          type="button"
          onClick={onReload}
          disabled={memuat}
          className="inline-flex items-center gap-space-xs rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm py-1.5 font-label-sm text-label-sm font-bold text-primary transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          {memuat ? "Memuat…" : "Muat ulang"}
        </button>
      </div>
    </div>
  );
}