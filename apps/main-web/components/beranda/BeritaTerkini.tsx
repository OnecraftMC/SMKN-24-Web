"use client";

import Image from "next/image";
import Link from "next/link";
import type { BeritaView } from "../../../../packages/shared/mappers";

export default function BeritaTerkini({
  berita,
  error,
}: {
  berita: BeritaView[];
  error: string | null;
}) {
  return (
    <div className="lg:col-span-7 space-y-space-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-secondary font-bold font-label-sm text-label-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">newspaper</span>
            <span>Warta Terkini</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-primary font-bold">
            Kabar &amp; Prestasi Sekolah
          </h2>
        </div>
        <Link
          href="/berita"
          className="text-secondary font-label-md text-label-md font-bold hover:underline flex items-center gap-1"
        >
          <span>Semua Berita</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>

      <div className="space-y-space-md">
        {berita.map((item) => (
          <article
            key={item.id}
            className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row group border border-surface-container"
          >
            <div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden">
              {item.gambar ? (
                <Image
                  alt={item.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={item.gambar}
                  width={480}
                  height={320}
                  sizes="(max-width: 640px) 100vw, 40vw"
                />
              ) : (
                <div className="w-full h-full min-h-48 bg-surface-container-high flex items-center justify-center text-primary" aria-hidden="true">
                  <span className="material-symbols-outlined text-4xl">newspaper</span>
                </div>
              )}
            </div>
            <div className="p-space-md sm:w-3/5 flex flex-col justify-between space-y-space-xs">
              <div>
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold">
                    {item.kategori}
                  </span>
                  <span className="text-outline text-xs">•</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                    {item.tanggalTampil}
                  </span>
                </div>
                <h3 className="font-title-md text-title-md text-primary font-bold group-hover:text-secondary transition-colors">
                  {item.judul}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">
                  {item.ringkasan}
                </p>
              </div>
              <Link href={item.slug} className="pt-space-xs flex items-center gap-1 text-primary font-semibold font-label-sm text-label-sm hover:text-secondary">
                <span>Baca Selengkapnya</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </article>
        ))}
        {berita.length === 0 && (
          <p className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
            {error ? `Berita belum dapat dimuat: ${error}` : "Belum ada berita yang diterbitkan."}
          </p>
        )}
      </div>
    </div>
  );
}