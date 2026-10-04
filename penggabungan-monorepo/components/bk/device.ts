"use client";

/**
 * Kunci localStorage untuk ID perangkat siswa.
 *
 * ID ini PENENTU history chat Bimbingan Konseling — bukan IP. Alasannya:
 * IP handphone sering berubah (pindah WiFi ke seluler atau ganti lokasi)
 * sehingga history bisa hilang sendiri, dan IP sekolah dipakai bersama
 * banyak siswa sehingga history antar-siswa bisa tercampur.
 *
 * ID perangkat tetap stabil selama localStorage tidak dihapus (mis. saat
 * siswa menekan "Clear data browser"). Mengganti perangkat berarti history
 * lama tidak terlihat di perangkat baru — itu konsekuensi yang disengaja.
 */
export const DEVICE_ID_KEY = "smkn24-bk-device";

/**
 * Ambil ID perangkat, buat bila belum ada.
 * Mengembalikan null bila localStorage tidak tersedia (mode privat/strict),
 * supaya layanan tetap jalan tanpa history.
 */
export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (
      existing &&
      /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}$/i.test(existing)
    ) {
      return existing;
    }

    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : // Fallback bila randomUUID tidak tersedia.
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    window.localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return null;
  }
}
