"use client";

/** Utilitas tombol + pemisah toolbar editor (dipakai semua blok kontrol). */
export function toolBtn(active: boolean) {
  return `inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md px-2 font-label-sm text-label-sm font-bold transition-colors ${
    active ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-container"
  } disabled:cursor-not-allowed disabled:opacity-50`;
}

export function Divider() {
  return <span aria-hidden className="mx-1 h-6 w-px bg-outline-variant" />;
}
