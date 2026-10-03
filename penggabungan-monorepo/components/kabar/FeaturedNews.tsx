import Image from "next/image";
import Link from "next/link";
import type { BeritaView } from "@/lib/shared/mappers";

/**
 * Hotnews / berita highlight.
 *
 * Satu component dengan dua mode presentasi, bukan dua component terpisah:
 *   - `featured` (default) — tampilan utama yang dipakai `/kabar` (gambar besar,
 *     dua kolom, tombol "Baca Lengkap").
 *   - `compact` — baris ringkas untuk halaman lain (`/profil`, `/jurusan`,
 *     `/fasilitas`, `/akademik`, `/berita`): thumbnail kecil, judul satu/two baris,
 *     tanpa ringkasan panjang dan tanpa tombol besar.
 *
 * `compact` sengaja memakai `py-space-md` (bukan `py-space-3xl` seperti
 * `/kabar`) supaya tidak mendominasi halaman dan tetap hemat tinggi di mobile.
 * Data tetap berasal dari sumber yang sama: `getBerita({ utama: true })`.
 */
export default function FeaturedNews({
  berita,
  error,
  variant = "featured",
}: {
  berita: BeritaView | null;
  error: string | null;
  variant?: "featured" | "compact";
}) {
  const compact = variant === "compact";

  if (!berita) {
    if (compact) {
      // Halaman yang hanya memuat hotnews tidak boleh menampilkan blok kosong
      // besar; cukup diamkan agar konten utama halaman tetap dominan.
      return null;
    }
    return (
      <div className="w-full py-space-3xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <p className="max-w-container-max mx-auto rounded-xl border border-surface-container bg-surface-container-lowest p-space-lg text-body-sm text-on-surface-variant" role="status">
          {error ? `Berita utama belum dapat dimuat: ${error}` : "Belum ada berita yang ditandai sebagai highlight."}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="w-full py-space-md px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <Link
            href={`/berita/${berita.slug}`}
            className="group flex items-center gap-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-sm shadow-sm transition-colors hover:bg-surface-container"
          >
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container-high sm:h-20 sm:w-32">
              {berita.gambar ? (
                <Image
                  src={berita.gambar}
                  alt={berita.judul}
                  width={256}
                  height={160}
                  sizes="128px"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-primary" aria-hidden="true">
                  <span className="material-symbols-outlined text-2xl">newspaper</span>
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-[11px] font-bold uppercase text-on-secondary-container">
                  Berita Pilihan
                </span>
                <span className="text-xs font-medium text-on-surface-variant">
                  {berita.tanggalTampil}
                </span>
              </div>
              <h2 className="line-clamp-2 font-title-md text-title-md font-bold leading-snug text-primary">
                {berita.judul}
              </h2>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm font-bold text-primary">
                <span className="material-symbols-outlined text-[16px]">campaign</span>
                Baca berita pilihan
                <span className="material-symbols-outlined text-[14px] transition-transform duration-300 group-hover:translate-x-0.5">
                  arrow_forward
                </span>
              </span>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-space-3xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto">
        <div className="rounded-3xl overflow-hidden bg-surface-container-lowest border border-surface-container shadow-lg grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 h-72 lg:h-[420px] overflow-hidden">
            {berita.gambar ? (
              <Image
                src={berita.gambar}
                alt={berita.judul}
                width={800}
                height={500}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-primary" aria-hidden="true">
                <span className="material-symbols-outlined text-6xl">newspaper</span>
              </div>
            )}
          </div>
          <div className="lg:col-span-5 p-space-lg lg:p-space-xl space-y-space-md">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm font-bold uppercase text-[11px]">
                {berita.kategori}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">{berita.tanggalTampil}</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-bold text-primary leading-tight">
              {berita.judul}
            </h2>
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              {berita.ringkasan}
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">campaign</span> Berita Pilihan
              </span>
              <Link href={`/berita/${berita.slug}`} className="px-4 py-2 rounded-xl bg-primary text-surface font-label-sm font-bold hover:bg-primary-container transition-colors flex items-center gap-1">
                <span>Baca Lengkap</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
