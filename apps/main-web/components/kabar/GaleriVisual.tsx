import Image from "next/image";
import type { GaleriView } from "../../../../packages/shared/mappers";

export default function GaleriVisual({
  galeri,
  error,
}: {
  galeri: GaleriView[];
  error: string | null;
}) {
  const columns = galeri.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-2";

  return (
    <div className="w-full py-space-3xl bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Galeri Foto &amp; Lensa Kampus</span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Dokumentasi Momen Emas Siswa</h2>
          </div>
        </div>
        <div className={`grid grid-cols-1 ${columns} gap-4`}>
          {galeri.map((item) => (
            <div key={item.id} className="galeri-card group relative rounded-3xl overflow-hidden aspect-[3/4] border border-surface-container shadow-md">
              <Image
                src={item.image}
                alt={item.title}
                width={600}
                height={800}
                sizes={galeri.length >= 4 ? "(max-width: 768px) 100vw, 25vw" : "(max-width: 768px) 100vw, 50vw"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-0 inset-x-0 bg-primary/80 px-3 py-2 text-sm font-semibold text-surface">
                {item.title}
              </span>
            </div>
          ))}
          {galeri.length === 0 && (
            <p className="col-span-full rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
              {error ? `Galeri belum dapat dimuat: ${error}` : "Belum ada dokumentasi."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
