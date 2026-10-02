/**
 * Util format tanggal untuk admin.
 *
 * Backend mengirim string tampil berbahasa Inggris (mis. "28 October 2024")
 * plus ISO mentah (`tanggalIso`, `tglMulai`). Semua tampilan admin memakai
 * util di sini supaya konsisten Bahasa Indonesia.
 */

const BULAN_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Tanggal hari ini (zona lokal) sebagai ISO "YYYY-MM-DD". */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "2024-11-25" -> "25 November 2024". Mengembalikan "—" bila kosong. */
export function formatDateId(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-");
  const monthIndex = Number(month) - 1;
  if (!year || !day || Number.isNaN(monthIndex) || !BULAN_ID[monthIndex]) {
    return iso;
  }
  return `${Number(day)} ${BULAN_ID[monthIndex]} ${year}`;
}

/** Rentang tanggal Indonesia; satu tanggal bila selesai kosong/sama. */
export function formatDateRangeId(
  startIso: string | null | undefined,
  endIso?: string | null,
): string {
  const start = formatDateId(startIso);
  if (!endIso || !startIso || endIso.slice(0, 10) === startIso.slice(0, 10)) {
    return start;
  }
  return `${start} – ${formatDateId(endIso)}`;
}

/** Deskripsi singkat untuk status agenda relatif hari ini. */
export function agendaTiming(iso: string | null | undefined): "mendatang" | "berlangsung" | "terlewat" {
  if (!iso) return "terlewat";
  const today = todayIso();
  if (iso.slice(0, 10) > today) return "mendatang";
  if (iso.slice(0, 10) === today) return "berlangsung";
  return "terlewat";
}
