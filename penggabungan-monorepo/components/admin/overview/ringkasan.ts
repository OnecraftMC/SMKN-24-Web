/**
 * Helper ringkasan untuk Overview “Meja Moderasi”.
 *
 * Semua nilai dihitung dari respons yang sudah dimuat `ModulProvider`
 * (tanpa endpoint baru) dan memakai waktu lokal, mengikuti parser
 * `parseWaktuMySQL` yang sudah dipakai modul lain.
 */

import type { BeritaDTO } from "@/lib/admin/types";
import { parseWaktuMySQL } from "@/lib/admin/moduleCounts";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/** Selisih hari kalender (lokal) antara hari ini dan tanggal sumber. */
export function hariSejak(value: string | null | undefined): number | null {
  const waktu = parseWaktuMySQL(value);
  if (!waktu) return null;
  const sekarang = new Date();
  const hariIni = new Date(
    sekarang.getFullYear(),
    sekarang.getMonth(),
    sekarang.getDate(),
  );
  const hariSumber = new Date(waktu.getFullYear(), waktu.getMonth(), waktu.getDate());
  return Math.max(
    0,
    Math.round((hariIni.getTime() - hariSumber.getTime()) / 86_400_000),
  );
}

/** Tanggal artikel berita (ISO `YYYY-MM-DD`) sebagai waktu lokal. */
export function tanggalBerita(berita: BeritaDTO): Date | null {
  if (!berita.tanggalIso) return null;
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(berita.tanggalIso);
  if (!cocok) return null;
  return new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3]));
}

/** Berita dianggap terbit kecuali statusnya eksplisit `draft`. */
export function beritaTerbit(berita: BeritaDTO): boolean {
  return berita.status !== "draft";
}

/** "hari ini" / "1 hari lalu" / "12 hari lalu". */
export function frasaHari(value: number | null): string {
  if (value === null) return "tanggal tidak tersedia";
  if (value === 0) return "hari ini";
  return `${formatNumber(value)} hari lalu`;
}
