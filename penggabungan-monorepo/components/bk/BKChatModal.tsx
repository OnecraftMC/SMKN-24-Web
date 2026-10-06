"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { API_BASE_URL } from "@/lib/admin/api";
import { getDeviceId } from "./device";
import BKHistoryPanel from "./BKHistoryPanel";

type Sender = "user" | "bot";
type Message = { id: string; sender: Sender; text: string };
type PhotoEvidence = { file: File; preview: string };
type AudioEvidence = { file: File; preview: string };

const subscribeToNothing = () => () => {};

const GREETING =
  "Halo, selamat datang di layanan Bimbingan Konseling SMKN 24 Jakarta. " +
  "Aku di sini untuk mendengarkan. Ceritakan saja apa yang sedang kamu rasakan.";
const CLOSING =
  "Percakapanmu sudah dikirim ke Guru BK beserta ringkasannya dan lampiran yang kamu pilih.";
const MAX_PHOTOS = 2;

export default function BKChatModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "greeting", sender: "bot", text: GREETING },
  ]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const [tab, setTab] = useState<"chat" | "riwayat">("chat");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [photos, setPhotos] = useState<PhotoEvidence[]>([]);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioClip, setAudioClip] = useState<AudioEvidence | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | null>(null);

  const closeModal = useCallback(() => {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.onstop = null;
      recorder.stop();
    }
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, done]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!cropSource) return;
    return () => URL.revokeObjectURL(cropSource);
  }, [cropSource]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 120);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [open, closeModal]);

  if (!open || !mounted) return null;

  const sendDraft = async () => {
    const text = draft.trim();
    if (!text || done || isSending) return;

    const userMessage: Message = { id: `u-${Date.now()}`, sender: "user", text };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setDraft("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/bk/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          messages: conversation.map(({ sender, text: messageText }) => ({
            sender,
            text: messageText,
          })),
        }),
      });
      const result: unknown = await response.json().catch(() => null);
      const reply =
        typeof result === "object" && result !== null && "message" in result &&
        typeof result.message === "string"
          ? result.message
          : null;
      if (!response.ok || !reply) {
        throw new Error(
          typeof result === "object" && result !== null && "error" in result &&
          typeof result.error === "string"
            ? result.error
            : `Server merespons HTTP ${response.status}.`,
        );
      }
      setMessages((previous) => [
        ...previous,
        { id: `b-${Date.now()}`, sender: "bot", text: reply },
      ]);
    } catch (sendError) {
      setMessages((previous) => previous.filter((message) => message.id !== userMessage.id));
      setDraft(text);
      setError(sendError instanceof Error ? sendError.message : "Pesan belum terkirim. Coba lagi.");
    } finally {
      setIsSending(false);
    }
  };

  const submitCerita = async () => {
    const hasUserText = messages.some((message) => message.sender === "user");
    if ((!hasUserText && photos.length === 0 && !audioClip) || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("payload", JSON.stringify({
        mode: "finalize",
        messages: messages.map(({ sender, text }) => ({ sender, text })),
        deviceId: getDeviceId(),
      }));
      photos.forEach(({ file }) => form.append("photos[]", file));
      if (audioClip) form.append("audio", audioClip.file);

      const response = await fetch(`${API_BASE_URL}/api/bk/chat/index.php`, {
        method: "POST",
        body: form,
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "error" in result &&
          typeof result.error === "string"
            ? result.error
            : `Server merespons HTTP ${response.status}.`;
        throw new Error(message);
      }

      setMessages((previous) => [
        ...previous,
        { id: `closing-${Date.now()}`, sender: "bot", text: CLOSING },
      ]);
      setDone(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Laporan belum terkirim. Coba lagi.");
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Perekaman suara tidak didukung browser ini.");
      return;
    }
    let stream: MediaStream | null = null;
    try {
      const activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream = activeStream;
      const preferredMime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
        .find((mime) => MediaRecorder.isTypeSupported(mime));
      const recorder = preferredMime
        ? new MediaRecorder(activeStream, { mimeType: preferredMime })
        : new MediaRecorder(activeStream);
      audioChunksRef.current = [];
      recordingStreamRef.current = activeStream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (recordingTimeoutRef.current !== null) {
          window.clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        setIsRecording(false);
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        activeStream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        if (blob.size > 10 * 1024 * 1024) {
          if (audioClip) URL.revokeObjectURL(audioClip.preview);
          setAudioClip(null);
          setError("Pesan suara maksimal 10 MB. Rekam ulang dengan durasi lebih singkat.");
          return;
        }
        if (blob.size > 0) {
          const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
          const file = new File([blob], `pesan-suara.${extension}`, { type: blob.type });
          if (audioClip) URL.revokeObjectURL(audioClip.preview);
          setAudioClip({ file, preview: URL.createObjectURL(file) });
        }
      };
      recorder.start();
      setIsRecording(true);
      recordingTimeoutRef.current = window.setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 180_000);
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      setError("Mikrofon tidak dapat diakses. Periksa izin browser lalu coba lagi.");
    }
  };

  const stopRecording = () => {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setIsRecording(false);
  };

  const selectPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError("Pilih foto JPG, PNG, atau WEBP dengan ukuran maksimal 10 MB sebelum crop.");
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      setError("Maksimal dua foto bukti.");
      return;
    }
    setError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropSource(URL.createObjectURL(file));
  };

  const savePhotoCrop = async () => {
    if (!cropSource || !croppedArea) return;
    try {
      const image = new window.Image();
      image.src = cropSource;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Foto tidak dapat dibuka."));
      });
      const scale = Math.min(1, 1920 / Math.max(croppedArea.width, croppedArea.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(croppedArea.width * scale));
      canvas.height = Math.max(1, Math.round(croppedArea.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser tidak dapat memproses foto.");
      context.drawImage(
        image,
        croppedArea.x,
        croppedArea.y,
        croppedArea.width,
        croppedArea.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error("Foto hasil crop gagal dibuat.")),
          "image/jpeg",
          0.88,
        );
      });
      if (blob.size > 5 * 1024 * 1024) throw new Error("Hasil crop foto melebihi 5 MB.");
      const file = new File([blob], `bukti-${photos.length + 1}.jpg`, { type: "image/jpeg" });
      setPhotos((previous) => [...previous, { file, preview: URL.createObjectURL(file) }]);
      setCropSource(null);
      setCroppedArea(null);
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "Gagal memotong foto.");
    }
  };

  const panicExit = () => {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.onstop = null;
      recorder.stop();
    }
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioChunksRef.current = [];
    window.close();
    window.location.replace("about:blank");
  };

  return createPortal(
    <div className={isFullscreen ? "fixed inset-0 z-[70] flex" : "fixed inset-0 z-[60] flex items-end justify-center sm:items-center"}>
      <button
        type="button"
        aria-label="Tutup layanan Bimbingan Konseling"
        onClick={closeModal}
        className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Layanan Bimbingan Konseling"
        className={isFullscreen
          ? "relative flex h-full w-full flex-col overflow-hidden bg-surface-container-lowest"
          : "relative flex h-[88vh] max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface-container-lowest shadow-2xl sm:h-[40rem] sm:max-w-lg sm:rounded-3xl"}
      >
        <div className="relative shrink-0 overflow-hidden rounded-t-[28px] bg-gradient-to-br from-secondary-container via-secondary-container to-tertiary-container px-5 pb-5 pt-5 text-on-secondary-container">
          <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/25 backdrop-blur">
                <span className="material-symbols-outlined text-[22px]">forum</span>
              </span>
              <div className="min-w-0">
                <h2 className="font-headline-sm text-headline-sm font-bold leading-tight">Bimbingan Konseling</h2>
                <p className="font-label-sm text-label-sm opacity-90">Ceritakan apa yang kamu rasakan.</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={panicExit}
                aria-label="Panik, tutup halaman sekarang"
                className="rounded-full bg-red-700 px-3 py-2 text-xs font-bold text-white shadow hover:bg-red-800"
              >
                PANIK
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen((value) => !value)}
                aria-label={isFullscreen ? "Keluar dari layar penuh" : "Layar penuh"}
                className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-black/10"
              >
                <span className="material-symbols-outlined text-[20px]">{isFullscreen ? "close_fullscreen" : "fullscreen"}</span>
              </button>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Tutup"
                className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-black/10"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          <div className="relative mt-4 inline-flex rounded-full bg-white/20 p-1">
            {([
              { key: "chat", label: "Ceritakan" },
              { key: "riwayat", label: "Riwayat" },
            ] as const).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                aria-pressed={tab === item.key}
                className={`rounded-full px-4 py-1.5 font-label-sm text-label-sm font-bold transition-all ${
                  tab === item.key ? "bg-white text-secondary shadow-sm" : "text-on-secondary-container/80"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "riwayat" ? (
          <BKHistoryPanel onMulaiBaru={() => setTab("chat")} />
        ) : (
          <>
            <div ref={listRef} className="flex-1 overflow-y-auto bg-surface-container-low px-4 py-5">
              <div className="mx-auto w-full max-w-2xl space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {message.sender === "bot" && (
                      <span className="mr-2 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-secondary-container to-tertiary-container">
                        <span className="material-symbols-outlined text-[15px] text-on-secondary-container">psychology</span>
                      </span>
                    )}
                    <div className={message.sender === "user"
                      ? "max-w-[80%] rounded-[22px] rounded-br-md bg-gradient-to-br from-primary to-primary/90 px-4 py-2.5 text-sm leading-relaxed text-surface shadow-sm"
                      : "max-w-[80%] rounded-[22px] rounded-bl-md bg-surface-container-lowest px-4 py-2.5 text-sm leading-relaxed text-on-surface shadow-sm ring-1 ring-surface-container"}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start" role="status" aria-label="Konselor AI sedang membalas">
                    <div className="rounded-[22px] bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant shadow-sm ring-1 ring-surface-container">
                      Konselor AI sedang membaca…
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-surface-container px-4 py-3">
              <div className="mx-auto w-full max-w-2xl space-y-2">
                {error && <p role="alert" className="px-1 text-sm text-error">{error}</p>}

                {photos.length > 0 && (
                  <div className="flex gap-2" aria-label="Foto bukti yang akan dikirim">
                    {photos.map((photo, index) => (
                      <div key={photo.preview} className="relative">
                        {/* local object URL is only a preview of the selected evidence */}
                        <Image
                          src={photo.preview}
                          alt={`Pratinjau foto bukti ${index + 1}`}
                          width={80}
                          height={64}
                          unoptimized
                          className="h-16 w-20 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(photo.preview);
                            setPhotos((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
                          }}
                          aria-label={`Hapus foto bukti ${index + 1}`}
                          className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-error text-on-error"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {audioClip && (
                  <div className="flex items-center gap-2 rounded-xl bg-surface-container-low p-2">
                    <audio controls src={audioClip.preview} className="h-9 min-w-0 flex-1" aria-label="Pratinjau pesan suara" />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(audioClip.preview);
                        setAudioClip(null);
                      }}
                      className="text-xs font-bold text-error"
                    >
                      Hapus
                    </button>
                  </div>
                )}

                {done ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="px-1 text-sm text-on-surface-variant">Percakapan tercatat dan diteruskan ke Guru BK.</p>
                    <button type="button" onClick={onClose} className="shrink-0 rounded-lg bg-primary px-5 py-2.5 font-label-md font-bold text-surface">
                      Selesai
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end gap-2 rounded-[26px] bg-surface-container-lowest p-2 shadow-sm ring-1 ring-surface-container focus-within:ring-2 focus-within:ring-primary/60">
                      <textarea
                        ref={inputRef}
                        value={draft}
                        rows={1}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void sendDraft();
                          }
                        }}
                        placeholder="Tulis apa yang sedang kamu rasakan…"
                        className="max-h-32 min-h-[2.75rem] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void sendDraft()}
                        disabled={!draft.trim() || isSending}
                        aria-label="Kirim pesan ke konselor AI"
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-secondary-container to-tertiary-container text-on-secondary-container disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                      </button>
                    </div>

                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        selectPhoto(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={photos.length >= MAX_PHOTOS || isSending}
                        className="rounded-full border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface disabled:opacity-40"
                      >
                        Tambah foto ({photos.length}/{MAX_PHOTOS})
                      </button>
                      {isRecording ? (
                        <button type="button" onClick={stopRecording} className="rounded-full bg-error px-3 py-2 text-xs font-bold text-on-error">
                          Hentikan rekaman
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void startRecording()}
                          disabled={Boolean(audioClip) || isSending}
                          className="rounded-full border border-outline-variant px-3 py-2 text-xs font-semibold text-on-surface disabled:opacity-40"
                        >
                          Rekam pesan suara
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Foto dapat di-crop sebelum dikirim. Audio direkam untuk didengarkan Guru BK dan tidak ditranskripsikan AI.
                    </p>

                    <button
                      type="button"
                      onClick={() => void submitCerita()}
                      disabled={isSending || (!messages.some((message) => message.sender === "user") && photos.length === 0 && !audioClip)}
                      className="w-full rounded-full bg-primary px-5 py-3 font-label-md font-bold text-surface shadow-sm disabled:opacity-40"
                    >
                      {isSending ? "Mengirim…" : "Selesai, kirim ringkasan ke Guru BK"}
                    </button>
                    <p className="text-center text-xs text-on-surface-variant">
                      Tombol ini mengakhiri chat, membuat ringkasan, dan mengirim seluruh percakapan serta lampiran ke Guru BK.
                    </p>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {cropSource && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
          <div className="flex w-full max-w-xl flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4">
            <h3 className="font-bold text-on-surface">Pilih bagian foto bukti</h3>
            <div className="relative h-[55vh] min-h-64 overflow-hidden rounded-xl bg-black">
              <Cropper
                image={cropSource}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedArea(areaPixels)}
              />
            </div>
            <label className="text-sm text-on-surface">
              Perbesar foto
              <input
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="mt-1 block w-full"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCropSource(null)} className="rounded-lg px-4 py-2 text-sm font-semibold">
                Batal
              </button>
              <button type="button" onClick={() => void savePhotoCrop()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-surface">
                Gunakan foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
