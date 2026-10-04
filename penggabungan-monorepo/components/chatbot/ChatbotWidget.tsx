"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
      const reply = result.reply;
      if (result.sessionId !== sessionId) {
        try {
          localStorage.setItem("smkn24-chat-session", result.sessionId);
        } catch {
          setError("Balasan diterima, tetapi sesi percakapan tidak dapat disimpan.");
        }
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
              ? "fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-container-lowest focus:outline-none"
              : "mb-4 w-80 sm:w-96 overflow-hidden flex flex-col max-h-[500px] bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container"
          }
        >
          <div className="bg-primary text-surface p-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
              <span className="truncate font-bold">Asisten AI SMKN 24</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Kembali ke ukuran biasa" : "Mode layar penuh"}
                aria-pressed={isFullscreen}
                aria-controls="smkn24-chat-panel"
                className="rounded-md p-1.5 text-surface hover:text-secondary-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isFullscreen ? "close_fullscreen" : "open_in_full"}
                </span>
              </button>
              <button
                type="button"
                onClick={toggleChat}
                aria-label="Tutup chatbot"
                className="rounded-md p-1.5 text-surface hover:text-secondary-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <ChatMessages messages={messages} />
            {isSending && <p className="text-sm text-on-surface-variant" role="status" aria-live="polite">Asisten sedang menyiapkan jawaban...</p>}
            {error && <p className="text-sm text-red-700" role="status" aria-live="polite">{error}</p>}
          </div>
          <div
            className={`border-t border-surface-container p-2 ${isFullscreen ? "pb-[max(0.5rem,env(safe-area-inset-bottom))]" : ""}`}
          >
            <ChatInput onSend={sendMessage} disabled={isSending} />
          </div>
        </div>
      )}
      <button
        ref={fabRef}
        onClick={toggleChat}
        aria-label={isOpen ? "Tutup chatbot" : "Buka chatbot"}
        aria-expanded={isOpen}
        className={`w-14 h-14 rounded-full bg-primary text-surface shadow-lg items-center justify-center hover:bg-primary-container transition-colors ${isFullscreen ? "hidden" : "flex"}`}
      >
        <span className="material-symbols-outlined text-[28px]">{isOpen ? "close" : "chat"}</span>
      </button>
    </div>
  );
}
