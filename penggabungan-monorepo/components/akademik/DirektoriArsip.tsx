"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Search } from "lucide-react";
import type { ArsipPublicDTO } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DirektoriArsip({
  dokumen,
  error,
}: {
  dokumen: ArsipPublicDTO[] | null;
  error: string | null;
}) {
  const [query, setQuery] = useState("");
  const [kategoriAktif, setKategoriAktif] = useState("Semua kategori");

  const kategori = useMemo(
    () => ["Semua kategori", ...new Set((dokumen ?? []).map((item) => item.kategori))],
    [dokumen],
  );
  const hasil = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    return (dokumen ?? []).filter((item) => {
      const cocokKategori = kategoriAktif === "Semua kategori" || item.kategori === kategoriAktif;
      const cocokQuery =
        !needle ||
        [item.judul, item.kategori, item.namaFile, item.deskripsi ?? ""]
          .some((value) => value.toLocaleLowerCase("id").includes(needle));
      return cocokKategori && cocokQuery;
    });
  }, [dokumen, kategoriAktif, query]);

  return (
    <div className="min-h-[65vh]">
      <header className="bg-primary px-margin-mobile py-space-2xl text-on-primary md:px-margin-tablet lg:px-margin-desktop">
        <div className="mx-auto max-w-container-max">
          <Link
            href="/akademik"
            className="mb-space-lg inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-label-sm font-bold text-primary-fixed transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Kembali ke Akademik
          </Link>
          <p className="font-label-md font-bold uppercase tracking-wider text-secondary-container">
            Pusat Arsip
          </p>
          <h1 className="mt-2 font-headline-lg text-headline-lg font-bold tracking-tight text-surface">
            Direktori Arsip Sekolah
          </h1>
          <p className="mt-3 max-w-2xl font-body-lg text-primary-fixed">
            Temukan dan unduh dokumen akademik serta berkas resmi SMK Negeri 24 Jakarta.
          </p>
          <p className="mt-4 font-label-md font-bold text-secondary-container">
            {dokumen?.length ?? 0} dokumen tersedia
          </p>
        </div>
      </header>

      <main className="px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin-desktop">
        <div className="mx-auto max-w-container-max space-y-space-xl">
          <div className="flex flex-col gap-space-md md:flex-row md:items-center">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Cari dokumen arsip</span>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari judul, kategori, atau nama file"
                className="min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-3 pl-12 pr-4 text-base text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <label className="block md:w-64">
              <span className="sr-only">Pilih kategori arsip</span>
              <select
                value={kategoriAktif}
                onChange={(event) => setKategoriAktif(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-base text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {kategori.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <p role="alert" className="rounded-2xl border border-error-container bg-error-container/40 p-space-lg text-on-error-container">
              Direktori arsip belum dapat dimuat. {error}
            </p>
          ) : hasil.length > 0 ? (
            <>
              <p aria-live="polite" className="text-sm text-on-surface-variant">
                Menampilkan {hasil.length} dari {dokumen?.length ?? 0} dokumen
              </p>
              <ul className="grid gap-gutter-md md:grid-cols-2">
                {hasil.map((item) => (
                  <li key={item.id}>
                    <article className="flex h-full flex-col justify-between gap-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <FileText aria-hidden className="h-6 w-6" />
                        </span>
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-secondary-fixed px-3 py-1 font-label-sm text-label-sm font-bold text-on-secondary-fixed">
                            {item.kategori}
                          </span>
                          <h2 className="mt-2 break-words font-title-md text-title-md font-bold text-primary">
                            {item.judul}
                          </h2>
                          {item.deskripsi && (
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
                              {item.deskripsi}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 border-t border-surface-container pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="break-all text-xs text-on-surface-variant">
                          {item.namaFile} · {formatBytes(item.ukuranFile)}
                        </p>
                        <a
                          href={item.downloadUrl}
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-sm font-bold text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <Download aria-hidden className="h-4 w-4" />
                          Unduh
                        </a>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div role="status" className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-space-2xl text-center">
              <FileText aria-hidden className="mx-auto h-9 w-9 text-on-surface-variant" />
              <p className="mt-3 font-title-md text-title-md font-bold text-on-surface">
                {dokumen?.length ? "Dokumen tidak ditemukan" : "Belum ada dokumen tersedia"}
              </p>
              <p className="mt-2 text-sm text-on-surface-variant">
                {dokumen?.length
                  ? "Coba ubah kata pencarian atau pilih kategori lain."
                  : "Dokumen yang diterbitkan sekolah akan tampil di direktori ini."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
