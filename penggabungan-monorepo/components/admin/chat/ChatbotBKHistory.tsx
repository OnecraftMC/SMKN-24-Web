"use client";

/**
 * Panel "Chatbot-BK" untuk halaman Riwayat Chatbot (`/admin/chat`).
 *
 * Menampilkan dua hal:
 *  1. Analytics notifikasi otomatis ke Guru BK (angka nyata dari jejak
 *     `bk_wa_alert` + antrean `pesan_bk`).
 *  2. Riwayat entri otomatis — setiap notifikasi yang pernah dicoba, dengan
 *     badge sumber "Otomatis" supaya jelas ini bukan percakapan pengunjung.
 *
 * Semua angka berasal dari backend (`/api/chat/analytics.php` → `chatbotBK`).
 * Tidak ada status karangan: kolom status memakai nilai yang benar-benar
 * tersimpan di database.
 */

import { useState } from "react";
import { BellRing, ChevronDown, ChevronUp, MessageCircle, ShieldAlert } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { ChatbotBKAnalytics, ChatbotBKEntry } from "@/lib/admin/types";

const GAYA_STATUS: Record<string, string> = {
  Terkirim: "bg-primary-container text-on-primary-container",
  Gagal: "bg-error-container text-on-error-container",
  Dilewati: "bg-surface-container-highest text-on-surface-variant",
};

/** Format tanggal MySQL ("2026-10-20 14:32:10") -> "20 Okt 2026, 14.32". */
function formatTanggal(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!match) return value;
  const [, y, m, d, hh, mm] = match;
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ][Number(m) - 1];
  return `${Number(d)} ${bulan} ${y}, ${hh}.${mm}`;
}

function Kartu({
  label,
  nilai,
  hint,
}: {
  label: string;
  nilai: string;
  hint?: string;
}) {
  return (
    <article className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
      <p className="font-label-sm text-label-sm font-bold text-on-surface-variant">{label}</p>
      <p className="mt-1 tabular-nums font-headline-sm text-headline-sm font-bold text-primary">{nilai}</p>
      {hint && <p className="font-body-sm text-body-sm text-on-surface-variant">{hint}</p>}
    </article>
  );
}

function EntriOtomatis({ entry }: { entry: ChatbotBKEntry }) {
  const [buka, setBuka] = useState(false);
  const gaya = GAYA_STATUS[entry.status] ?? GAYA_STATUS.Dilewati;

  return (
    <li className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" label="Otomatis" />
          <Badge variant="adat" className={gaya} label={entry.status} />
        </div>
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          {formatTanggal(entry.tanggal)}
        </span>
      </div>

      <p className="mt-2 font-body-sm text-body-sm text-on-surface">
        {entry.jumlahLaporan} laporan berat terbuka
        {entry.target ? ` · dikirim ke ${entry.target}` : ""}
      </p>

      {entry.error && (
        <p className="mt-1 font-body-sm text-body-sm text-on-error-container">{entry.error}</p>
      )}

      {entry.pesan && (
        <>
          <button
            type="button"
            onClick={() => setBuka((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 font-label-sm text-label-sm font-bold text-primary hover:underline"
          >
            {buka ? <ChevronUp aria-hidden className="h-4 w-4" /> : <ChevronDown aria-hidden className="h-4 w-4" />}
            {buka ? "Sembunyikan pesan" : "Lihat pesan"}
          </button>
          {buka && (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-surface-container p-space-sm font-body-sm text-body-sm text-on-surface">
              {entry.pesan}
            </pre>
          )}
        </>
      )}
    </li>
  );
}


export default function ChatbotBKHistory({
  data,
  view = "all",
}: {
  data: ChatbotBKAnalytics;
  view?: "all" | "summary" | "history";
}) {
  const adaRiwayat = data.riwayat.length > 0;
  const tampilkanMetrik = view !== "history";
  const tampilkanRiwayat = view !== "summary";

  return (
    <section
      aria-label={view === "history" ? "Riwayat notifikasi otomatis" : "Chatbot-BK"}
      className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"
    >
      {view !== "history" ? (
        <div className="flex flex-wrap items-start justify-between gap-space-sm">
          <div>
            <h2 className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <BellRing aria-hidden className="h-5 w-5 text-primary" />
              Chatbot-BK
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Notifikasi otomatis {data.pengirim} ke Guru BK untuk laporan yang perlu
              intervensi manusia.
            </p>
          </div>
          <Badge
            variant={data.aktif ? "infoSoft" : "neutral"}
            label={data.aktif ? "Aktif" : "Nonaktif"}
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-space-sm">
          <div>
            <h2 className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <MessageCircle aria-hidden className="h-5 w-5 text-primary" />
              Riwayat Entri Otomatis
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Jejak notifikasi otomatis yang dikirim ke Guru BK pada periode terpilih.
            </p>
          </div>
          <Badge
            variant={data.aktif ? "infoSoft" : "neutral"}
            label={data.aktif ? "Aktif" : "Nonaktif"}
          />
        </div>
      )}

      {tampilkanMetrik && <div className="mt-space-md grid grid-cols-1 gap-space-sm sm:grid-cols-2 xl:grid-cols-4">
        <Kartu
          label="Notifikasi Terkirim"
          nilai={String(data.terkirim)}
          hint={`${data.totalNotifikasi} percobaan pada periode ini`}
        />
        <Kartu
          label="Gagal / Dilewati"
          nilai={`${data.gagal} / ${data.dilewati}`}
          hint="Percobaan yang tidak sampai ke Guru BK"
        />
        <Kartu
          label="Kasus Perlu Intervensi"
          nilai={String(data.perluIntervensi)}
          hint={`${data.laporanAktif} laporan aktif · ${data.sudahDitangani} ditangani`}
        />
        <Kartu
          label="Notifikasi Terakhir"
          nilai={data.terakhirKirim ? formatTanggal(data.terakhirKirim) : "Belum ada"}
          hint={data.terakhirStatus ? `Status: ${data.terakhirStatus}` : `Ambang eskalasi: ${data.ambang}`}
        />
      </div>}

      {tampilkanRiwayat && <div className={view === "history" ? "mt-space-md" : "mt-space-lg"}>
        {view !== "history" && (
          <>
            <h3 className="flex items-center gap-2 font-title-md text-title-md font-bold text-on-surface">
              <MessageCircle aria-hidden className="h-4 w-4 text-primary" />
              Riwayat Entri Otomatis
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Jejak notifikasi otomatis yang dikirim ke Guru BK pada periode terpilih.
            </p>
          </>
        )}
        {!adaRiwayat ? (
          <p className="mt-space-sm font-body-sm text-body-sm italic text-on-surface-variant">
            Belum ada notifikasi otomatis pada periode ini.
          </p>
        ) : (
          <ul className="mt-space-sm space-y-space-sm">
            {data.riwayat.map((entry) => (
              <EntriOtomatis key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </div>}

      {tampilkanMetrik && data.perluIntervensi > 0 && (
        <p className="mt-space-md flex items-start gap-2 rounded-xl bg-error-container/40 p-space-sm font-body-sm text-body-sm text-on-error-container">
          <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Ada {data.perluIntervensi} laporan terbuka yang ditandai perlu intervensi.
          Tinjau dan ubah statusnya di halaman Inbox BK agar Chatbot-BK berhenti
          menambahkan eskalasi.
        </p>
      )}
    </section>
  );
}
