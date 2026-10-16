import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Newspaper } from "lucide-react";
import type { BeritaView } from "@/lib/shared/mappers";

function NewsImage({ item, priority = false }: { item: BeritaView; priority?: boolean }) {
  return (
    <div className="relative h-full min-h-56 overflow-hidden bg-primary-container">
      {item.gambar ? (
        <Image
          src={item.gambar}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-full min-h-56 items-center justify-center bg-gradient-to-br from-primary-container to-secondary-container text-primary">
          <Newspaper aria-hidden className="h-12 w-12 opacity-70" />
        </div>
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary/65 via-transparent to-primary/10" />
      <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-primary/75 px-3 py-1 font-label-sm text-label-sm font-bold text-surface backdrop-blur">
        {item.kategori}
      </span>
    </div>
  );
}

function DateLabel({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
      <CalendarDays aria-hidden className="h-4 w-4 text-secondary" />
      {value}
    </span>
  );
}

export default function DaftarBerita({
  berita,
  error,
  eyebrow = "Jurnal Sekolah",
  heading = "Berita Terbaru",
}: {
  berita: BeritaView[];
  error: string | null;
  eyebrow?: string;
  heading?: string;
}) {
  const [unggulan, ...lainnya] = berita;

  return (
    <section
      id="daftar-berita"
      aria-labelledby="judul-berita"
      className="w-full bg-surface-container-low px-margin-mobile py-space-4xl md:px-margin-tablet lg:px-margin-desktop"
    >
      <div className="mx-auto max-w-container-max space-y-space-2xl">
        <header className="flex flex-col gap-space-sm border-b border-surface-container pb-space-lg sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-secondary">
              {eyebrow}
            </span>
            <h2 id="judul-berita" className="font-headline-md text-headline-md font-bold tracking-tight text-primary">
              {heading}
            </h2>
            <p className="max-w-2xl font-body-sm text-body-sm text-on-surface-variant">
              Kumpulan kabar dan cerita terbaru dari lingkungan SMK Negeri 24 Jakarta.
            </p>
          </div>
          {berita.length > 0 && (
            <span className="w-fit rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm font-bold text-on-surface-variant">
              {berita.length} artikel
            </span>
          )}
        </header>

        {error && berita.length === 0 ? (
          <p className="rounded-2xl border border-error/20 bg-surface-container-lowest p-space-lg font-body-sm text-body-sm text-error" role="status">
            Berita belum dapat dimuat: {error}
          </p>
        ) : unggulan ? (
          <div className="space-y-space-xl">
            <article className="group overflow-hidden rounded-3xl border border-surface-container bg-surface-container-lowest shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <Link href={"/berita/" + unggulan.slug} className="grid h-full lg:grid-cols-[1.15fr_0.85fr]">
                <div className="relative aspect-[16/10] min-h-64 overflow-hidden lg:aspect-auto">
                  <NewsImage item={unggulan} priority />
                </div>
                <div className="flex flex-col justify-center gap-space-md p-space-lg md:p-space-2xl">
                  <span className="w-fit rounded-full bg-secondary-container px-3 py-1 font-label-sm text-label-sm font-bold text-on-secondary-container">
                    Cerita pilihan
                  </span>
                  <DateLabel value={unggulan.tanggalTampil} />
                  <h3 className="font-headline-sm text-headline-sm font-bold leading-tight text-primary transition-colors group-hover:text-secondary md:text-headline-md">
                    {unggulan.judul}
                  </h3>
                  <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant line-clamp-4">
                    {unggulan.ringkasan || "Buka artikel untuk membaca cerita selengkapnya."}
                  </p>
                  <span className="inline-flex w-fit items-center gap-2 font-label-md text-label-md font-bold text-primary">
                    Baca selengkapnya
                    <ArrowUpRight aria-hidden className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </article>

            {lainnya.length > 0 && (
              <ul className="grid gap-gutter-md md:grid-cols-2 xl:grid-cols-3">
                {lainnya.map((item) => (
                  <li key={item.id}>
                    <article className="group h-full overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                      <Link href={"/berita/" + item.slug} className="flex h-full flex-col">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <NewsImage item={item} />
                        </div>
                        <div className="flex flex-1 flex-col gap-space-sm p-space-lg">
                          <DateLabel value={item.tanggalTampil} />
                          <h3 className="font-title-md text-title-md font-bold leading-snug text-primary transition-colors group-hover:text-secondary">
                            {item.judul}
                          </h3>
                          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant line-clamp-3">
                            {item.ringkasan || "Buka artikel untuk membaca cerita selengkapnya."}
                          </p>
                          <span className="mt-auto inline-flex items-center gap-2 pt-space-sm font-label-sm text-label-sm font-bold text-primary">
                            Baca artikel
                            <ArrowUpRight aria-hidden className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-surface-container-high bg-surface-container-lowest px-space-lg py-space-2xl text-center">
            <Newspaper aria-hidden className="mx-auto h-9 w-9 text-secondary" />
            <p className="mt-3 font-title-sm text-title-sm font-bold text-primary">Belum ada berita yang diterbitkan</p>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">Silakan kembali lagi untuk melihat kabar terbaru sekolah.</p>
          </div>
        )}
      </div>
    </section>
  );
}
