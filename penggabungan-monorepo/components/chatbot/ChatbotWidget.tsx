"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Maximize2, MessageCircle, Minimize2, RotateCcw, Sparkles, X } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";

gsap.registerPlugin(Flip);

const QUESTION_SUGGESTIONS = [
  "Apa saja program keahlian yang tersedia di SMKN 24 Jakarta?",
  "Bagaimana cara mendaftar sebagai siswa baru?",
  "Di mana saya bisa melihat jadwal pelajaran?",
  "Prestasi apa saja yang pernah diraih siswa?",
  "Fasilitas apa yang tersedia di sekolah?",
  "Bagaimana cara menghubungi pihak sekolah?",
  "Apa saja kegiatan ekstrakurikuler di sekolah?",
  "Di mana saya dapat menemukan kalender akademik?",
  "Bagaimana cara mengajukan prestasi siswa?",
  "Apa saja dokumen pembelajaran yang bisa diunduh?",
  "Ceritakan tentang lingkungan belajar di sekolah.",
  "Bagaimana cara menuju SMKN 24 Jakarta?",
  "Apa saja kegiatan sekolah dalam waktu dekat?",
  "Di mana saya bisa membaca berita terbaru sekolah?",
  "Bagaimana cara mendapatkan informasi penerimaan siswa baru?",
];

function pickQuestionSuggestions(count: number): string[] {
  const shuffled = [...QUESTION_SUGGESTIONS];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

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
  // Percakapan tetap dipertahankan saat panel berganti mode.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "bot", text: "Halo! Ada yang bisa saya bantu terkait PPDB, kurikulum, atau fasilitas sekolah?" },
  ]);

  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const fabIconRef = useRef<HTMLSpanElement>(null);
  const brandMarkRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const welcomeOrbRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);

  // Menutup chat selalu kembali ke mode compact.
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  const toggleChat = () => {
    if (isOpen) {
      closeChat();
      return;
    }
    setSuggestions(pickQuestionSuggestions(4));
    setIsOpen(true);
  };
  const toggleFullscreen = () => {
    if (panelRef.current) flipStateRef.current = Flip.getState(panelRef.current);
    setIsFullscreen((prev) => !prev);
  };
  const startNewChat = () => {
    if (isSending) return;
    try {
      localStorage.removeItem("smkn24-chat-session");
    } catch {
      setError("Sesi percakapan sebelumnya tidak dapat dihapus dari browser.");
      return;
    }
    setMessages([
      { id: crypto.randomUUID(), sender: "bot", text: "Halo! Ada yang bisa saya bantu terkait PPDB, kurikulum, atau fasilitas sekolah?" },
    ]);
    setSuggestions(pickQuestionSuggestions(4));
    setError(null);
  };

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    const previousState = flipStateRef.current;
    flipStateRef.current = null;
    if (previousState) {
      Flip.from(previousState, {
        duration: reduceMotion ? 0 : 0.78,
        ease: "power3.inOut",
        absolute: false,
        nested: true,
        prune: true,
      });
    } else if (!reduceMotion) {
      gsap.fromTo(
        panel,
        { autoAlpha: 0, y: 22, scale: 0.94, filter: "blur(8px)" },
        { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.42, ease: "back.out(1.35)" },
      );
    }
  }, [isOpen, isFullscreen, reduceMotion]);

  useEffect(() => {
    const icon = isFullscreen ? brandMarkRef.current : fabIconRef.current;
    if (!icon) return;
    gsap.fromTo(
      icon,
      { rotation: isFullscreen ? -180 : 180, scale: 0.55 },
      {
        rotation: 0,
        scale: 1,
        duration: reduceMotion ? 0 : 0.62,
        ease: "elastic.out(1, 0.55)",
        overwrite: "auto",
      },
    );
  }, [isFullscreen, reduceMotion]);

  useEffect(() => {
    if (!isFullscreen || messages.length !== 1 || !welcomeRef.current) return;
    const context = gsap.context(() => {
      if (reduceMotion) return;
      gsap.fromTo(
        "[data-welcome-item]",
        { autoAlpha: 0, y: 22, filter: "blur(6px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.65, stagger: 0.1, ease: "power3.out", delay: 0.18 },
      );
      if (welcomeOrbRef.current) {
        gsap.to(welcomeOrbRef.current, {
          y: -10,
          rotation: 8,
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }, welcomeRef);
    return () => context.revert();
  }, [isFullscreen, messages.length, reduceMotion]);

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
  const isNewConversation = messages.length === 1;

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
              ? "fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden bg-surface text-on-surface focus:outline-none"
              : "mb-4 flex max-h-[min(620px,calc(100dvh-6rem))] min-h-[min(460px,calc(100dvh-6rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-[28px] border border-outline-variant/60 bg-surface shadow-[0_28px_80px_-28px_rgba(0,20,47,0.6)] focus:outline-none sm:w-96"
          }
        >
          <div className={`relative z-10 flex shrink-0 items-center justify-between gap-3 border-b px-4 py-4 ${isFullscreen ? "border-outline-variant/50 bg-surface/85 text-primary backdrop-blur-xl sm:px-8" : "overflow-hidden border-transparent bg-gradient-to-br from-primary via-primary to-primary-container text-on-primary"}`}>
            {!isFullscreen && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/[0.06]"
              />
            )}
            <div className="relative flex min-w-0 items-center gap-3">
              <div ref={brandMarkRef} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary-container to-tertiary-container text-on-secondary-container shadow-sm ${isFullscreen ? "ring-4 ring-secondary-container/20" : ""}`}>
                <Sparkles aria-hidden className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">Asisten AI SMKN 24</h2>
                <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${isFullscreen ? "text-on-surface-variant" : "text-on-primary/75"}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary-container" aria-hidden="true" />
                  Siap membantu informasi sekolah
                </p>
              </div>
            </div>
            <div className="relative flex shrink-0 items-center gap-1">
              {isFullscreen && (
                <button
                  type="button"
                  onClick={startNewChat}
                  disabled={isSending || isNewConversation}
                  className="mr-1 inline-flex min-h-10 items-center gap-2 rounded-full border border-outline-variant/60 px-3 text-xs font-semibold text-primary transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-45 sm:px-4"
                >
                  <RotateCcw aria-hidden className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Percakapan baru</span>
                  <span className="sm:hidden">Baru</span>
                </button>
              )}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Kembali ke ukuran biasa" : "Mode layar penuh"}
                aria-pressed={isFullscreen}
                aria-controls="smkn24-chat-panel"
                className={`rounded-full p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isFullscreen ? "text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-primary" : "text-on-primary/80 hover:bg-on-primary/10 hover:text-on-primary focus-visible:outline-on-primary"}`}
              >
                {isFullscreen ? <Minimize2 aria-hidden className="h-4 w-4" /> : <Maximize2 aria-hidden className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={toggleChat}
                aria-label="Tutup chatbot"
                className={`rounded-full p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isFullscreen ? "text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-primary" : "text-on-primary/80 hover:bg-on-primary/10 hover:text-on-primary focus-visible:outline-on-primary"}`}
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className={`relative min-h-0 flex-1 overflow-y-auto ${isFullscreen ? "bg-[radial-gradient(ellipse_at_50%_15%,rgba(133,83,0,0.09),transparent_43%),linear-gradient(180deg,var(--color-surface),var(--color-surface-container-low))]" : "bg-surface-container-low px-4 py-5"}`}>
            {isFullscreen && isNewConversation ? (
              <div ref={welcomeRef} className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center px-5 py-10 text-center sm:px-8 sm:py-14">
                <div data-welcome-item ref={welcomeOrbRef} className="relative mb-7 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary via-primary to-primary-container text-secondary-container shadow-[0_20px_55px_-20px_rgba(0,20,47,0.7)] ring-1 ring-white/20 sm:mb-9 sm:h-24 sm:w-24">
                  <div aria-hidden="true" className="absolute -inset-3 rounded-[34px] border border-secondary/20" />
                  <div aria-hidden="true" className="absolute -inset-6 rounded-[40px] border border-primary/10" />
                  <Sparkles aria-hidden className="h-9 w-9 sm:h-11 sm:w-11" />
                </div>
                <p data-welcome-item className="mb-3 font-label-sm font-bold uppercase tracking-[0.2em] text-secondary">
                  Asisten AI SMKN 24
                </p>
                <h1 data-welcome-item className="max-w-2xl font-headline-lg text-3xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">
                  Ada yang ingin kamu cari tahu?
                </h1>
                <p data-welcome-item className="mt-4 max-w-xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
                  Temukan informasi program keahlian, kegiatan, fasilitas, dan kehidupan di SMKN 24 Jakarta.
                </p>
                {suggestions.length > 0 && (
                  <section data-welcome-item className="mt-8 w-full max-w-3xl sm:mt-10" aria-label="Saran pertanyaan">
                    <p className="mb-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant sm:text-center">
                      Mulai dari salah satu pertanyaan ini
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={suggestion}
                          type="button"
                          onClick={() => void sendMessage(suggestion)}
                          disabled={isSending}
                          whileHover={reduceMotion ? undefined : { y: -3, scale: 1.015 }}
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 340, damping: 22 }}
                          className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/90 px-4 py-3 text-left text-sm font-semibold leading-snug text-primary shadow-sm backdrop-blur transition-colors hover:border-secondary/50 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-[4.5rem] sm:px-5"
                        >
                          <span>{suggestion}</span>
                          <span aria-hidden className="shrink-0 text-secondary transition-transform duration-200 group-hover:translate-x-1">
                            {index % 2 === 0 ? "↗" : "→"}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className={isFullscreen ? "mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 sm:py-10" : ""}>
                <ChatMessages messages={messages} isTyping={isSending} />
                {!isFullscreen && isNewConversation && suggestions.length > 0 && (
                  <section className="ml-10 mt-4 space-y-2" aria-label="Saran pertanyaan">
                    <p className="text-xs font-semibold text-on-surface-variant">Coba tanyakan:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void sendMessage(suggestion)}
                          disabled={isSending}
                          className="max-w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-left text-xs leading-relaxed text-primary transition-colors hover:border-secondary/50 hover:bg-secondary-fixed/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
            {error && (
              <p
                className={`mt-3 rounded-2xl border border-error/20 bg-error-container px-3 py-2 text-xs leading-relaxed text-on-error-container ${isFullscreen ? "mx-auto w-[calc(100%-2rem)] max-w-4xl sm:w-[calc(100%-4rem)]" : "ml-10"}`}
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
          <div className={`z-10 shrink-0 border-t border-outline-variant/50 bg-surface-container-lowest/95 px-3 py-3 backdrop-blur-xl ${isFullscreen ? "px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pb-7 sm:pt-5" : ""}`}>
            <div className={isFullscreen ? "mx-auto w-full max-w-4xl" : ""}>
              {isFullscreen && (
                <p className="mb-2 text-center text-[11px] text-on-surface-variant">
                  {isNewConversation ? "Ketik pertanyaan atau pilih salah satu saran di atas" : "Lanjutkan percakapan dengan Asisten AI SMKN 24"}
                </p>
              )}
              <ChatInput onSend={sendMessage} disabled={isSending} />
              {!isFullscreen && (
                <p className="mt-2 text-center text-[10px] text-on-surface-variant/75">
                  Asisten AI informasi SMKN 24 Jakarta
                </p>
              )}
            </div>
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
        disabled={isFullscreen}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_14px_34px_-10px_rgba(0,20,47,0.6)] transition duration-200 hover:-translate-y-0.5 hover:bg-primary-container focus-visible:outline-offset-4 ${isFullscreen ? "pointer-events-none scale-50 rotate-180 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
      >
        <span ref={fabIconRef} className="flex h-6 w-6 items-center justify-center">
          {isOpen ? <X aria-hidden className="h-6 w-6" /> : <MessageCircle aria-hidden className="h-6 w-6" />}
        </span>
      </button>
    </div>
  );
}
