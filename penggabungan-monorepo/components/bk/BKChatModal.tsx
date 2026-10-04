"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getDeviceId } from "./device";
import BKHistoryPanel from "./BKHistoryPanel";

type Sender = "user" | "bot";

type Message = {
  id: string;
  sender: Sender;
  text: string;
};

/** Sapaan pembuka: langsung mengajak siswa bercerita. */
const GREETING =
  "Halo, selamat datang di layanan Bimbingan Konseling SMKN 24 Jakarta. " +
  "Aku di sini untuk mendengarkan. Ceritakan saja apa yang sedang kamu rasakan.";

/** Balasan cadangan bila server tidak mengirim pesan penutup. */
const CLOSING =
  "Terima kasih sudah bercerita dengan jujur. Ceritamu sudah kami terima dan akan segera ditindaklanjuti oleh tim Bimbingan Konseling.";

export default function BKChatModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"chat" | "riwayat">("chat");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Portal hanya boleh dibuat di sisi klien.
  useEffect(() => setMounted(true), []);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Sapaan hanya dibuat saat modal dibuka pertama kali.
  useEffect(() => {
    if (open) {
      setMessages((prev) =>
        prev.length === 0
          ? [{ id: "greeting", sender: "bot", text: GREETING }]
          : prev,
      );
      setError(null);
    }
  }, [open]);

  // Gulung ke pesan terbaru. Hanya area percakapan yang digeser — memakai
  // scrollIntoView akan ikut menggeser halaman di belakang modal.
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages, done]);

  // Kunci scroll halaman selama modal terbuka. Tanpa ini, halaman di
  // belakang ikut bergeser saat area pesan digulir.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape menutup modal; fokus langsung ke kolom cerita.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    // preventScroll: tanpa ini, memfokuskan textarea membuat browser
    // menggulir elemen teratas sampai ke textarea — sehingga bagian atas
    // modal (judul + sapaan) terpotong keluar dari layar.
    const t = window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      120,
    );
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  /** Kirim seluruh percakapan ke counseller AI untuk di-triase. */
  const submitCerita = async () => {
    const studentMessages = messages.filter((m) => m.sender === "user");
    if (studentMessages.length === 0 || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/bk/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // deviceId memungkinkan siswa membuka lagi history-nya di HP yang sama.
        body: JSON.stringify({ messages, deviceId: getDeviceId() }),
      });
      const result: unknown = await response.json().catch(() => null);

      const readString = (key: string): string | null => {
        if (typeof result === "object" && result !== null && key in result) {
          const v = (result as Record<string, unknown>)[key];
          return typeof v === "string" ? v : null;
        }
        return null;
      };

      if (!response.ok) {
        setError(readString("error") ?? `Server merespons HTTP ${response.status}.`);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: `closing-${Date.now()}`, sender: "bot", text: readString("message") ?? CLOSING },
      ]);
      setDone(true);
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi internetmu.");
    } finally {
      setIsSending(false);
    }
  };

  const sendDraft = () => {
    const text = draft.trim();
    if (!text || done) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: "user", text }]);
    setDraft("");
  };

  // Portal ke <body> WAJIB. Komponen ini dirender dari dalam <header> yang
  // ber-posisi `fixed` + `backdrop-blur`; kombinasi itu menjadikan header
  // sebagai containing block, sehingga `fixed inset-0` pada modal ikut
  // terukur relatif terhadap header (bukan viewport) dan bagian atas modal
  // terpotong keluar layar.
  return createPortal(
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[70] flex"
          : "fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      }
    >
      <button
        type="button"
        aria-label="Tutup layanan Bimbingan Konseling"
        onClick={onClose}
        className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Layanan Bimbingan Konseling"
        className={
          isFullscreen
            ? "relative w-full h-full bg-surface-container-lowest flex flex-col overflow-hidden"
            : "relative w-full sm:max-w-lg h-[85vh] max-h-[85vh] sm:h-[36rem] bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        }
      >
        {/* Kepala */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 bg-secondary-container text-on-secondary-container">
          <div className="min-w-0">
            <h2 className="font-headline-sm text-headline-sm font-bold leading-tight">
              Bimbingan Konseling
            </h2>
            <p className="font-label-sm text-label-sm opacity-90">
              Ceritakan apa yang kamu rasakan. Tim kami akan membalas.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              aria-label={isFullscreen ? "Keluar dari layar penuh" : "Layar penuh"}
              aria-pressed={isFullscreen}
              className="rounded-full p-1.5 hover:bg-black/10"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isFullscreen ? "close_fullscreen" : "fullscreen"}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="rounded-full p-1.5 hover:bg-black/10"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Tab: Ceritakan / Riwayat */}
        <div className="flex gap-1 px-4 pt-3 bg-surface-container-lowest">
          {(
            [
              { key: "chat", label: "Ceritakan" },
              { key: "riwayat", label: "Riwayat" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`rounded-t-lg px-4 py-2 font-label-sm text-label-sm font-bold ${
                tab === t.key
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "riwayat" ? (
          <BKHistoryPanel onMulaiBaru={() => setTab("chat")} />
        ) : (
          <>
        {/* Percakapan */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-5 py-4 bg-surface-container-low"
        >
          {/* Batasi lebar di layar penuh agar pesan tidak melebar dan sulit dibaca. */}
          <div className="mx-auto w-full max-w-2xl space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={m.sender === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.sender === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-surface px-4 py-2.5 text-sm leading-relaxed"
                    : "max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-container-highest px-4 py-2.5 text-sm leading-relaxed text-on-surface"
                }
              >
                {m.text}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-surface-container-highest px-4 py-2.5 text-sm text-on-surface-variant">
                Counsellor AI sedang membaca ceritamu…
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-surface-container px-4 py-3">
          <div className="mx-auto w-full max-w-2xl space-y-2">
          {error && (
            <p role="alert" className="text-sm text-error px-1">
              {error}
            </p>
          )}

          {done ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-on-surface-variant px-1">
                Ceritamu sudah tercatat dan diteruskan ke Guru BK.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-surface font-label-md font-bold"
              >
                Selesai
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={draft}
                  rows={2}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendDraft();
                    }
                  }}
                  placeholder="Tulis apa yang sedang kamu rasakan…"
                  className="flex-1 resize-none rounded-xl border border-outline bg-surface-container-lowest px-4 py-3 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={sendDraft}
                  disabled={!draft.trim()}
                  aria-label="Kirim pesan"
                  className="rounded-xl bg-secondary-container px-4 py-3 text-on-secondary-container disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </div>

              <button
                type="button"
                onClick={submitCerita}
                disabled={isSending || !messages.some((m) => m.sender === "user")}
                className="w-full rounded-lg bg-primary px-5 py-3 text-surface font-label-md font-bold disabled:opacity-40"
              >
                {isSending ? "Mengirim…" : "Selesai ceritakan, kirim ke Guru BK"}
              </button>
              <p className="text-xs text-on-surface-variant px-1">
                Nama dan kelas boleh dikosongkan bila ingin tetap anonim.
              </p>
            </>
          )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
