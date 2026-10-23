"use client";

import { useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";
import type { GaleriView } from "@/lib/shared/mappers";

export default function GaleriVisual({
  galeri,
  error,
}: {
  galeri: GaleriView[];
  error: string | null;
}) {
  // Key mencakup path gambar supaya foto pengganti dengan id yang sama tidak
  // mewarisi status rusak dari unggahan sebelumnya.
  const [gambarGagal, setGambarGagal] = useState<Record<string, boolean>>({});

  return (
    <section
      aria-labelledby="galeri-momen-emas"
      className="w-full bg-surface-container-low px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop"
    >
      <div className="mx-auto max-w-container-max space-y-space-xl">
        <header className="flex flex-wrap items-end justify-between gap-space-md">
          <div className="max-w-3xl">
            <span className="font-label-md font-bold uppercase tracking-wider text-secondary">
              Galeri foto &amp; lensa kampus
            </span>
            <h2 id="galeri-momen-emas" className="mt-2 font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
              Dokumentasi Kegiatan Sekolah
            </h2>
            <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
              Lihat kegiatan, karya, dan pengalaman belajar siswa SMKN 24 Jakarta.
            </p>
          </div>
          {galeri.length > 0 && (
            <p className="rounded-full bg-surface-container-high px-3 py-1.5 text-sm font-bold text-on-surface-variant">
              {galeri.length} foto
            </p>
          )}
        </header>

        {galeri.length > 0 ? (
          <ul className="grid grid-cols-1 gap-gutter-md sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {galeri.map((item) => {
              const imageKey = `${item.id}:${item.image ?? ""}`;
              const imageFailed = gambarGagal[imageKey] === true;
              return (
                <li key={item.id}>
                  <figure className="h-full overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-high">
                      {item.image && !imageFailed ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                          unoptimized
                          className="object-cover"
                          onError={() => setGambarGagal((previous) => ({ ...previous, [imageKey]: true }))}
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-on-surface-variant" role="img" aria-label={`Foto ${item.title} tidak tersedia`}>
                          <Images aria-hidden className="size-9" />
                          <span className="text-sm font-semibold">Foto tidak tersedia</span>
                        </div>
                      )}
                    </div>
                    <figcaption className="p-space-md">
                      <p className="font-title-md font-bold text-primary">{item.title}</p>
                      <p className="mt-2 inline-flex rounded-full bg-surface-container-high px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                        {item.category}
                      </p>
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
            {error ? `Galeri belum dapat dimuat: ${error}` : "Belum ada dokumentasi kegiatan."}
          </p>
        )}
      </div>
    </section>
  );
}
