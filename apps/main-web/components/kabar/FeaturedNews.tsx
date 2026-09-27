import Image from "next/image";
import Link from "next/link";
import type { BeritaView } from "../../../../packages/shared/mappers";

export default function FeaturedNews({
  berita,
  error,
}: {
  berita: BeritaView | null;
  error: string | null;
}) {
  if (!berita) {
    return (
      <div className="w-full py-space-3xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <p className="max-w-container-max mx-auto rounded-xl border border-surface-container bg-surface-container-lowest p-space-lg text-body-sm text-on-surface-variant" role="status">
          {error ? `Berita utama belum dapat dimuat: ${error}` : "Belum ada berita yang ditandai sebagai highlight."}
        </p>
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
              <Link href={berita.slug} className="px-4 py-2 rounded-xl bg-primary text-surface font-label-sm font-bold hover:bg-primary-container transition-colors flex items-center gap-1">
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
