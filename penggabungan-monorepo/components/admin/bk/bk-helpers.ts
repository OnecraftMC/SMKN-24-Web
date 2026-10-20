/**
 * Helper murni halaman Pesan BK (`/admin/bk`).
 *
 * Tanpa "use client": hanya fungsi/konstanta murni agar aman diimpor
 * komponen server bila kelak dibutuhkan. Dipisah dari `page.tsx` agar
 * komponen antrean (`BKQueueList`) dan panel detail (`BKDetailPanel`)
 * dapat memakai ulang tanpa duplikasi.
 */

import {
  BOBOT_KESULITAN,
  type PesanBKDTO,
  type TingkatKesulitanBK,
} from "@/lib/admin/types";

export const STATUS_LIST = ["Baru", "Diproses", "Selesai"] as const;

/**
 * Samarkan nomor HP siswa: tampilkan 4 digit terakhir saja.
 *
 * Data inklusif; nomor siswa tidak perlu dibaca utuh oleh guru BK untuk
 * menangani keluhan.
 */
export function maskPhone(phone: string | null): string {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 6) return "******";
  return `****${digits.slice(-4)}`;
}

/** Warna badge per tingkat kesulitan — makin berat makin menonjol. */
export const GAYA_KESULITAN: Record<TingkatKesulitanBK, string> = {
  Ringan: "bg-surface-container-highest text-on-surface-variant",
  Sedang: "bg-tertiary-container text-on-tertiary-container",
  Berat: "bg-error-container text-on-error-container",
};

export function parseTranskrip(
  transkrip: string | null,
): Array<{ sender: string; text: string }> {
  if (!transkrip) return [];

  try {
    const parsed = JSON.parse(transkrip);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const sender = typeof entry.sender === "string" ? entry.sender : "user";
        const text = typeof entry.text === "string" ? entry.text : "";
        return text ? { sender, text } : null;
      })
      .filter((entry): entry is { sender: string; text: string } => entry !== null);
  } catch {
    return [];
  }
}

export function buildAssistantPlan(row: PesanBKDTO) {
  const transcript = parseTranskrip(row.transkrip);
  const recentText = transcript.slice(-2).map((item) => item.text).join(" ");
  const stressLevel = row.butuhPerhatian ? "perlu penanganan segera" : row.tingkatKesulitan ?? "belum ditentukan";
  const priorityText =
    row.butuhPerhatian || row.tingkatKesulitan === "Berat"
      ? "Prioritaskan peninjauan Guru BK. Pastikan siswa memiliki ruang aman dan susun tindak lanjut yang terstruktur."
      : "Tetap lakukan follow-up ringan dengan jadwal monitoring yang jelas.";

  const draft = [
    "Terima kasih sudah berbagi kondisi yang sedang kamu hadapi.",
    `Saya memahami bahwa situasi ini termasuk ${stressLevel}.`,
    "Kita akan fokus pada langkah yang aman, tenang, dan dapat ditindaklanjuti dengan jelas.",
    "Silakan lanjutkan dengan sesi konseling singkat, lalu catat apa yang paling terasa berat dan apa yang sudah kamu coba.",
    recentText ? `Berdasarkan cerita yang sudah disampaikan, ${recentText.trim()}` : "Berdasarkan cerita yang sudah disampaikan, mari kita fokus pada kondisi yang paling membebani saat ini.",
  ].join(" ");

  const bullets = [
    "Validasi situasi: pastikan siswa merasa didengar dan aman sebelum membahas solusi.",
    "Jelaskan langkah yang bisa diambil hari ini, seperti jeda, komunikasi dengan wali kelas, atau sesi konseling lanjutan.",
    "Catat tindak lanjut yang realistis: kapan follow-up dilakukan, siapa yang terlibat, dan indikator keberhasilan yang jelas.",
  ];

  return { priorityText, draft, bullets };
}

/**
 * Urutan antrean prioritas P9.1/E22: kasus terbuka yang butuh perhatian +
 * paling berat di atas; yang Selesai selalu di bawah walau baru. Di dalam
 * kelompok yang sama, yang terbaru di atas.
 */
export function sortAntrean(rows: PesanBKDTO[]): PesanBKDTO[] {
  return rows.slice().sort((a, b) => {
    const bukaA = a.status !== "Selesai";
    const bukaB = b.status !== "Selesai";
    const bobotA = a.tingkatKesulitan ? BOBOT_KESULITAN[a.tingkatKesulitan] : 0;
    const bobotB = b.tingkatKesulitan ? BOBOT_KESULITAN[b.tingkatKesulitan] : 0;
    if (bukaA !== bukaB) return bukaA ? -1 : 1;
    if (bobotA !== bobotB) return bobotB - bobotA;
    if (a.butuhPerhatian !== b.butuhPerhatian) return a.butuhPerhatian ? -1 : 1;
    return b.tanggal.localeCompare(a.tanggal);
  });
}

/**
 * Kasus prioritas tertinggi yang belum Selesai — dibuka default di panel
 * detail, sesuai acceptance E22.
 */
export function pilihPrioritasTerbuka(rows: PesanBKDTO[]): PesanBKDTO | null {
  const terbuka = rows.filter((row) => row.status !== "Selesai");
  if (terbuka.length === 0) return null;
  return sortAntrean(terbuka)[0];
}
