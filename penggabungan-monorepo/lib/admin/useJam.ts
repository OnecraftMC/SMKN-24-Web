"use client";

/**
 * Jam lokal yang langganan sistem jam.
 *
 * Baris "sekarang" pada poros waktu dan jam di header hari harus benar-benar
 * bergerak. Jam adalah sumber di luar React, jadi subscribing lewat
 * `useSyncExternalStore` adalah bentuk yang tepat — bukan setState di dalam
 * effect yang akan memicu render berantai.
 *
 * Snapshot sengaja kasar (per 30 detik): snapshot `Date.now()` mentah berubah
 * identitas setiap pemanggilan dan akan membuat render berjalan tanpa henti.
 * Snapshot server bernilai 0 sehingga render pertama sama di server dan
 * klien, lalu klien melompat ke waktu sebenarnya setelah hydration.
 */

import { useMemo, useSyncExternalStore } from "react";

const JENDELA_MS = 30_000;

/** Nomor jendela 30 detik sejak epoch; berubah hanya setiap jendela. */
function jendela(): number {
  return Math.floor(Date.now() / JENDELA_MS);
}

/** Selalu 0 saat render di server. */
function jendelaServer(): number {
  return 0;
}

function subscribe(callback: () => void): () => void {
  const timer = window.setInterval(callback, JENDELA_MS);
  return () => window.clearInterval(timer);
}

/** Waktu lokal saat ini, diperbarui tiap 30 detik. Null sebelum hydration. */
export function useJam(): Date | null {
  const tick = useSyncExternalStore(subscribe, jendela, jendelaServer);
  return useMemo(() => (tick === 0 ? null : new Date(tick * JENDELA_MS)), [tick]);
}