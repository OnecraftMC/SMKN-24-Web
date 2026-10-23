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
const ACTIVE_CONVERSATION_PREFIX = "smkn24-bk-active-conversation:";

export type StoredBKMessage = { id: string; sender: "user" | "bot"; text: string };
export type StoredBKConversation = { messages: StoredBKMessage[]; done: boolean };

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

function activeConversationKey(): string | null {
  const deviceId = getDeviceId();
  return deviceId ? `${ACTIVE_CONVERSATION_PREFIX}${deviceId}` : null;
}

/** Baca sesi yang belum dikirim, khusus untuk ID perangkat browser ini. */
export function loadActiveConversation(): StoredBKConversation | null {
  const key = activeConversationKey();
  if (!key) return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || !("messages" in parsed)) return null;

    const value = parsed as { messages?: unknown; done?: unknown };
    if (!Array.isArray(value.messages)) return null;
    const messages = value.messages.filter((message): message is StoredBKMessage =>
      typeof message === "object" && message !== null &&
      "id" in message && typeof message.id === "string" &&
      "sender" in message && (message.sender === "user" || message.sender === "bot") &&
      "text" in message && typeof message.text === "string",
    );

    return messages.length > 0
      ? { messages, done: value.done === true }
      : null;
  } catch {
    return null;
  }
}

/** Simpan sesi aktif tanpa mengirimkannya ke server sampai siswa menekan kirim. */
export function saveActiveConversation(conversation: StoredBKConversation): void {
  const key = activeConversationKey();
  if (!key) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(conversation));
  } catch {
    // Percakapan tetap berjalan selama halaman terbuka bila storage tidak tersedia.
  }
}

/** Hapus sesi aktif perangkat ini ketika tombol PANIK digunakan. */
export function clearActiveConversation(): void {
  const key = activeConversationKey();
  if (!key) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Panic exit tetap berjalan walaupun storage browser dibatasi.
  }
}
