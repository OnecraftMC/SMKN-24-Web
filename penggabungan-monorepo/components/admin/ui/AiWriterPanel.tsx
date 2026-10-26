"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Sparkles, TriangleAlert, Volume2, VolumeX, Wand2 } from "lucide-react";
import { apiRequest, isUnauthorized } from "@/lib/admin/api";
import { buttonGhostClass, fieldClass, labelClass } from "./FormBits";

/**
 * Modul yang punya draf AI.
 *
 * Hanya modul yang isinya TEKS NARATIF yang layak ditulis draf AI. Modul dengan
 * data faktual/terstruktur (jadwal: jam & mapel, guru: nama orang, arsip:
 * metadata berkas) SENGAJA tidak ada di sini karena mengarang nilai seperti itu
 * justru berbahaya.
 *
 * Field tanggal juga tidak ada di daftar ini — tanggal diisi admin, bukan AI.
 */
export type AiDraftModule =
  | "berita"
  | "pengumuman"
  | "agenda"
  | "fasilitas"
  | "guru"
  | "galeri";

export type BeritaDraft = {
  judul: string;
  ringkasan: string;
  isi: string;
};

export type PengumumanDraft = {
  judul: string;
  isi: string;
  badge: string;
  status: string;
};

export type AgendaDraft = {
  judul: string;
  badge: string;
  lokasi: string;
  deskripsi: string;
};

export type FasilitasDraft = {
  judul: string;
  deskripsi: string;
};

export type GuruDraft = {
  jabatan: string;
  deskripsi: string;
};

/**
 * Galeri hanya punya judul + gambar. AI tidak menyusun gambarnya: model hanya
 * diminta judul foto yang deskriptif, dan admin tetap memilih berkas gambarnya.
 */
export type GaleriDraft = {
  judul: string;
};

/** Payloads apa pun yang bisa terisi ke form admin. */
export type AiDraft =
  | BeritaDraft
  | PengumumanDraft
  | AgendaDraft
  | FasilitasDraft
  | GuruDraft
  | GaleriDraft;

type AiResponse<D> = {
  draf: D;
  aiAvailable: boolean;
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};

type SpeechRecognitionErrorEvent = { error: string };

type SpeechRecognitionController = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionController;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const COPY: Record<AiDraftModule, { title: string; placeholder: string; hint: string }> = {
  berita: {
    title: "Susun draf berita dengan AI",
    placeholder:
      "Contoh: Pameran karya siswa kelas XII TKU di aula sekolah, dibuka untuk umum.",
    hint:
      "Sebutkan fakta utama. Tambahkan arahan panjang, nada, pembaca, atau susunan yang Anda inginkan. Tanggal tetap Anda yang isi.",
  },
  pengumuman: {
    title: "Susun draf pengumuman dengan AI",
    placeholder:
      "Contoh: Pendaftaran ujian remedial kelas X dibuka sampai akhir bulan.",
    hint:
      "Sebutkan fakta dan tujuan pengumuman. Tambahkan arahan panjang, nada, dan pembaca yang Anda inginkan. Tanggal tetap Anda yang isi.",
  },
  agenda: {
    title: "Susun draf agenda dengan AI",
    placeholder:
      "Contoh: Lomba antar kelas untuk siswa kelas X, terbuka untuk seluruh warga sekolah.",
    hint:
      "Tuliskan fakta kegiatan serta arahan panjang, nada, pembaca, atau fokus yang Anda inginkan.",
  },
  fasilitas: {
    title: "Susun draf fasilitas dengan AI",
    placeholder:
      "Contoh: Laboratorium komputer untuk praktikum Syntax Graphic.",
    hint:
      "Tuliskan nama dan fungsi fasilitas serta arahan tentang fokus dan panjang deskripsi.",
  },
  guru: {
    title: "Susun draf profil guru dengan AI",
    placeholder:
      "Contoh: Guru Bahasa Indonesia dengan pengalaman mengajar 12 tahun.",
    hint:
      "Tuliskan jabatan dan fakta yang boleh dimuat, lalu arahkan nada atau panjang profil. Nama dan foto tetap Anda yang isi.",
  },
  galeri: {
    title: "Susun judul galeri dengan AI",
    placeholder:
      "Contoh: Guru dan siswa saat-Upacara Bendera bersama di lapangan sekolah.",
    hint:
      "Tuliskan isi foto serta gaya judul yang Anda inginkan. Gambar tetap Anda yang unggah.",
  },
};

/**
 * Panel draf AI untuk dialog admin.
 *
 * Prinsipnya: AI hanya MENGISI FIELD FORM, tidak pernah menyimpan. Hasil draf
 * masuk ke state form yang sedang diedit, jadi admin tetap menekan tombol Simpan
 * seperti biasa dan selalu punya kesempatan membaca serta memperbaiki isi.
 *
 * Status `aiAvailable` dari backend dihormati apa adanya — kalau provider belum
 * dikonfigurasi, panel menampilkan pesan jujur dan tidak pernah mengisi apa pun.
 */
export default function AiWriterPanel<D extends AiDraft>({
  module,
  label,
  onApply,
  onUnauthorized,
  disabled,
}: {
  module: AiDraftModule;
  /** Nama field yang akan diisi, dipakai untuk pesan aksesibilitas. */
  label: string;
  onApply: (draf: D) => void;
  onUnauthorized: () => void;
  /** Nonaktifkan ketika form sedang menyimpan atau draf sedang dibuat. */
  disabled?: boolean;
}) {
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [draftSpeechText, setDraftSpeechText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionController | null>(null);

  const copy = COPY[module];
  const catatanId = `ai-catatan-${module}`;
  const statusId = `ai-status-${module}`;

  useEffect(() => () => {
    recognitionRef.current?.abort();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function startDictation() {
    if (typeof window === "undefined") return;
    const speechWindow = window as WindowWithSpeechRecognition;
    const SpeechRecognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Browser ini belum mendukung pengenalan suara. Gunakan Chrome atau masukkan catatan dengan mengetik.");
      setVoiceStatus(null);
      return;
    }

    setError(null);
    setSukses(null);
    setVoiceStatus("Meminta akses mikrofon…");
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    recognition.onresult = (event) => {
      const spokenText = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (spokenText) {
        setCatatan((current) => `${current.trim()}${current.trim() ? " " : ""}${spokenText}`.slice(0, 4000));
        setVoiceStatus("Ucapan sudah ditambahkan ke catatan. Periksa teksnya, lalu jalankan AI.");
      }
    };
    recognition.onerror = (event) => {
      const message = event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Akses mikrofon ditolak. Izinkan mikrofon di pengaturan browser, lalu coba lagi."
        : event.error === "audio-capture"
          ? "Mikrofon tidak ditemukan atau sedang tidak tersedia."
          : event.error === "network"
            ? "Layanan pengenalan suara browser tidak dapat dihubungi."
            : "Ucapan belum dapat dikenali. Silakan coba lagi atau ketik catatan.";
      setError(message);
      setVoiceStatus(null);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      setVoiceStatus((current) =>
        current === "Meminta akses mikrofon…" || current === "Mendengarkan… ucapkan catatan untuk AI."
          ? null
          : current,
      );
    };

    try {
      recognition.start();
      setListening(true);
      setVoiceStatus("Mendengarkan… ucapkan catatan untuk AI.");
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setError("Mikrofon belum siap. Coba lagi dan pastikan izin mikrofon tersedia.");
      setVoiceStatus(null);
    }
  }

  function stopDictation() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function toggleDraftSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError("Fitur suara keluaran tidak tersedia di browser ini.");
      return;
    }
    const speech = window.speechSynthesis;
    if (speaking) {
      speech.cancel();
      setSpeaking(false);
      return;
    }
    if (!draftSpeechText) return;

    speech.cancel();
    const utterance = new SpeechSynthesisUtterance(draftSpeechText);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;
    const indonesianVoice = speech.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("id"));
    if (indonesianVoice) utterance.voice = indonesianVoice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setError("Draf tidak dapat dibacakan. Coba lagi atau gunakan fitur suara browser.");
    };
    speech.speak(utterance);
  }

  async function generate() {
    if (catatan.trim() === "" || busy) {
      return;
    }

    setError(null);
    setSukses(null);
    setDraftSpeechText("");
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setBusy(true);

    try {
      const result = await apiRequest<AiResponse<D>>("/api/ai/index.php", {
        method: "POST",
        body: { modul: module, catatan: catatan.trim() },
      });

      // `aiAvailable` bisa tidak ada bila backend versi lama; perlakukan field
      // yang tidak ada sebagai tersedia (kompatibel), tapi hormati false.
      if (result.aiAvailable === false) {
        setError("Fitur draf AI sedang tidak tersedia. Silakan tulis manual.");
        return;
      }

      onApply(result.draf);
      const readableDraft = Object.values(result.draf as Record<string, unknown>)
        .filter((value): value is string => typeof value === "string" && value.trim() !== "")
        .join(". ");
      setDraftSpeechText(readableDraft);
      setSpeaking(false);
      setSukses(`Draf ${label} terisi. Periksa dan perbaiki sebelum menyimpan.`);
    } catch (err) {
      if (isUnauthorized(err)) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal membuat draf AI.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby={`ai-heading-${module}`}
      className="rounded-xl border border-outline-variant bg-surface-container-low/60 p-space-md"
    >
      <h3
        id={`ai-heading-${module}`}
        className="flex items-center gap-space-xs font-title-md text-title-md font-bold text-on-surface"
      >
        <Sparkles aria-hidden className="h-4 w-4 text-primary" />
        {copy.title}
      </h3>
      <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{copy.hint}</p>

      <div className="mt-space-sm">
        <label htmlFor={catatanId} className={labelClass}>
          Catatan dan arahan admin untuk AI
        </label>
        <textarea
          id={catatanId}
          rows={3}
          className={fieldClass}
          value={catatan}
          maxLength={4000}
          placeholder={`${copy.placeholder} Tambahkan arahan seperti panjang tulisan, nada, pembaca, dan informasi yang perlu ditonjolkan.`}
          aria-describedby={statusId}
          disabled={disabled || busy}
          onChange={(e) => setCatatan(e.target.value)}
        />
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Maksimal 4.000 karakter. Arahan tentang panjang, gaya bahasa, target pembaca, dan susunan tulisan akan diikuti selama tidak meminta AI mengarang fakta. Dikte memakai layanan suara browser/perangkat dan memerlukan izin mikrofon.
        </p>
      </div>

      <div className="mt-space-sm flex flex-wrap items-center gap-space-sm">
        <button
          type="button"
          onClick={listening ? stopDictation : startDictation}
          disabled={disabled || busy}
          aria-pressed={listening}
          className={buttonGhostClass}
        >
          {listening ? <MicOff aria-hidden className="h-4 w-4" /> : <Mic aria-hidden className="h-4 w-4" />}
          {listening ? "Hentikan mikrofon" : "Perintah dengan suara"}
        </button>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={disabled || busy || catatan.trim() === ""}
          className={buttonGhostClass}
        >
          {busy ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 aria-hidden className="h-4 w-4" />
          )}
          {busy ? "Menyusun draf…" : "Buat draf dengan AI"}
        </button>
        {draftSpeechText && (
          <button
            type="button"
            onClick={toggleDraftSpeech}
            disabled={disabled || busy}
            aria-pressed={speaking}
            className={buttonGhostClass}
          >
            {speaking ? <VolumeX aria-hidden className="h-4 w-4" /> : <Volume2 aria-hidden className="h-4 w-4" />}
            {speaking ? "Hentikan suara" : "Dengarkan draf"}
          </button>
        )}
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          Draf hanya mengisi form. Tidak tersimpan otomatis.
        </span>
      </div>

      <div id={statusId} aria-live="polite" className="mt-space-sm space-y-space-xs">
        {voiceStatus && <p className="font-body-sm text-body-sm text-on-surface-variant">{voiceStatus}</p>}
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-error-container px-space-md py-space-sm font-body-sm text-body-sm text-on-error-container"
          >
            <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {sukses && (
          <p className="rounded-lg bg-secondary-container px-space-md py-space-sm font-body-sm text-body-sm text-on-secondary-container">
            {sukses}
          </p>
        )}
      </div>
    </section>
  );
}
