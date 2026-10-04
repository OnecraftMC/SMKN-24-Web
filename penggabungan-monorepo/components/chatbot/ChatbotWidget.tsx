"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, MessageCircle, Minimize2, Sparkles, X } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

function getSessionId(): string {
  const existing = localStorage.getItem("smkn24-chat-session");
  if (existing && /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(existing)) {
    return existing;
  }
  const sessionId = crypto.randomUUID();
  localStorage.setItem("smkn24-chat-session", sessionId);
  return sessionId;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  // Mode fullscreen: hanya mengganti kelas panel — `messages`/`isSending`/`error`
  // dan session ID (localStorage) tidak disentuh sehingga percakapan tetap utuh.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "bot", text: "Halo! Ada yang bisa saya bantu terkait PPDB, kurikulum, atau fasilitas sekolah?" },
  ]);

  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Menutup chat selalu kembali ke mode compact.
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsFullscreen(false);
  }, []);

  const toggleChat = () => (isOpen ? closeChat() : setIsOpen(true));
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  // Escape: keluar dari fullscreen dulu, baru menutup chat (paritas drawer admin).
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (isFullscreen) setIsFullscreen(false);
      else closeChat();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isFullscreen, closeChat]);

  // Masuk fullscreen: fokus ke panel (tabIndex -1) karena dialog bersifat modal.
  useEffect(() => {
    if (isFullscreen) panelRef.current?.focus();
  }, [isFullscreen]);

  // Chat ditutup (dari mode apa pun, termasuk header saat fullscreen ketika tombol
  // FAB sedang `hidden`): kembalikan fokus ke FAB *setelah* render berikutnya,
  // sehingga alur keyboard tidak hilang.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) fabRef.current?.focus();
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || isSending) return;
    const newMessage: ChatMessage = { id: crypto.randomUUID(), sender: "user", text: message };
    setMessages(prev => [...prev, newMessage]);
    setIsSending(true);
    setError(null);

    try {
      const sessionId = getSessionId();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
            ? result.error
            : `Server merespons HTTP ${response.status}.`;
        setError(message);
        return;
      }
      if (
        typeof result !== "object" ||
        result === null ||
        !("reply" in result) ||
        typeof result.reply !== "string" ||
        !("sessionId" in result) ||
        typeof result.sessionId !== "string" ||
        !result.sessionId
      ) {
        setError("Balasan chatbot tidak memiliki format yang valid.");
        return;
      }
      // Backend menandai `aiAvailable: false` ketika provider AI belum
      // dikonfigurasi atau gagal. `reply` pada kondisi itu hanya pesan bantuan,
      // bukan jawaban model, jadi harus tampil sebagai kondisi "AI tidak
      // tersedia" — bukan bubble percakapan biasa. Field yang tidak ada
      // (backend versi lama) dianggap tersedia agar kontrak lama tetap jalan.
      const aiAvailable = !("aiAvailable" in result) || result.aiAvailable !== false;

      const reply = result.reply;
      if (result.sessionId !== sessionId) {
        try {
          localStorage.setItem("smkn24-chat-session", result.sessionId);
        } catch {
          setError("Balasan diterima, tetapi sesi percakapan tidak dapat disimpan.");
        }
      }
      if (!aiAvailable) {
        setError(reply);
        return;
      }
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: "bot", text: reply }]);
    } catch (cause) {
      setError(
        cause instanceof DOMException && cause.name === "SecurityError"
          ? "Penyimpanan sesi tidak tersedia di browser ini."
          : "Tidak dapat menghubungi asisten. Periksa koneksi, lalu coba lagi.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div
          id="smkn24-chat-panel"
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Asisten AI SMKN 24"
          aria-modal={isFullscreen || undefined}
          className={
            isFullscreen
              ? "fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden bg-surface focus:outline-none"
              : "mb-4 flex max-h-[min(620px,calc(100dvh-6rem))] min-h-[min(460px,calc(100dvh-6rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface shadow-[0_28px_80px_-28px_rgba(0,20,47,0.6)] focus:outline-none sm:w-96"
          }
        >
          <div className="relative flex shrink-0 items-center justify-between gap-3 overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-container px-4 py-4 text-on-primary">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/[0.06]"
            />
            <div className="relative flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary-container to-tertiary-container text-on-secondary-container shadow-sm">
                <Sparkles aria-hidden className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">Asisten AI SMKN 24</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-on-primary/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-container" aria-hidden="true" />
                  Siap membantu informasi sekolah
                </p>
              </div>
            </div>
            <div className="relative flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Kembali ke ukuran biasa" : "Mode layar penuh"}
                aria-pressed={isFullscreen}
                aria-controls="smkn24-chat-panel"
                className="rounded-full p-2 text-on-primary/80 transition-colors hover:bg-on-primary/10 hover:text-on-primary focus-visible:outline-on-primary"
              >
                {isFullscreen ? <Minimize2 aria-hidden className="h-4 w-4" /> : <Maximize2 aria-hidden className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={toggleChat}
                aria-label="Tutup chatbot"
                className="rounded-full p-2 text-on-primary/80 transition-colors hover:bg-on-primary/10 hover:text-on-primary focus-visible:outline-on-primary"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-surface-container-low px-4 py-5">
            <ChatMessages messages={messages} isTyping={isSending} />
            {error && (
              <p
                className="ml-10 mt-3 rounded-2xl border border-error/20 bg-error-container px-3 py-2 text-xs leading-relaxed text-on-error-container"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
          <div className={`shrink-0 border-t border-outline-variant/50 bg-surface-container-lowest px-3 py-3 ${isFullscreen ? "pb-[max(0.75rem,env(safe-area-inset-bottom))]" : ""}`}>
            <ChatInput onSend={sendMessage} disabled={isSending} />
            <p className="mt-2 text-center text-[10px] text-on-surface-variant/75">
              Asisten AI informasi SMKN 24 Jakarta
            </p>
          </div>
        </div>
      )}
      <button
        ref={fabRef}
        type="button"
        onClick={toggleChat}
        aria-label={isOpen ? "Tutup chatbot" : "Buka chatbot"}
        aria-expanded={isOpen}
        aria-controls="smkn24-chat-panel"
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_14px_34px_-10px_rgba(0,20,47,0.6)] transition duration-200 hover:-translate-y-0.5 hover:bg-primary-container focus-visible:outline-offset-4 ${isFullscreen ? "hidden" : ""}`}
      >
        {isOpen ? <X aria-hidden className="h-6 w-6" /> : <MessageCircle aria-hidden className="h-6 w-6" />}
      </button>
    </div>
  );
}
