"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { API_BASE_URL, ApiError, apiRequest } from "@/lib/api";
import type { BeritaDTO } from "@/lib/types";

type Status =
  | { state: "loading" }
  | { state: "ok"; total: number }
  | { state: "error"; message: string };

function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 0 ? error.message : `HTTP ${error.status} — ${error.message}`;
  }
  return "Terjadi kesalahan yang tidak dikenal.";
}

/**
 * Halaman fondasi (Slice 0).
 *
 * Tugasnya hanya satu: membuktikan bahwa konfigurasi environment, klien API, dan
 * koneksi ke backend PHP benar-benar bekerja. Hasil yang ditampilkan selalu data
 * nyata dari backend — tidak ada status sukses palsu saat request gagal.
 */
export default function FondasiPage() {
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiRequest<BeritaDTO[]>("/api/berita/index.php")
      .then((data) => {
        if (!cancelled) {
          setStatus({ state: "ok", total: data.length });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus({ state: "error", message: describeError(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    // setState di event handler (bukan di body effect) — lihat aturan
    // react-hooks/set-state-in-effect.
    setStatus({ state: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-space-lg px-margin-mobile py-space-2xl md:px-margin-tablet">
      <header className="space-y-space-xs">
        <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
          Fondasi Dashboard
        </span>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">
          Dashboard Admin SMK Negeri 24 Jakarta
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Tahap Slice 0 — kerangka aplikasi, token visual bersama, dan klien API ke
          backend PHP. Halaman uji ini akan digantikan oleh login dan shell dashboard
          pada Slice 1.
        </p>
      </header>

      <section
        aria-live="polite"
        className="space-y-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"
      >
        <h2 className="font-title-md text-title-md font-bold text-primary">
          Uji koneksi backend
        </h2>

        <dl className="grid grid-cols-1 gap-space-xs font-body-sm text-body-sm sm:grid-cols-[10rem_1fr]">
          <dt className="font-bold text-on-surface-variant">Base URL API</dt>
          <dd className="break-all text-on-surface">{API_BASE_URL}</dd>
          <dt className="font-bold text-on-surface-variant">Endpoint uji</dt>
          <dd className="text-on-surface">GET /api/berita/index.php</dd>
        </dl>

        <div className="flex items-start gap-space-sm rounded-xl border border-surface-container bg-surface-container-low p-space-md">
          {status.state === "loading" && (
            <>
              <Loader2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" />
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Menghubungi backend…
              </p>
            </>
          )}

          {status.state === "ok" && (
            <>
              <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="font-body-sm text-body-sm text-on-surface">
                Terhubung. Backend mengembalikan{" "}
                <strong className="tabular-nums">{status.total}</strong> berita terbit.
              </p>
            </>
          )}

          {status.state === "error" && (
            <>
              <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-error" />
              <div className="space-y-space-2xs">
                <p className="font-body-sm text-body-sm font-bold text-error">
                  Gagal terhubung ke backend
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {status.message}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Periksa: backend PHP aktif, database sudah di-import, dan{" "}
                  <code className="rounded bg-surface-container px-1">NEXT_PUBLIC_API_URL</code>{" "}
                  pada{" "}
                  <code className="rounded bg-surface-container px-1">
                    apps/admin/.env.local
                  </code>{" "}
                  sudah benar.
                </p>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={reload}
          disabled={status.state === "loading"}
          className="inline-flex items-center gap-space-xs rounded-lg bg-primary px-space-md py-2.5 font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw aria-hidden className="h-4 w-4" />
          Uji ulang koneksi
        </button>
      </section>

      <section className="space-y-space-xs rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
        <h2 className="font-title-md text-title-md font-bold text-primary">
          Langkah berikutnya
        </h2>
        <ol className="list-decimal space-y-1 pl-5 font-body-sm text-body-sm text-on-surface-variant">
          <li>Slice 1 — login JWT, auth guard, shell sidebar, overview.</li>
          <li>Slice 2 — pengumuman, berita &amp; highlight, agenda, upload gambar.</li>
          <li>Slice 3 — guru, fasilitas, galeri, jadwal.</li>
          <li>Slice 4 — arsip akademik, inbox BK &amp; aspirasi, riwayat chatbot.</li>
        </ol>
      </section>
    </main>
  );
}

