"use client";

import { useState } from "react";
import { Loader2, Sparkles, TriangleAlert, Wand2 } from "lucide-react";
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

const COPY: Record<AiDraftModule, { title: string; placeholder: string; hint: string }> = {
  berita: {
    title: "Susun draf berita dengan AI",
    placeholder:
      "Contoh: Pameran karya siswa kelas XII TKU di aula sekolah, dibuka untuk umum.",
    hint:
      "Tuliskan inti acaranya. AI menyusun judul, ringkasan, dan isi berita. Tanggal tetap Anda yang isi.",
  },
  pengumuman: {
    title: "Susun draf pengumuman dengan AI",
    placeholder:
      "Contoh: Pendaftaran ujian remedial kelas X dibuka sampai akhir bulan.",
    hint:
      "Tuliskan isi pengumuman. AI menyusun judul, isi, dan label singkat. Tanggal tetap Anda yang isi.",
  },
  agenda: {
    title: "Susun draf agenda dengan AI",
    placeholder:
      "Contoh: Lomba antar kelas untuk siswa kelas X, terbuka untuk seluruh warga sekolah.",
    hint:
      "Tuliskan jenis kegiatan dan pesertanya. AI menyusun judul, badge, lokasi, dan deskripsi.",
  },
  fasilitas: {
    title: "Susun draf fasilitas dengan AI",
    placeholder:
      "Contoh: Laboratorium komputer untuk praktikum Syntax Graphic.",
    hint:
      "Tuliskan nama dan fungsi fasilitas. AI menyusun judul dan deskripsi singkat.",
  },
  guru: {
    title: "Susun draf profil guru dengan AI",
    placeholder:
      "Contoh: Guru Bahasa Indonesia dengan pengalaman mengajar 12 tahun.",
    hint:
      "Tuliskan jabatan dan pengalaman. AI menyusun deskripsi profil. Nama dan foto tetap Anda yang isi.",
  },
  galeri: {
    title: "Susun judul galeri dengan AI",
    placeholder:
      "Contoh: Guru dan siswa saat-Upacara Bendera bersama di lapangan sekolah.",
    hint:
      "Tuliskan isi kegiatan dalam foto. AI menyusun judul foto. Gambar tetap Anda yang unggah.",
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

  const copy = COPY[module];
  const catatanId = `ai-catatan-${module}`;
  const statusId = `ai-status-${module}`;

  async function generate() {
    if (catatan.trim() === "" || busy) {
      return;
    }

    setError(null);
    setSukses(null);
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
          Catatan untuk AI
        </label>
        <textarea
          id={catatanId}
          rows={3}
          className={fieldClass}
          value={catatan}
          maxLength={2000}
          placeholder={copy.placeholder}
          aria-describedby={statusId}
          disabled={disabled || busy}
          onChange={(e) => setCatatan(e.target.value)}
        />
      </div>

      <div className="mt-space-sm flex flex-wrap items-center gap-space-sm">
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
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          Draf hanya mengisi form. Tidak tersimpan otomatis.
        </span>
      </div>

      <div id={statusId} aria-live="polite" className="mt-space-sm space-y-space-xs">
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
