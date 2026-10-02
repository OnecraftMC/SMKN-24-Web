import Image from "next/image";
import Link from "next/link";
import type { BeritaView } from "@/lib/shared/mappers";

export default function DaftarBerita({
  berita,
  error,
}: {
  berita: BeritaView[];
  error: string | null;
}) {
  return (
    <div id="daftar-berita" className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-2xl">
        <section aria-labelledby="judul-berita" className="space-y-space-xl">
          <div className="space-y-2">
            <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Jurnal Sekolah</span>
            <h2 id="judul-berita" className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
              Berita Terbaru
            </h2>
          </div>
          {berita.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-gutter-md">
              {berita.map((item) => (
                <li key={item.id}>
                  <article className="group h-full overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md">
                    <Link href={`/berita/${item.slug}`} className="block h-full">
                      <div className="relative h-56 overflow-hidden">
                        {item.gambar ? (
                          <Image
                            src={item.gambar}
                            alt={item.judul}
                            fill
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-surface-container-high text-primary" aria-hidden="true">
                            <span className="material-symbols-outlined text-4xl">newspaper</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-space-xs p-space-lg">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-secondary-fixed px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-fixed">
                            {item.kategori}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{item.tanggalTampil}</span>
                        </div>
                        <h3 className="font-title-md text-title-md font-bold text-primary group-hover:text-secondary">{item.judul}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">{item.ringkasan}</p>
                      </div>
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-lg text-body-sm text-on-surface-variant" role="status">
              {error ? `Berita belum dapat dimuat: ${error}` : "Belum ada berita yang diterbitkan."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
