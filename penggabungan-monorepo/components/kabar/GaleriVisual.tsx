import { Images } from "lucide-react";

import { useState } from "react";
import Image from "next/image";
import type { GaleriView } from "@/lib/shared/mappers";

export default function GaleriVisual({
  galeri,
  error,
}: {
  galeri: GaleriView[];
  error: string | null;
}) {
  const columns = galeri.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-2";
  // Foto lama bisa saja sudah tidak ada di server (404). Catat per id agar
  // kartu menampilkan placeholder, bukan ikon gambar rusak.
  const [gagalDimuat, setGagalDimuat] = useState<Record<number, boolean>>({});

  return (
    <section
      aria-labelledby="galeri-momen-emas"
      className="w-full bg-surface-container-low px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop"
    >
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Galeri Foto &amp; Lensa Kampus</span>
            <h2 id="galeri-momen-emas" className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Dokumentasi Momen Emas Siswa</h2>
          </div>
        </div>
        <div className={`grid grid-cols-1 ${columns} gap-4`}>
          {galeri.map((item) => {
            const gambarRusak = gagalDimuat[item.id] === true;
            return (
              <article
                key={item.id}
                className="micro-card micro-shine group relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-3xl border border-surface-container shadow-md"
              >
                {item.image && !gambarRusak ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={600}
                    height={800}
                    sizes={galeri.length >= 4 ? "(max-width: 768px) 100vw, 25vw" : "(max-width: 768px) 100vw, 50vw"}
                    unoptimized
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={() =>
                      setGagalDimuat((previous) => ({ ...previous, [item.id]: true }))
                    }
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 bg-surface-container-high px-4 text-center text-primary" aria-label={`Foto ${item.title} belum tersedia`}>
                    <Images aria-hidden="true" className="h-9 w-9" />
                    <span className="text-xs font-semibold text-on-surface-variant">
                      Foto belum tersedia
                    </span>
                  </div>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-primary/80 px-3 py-2 text-sm font-semibold text-surface">
                  {item.title}
                </span>
              </article>
            );
          })}
          {galeri.length === 0 && (
            <p className="col-span-full rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
              {error ? `Galeri belum dapat dimuat: ${error}` : "Belum ada dokumentasi."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
