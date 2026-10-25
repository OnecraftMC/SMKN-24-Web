import Image from "next/image";

const DEFAULT_IMAGE = "/images/struktur-organisasi.jpeg";

export default function StrukturOrganisasi({ gambar }: { gambar: string | null }) {
  const src = gambar || DEFAULT_IMAGE;

  return (
    <section
      aria-labelledby="struktur-organisasi-heading"
      className="w-full bg-surface px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop"
    >
      <div className="mx-auto max-w-container-max space-y-space-lg">
        <div>
          <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-secondary">
            Tentang Sekolah
          </span>
          <h2
            id="struktur-organisasi-heading"
            className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary"
          >
            Struktur Organisasi Sekolah
          </h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest p-2 shadow-sm sm:p-4">
          {/* Infografik merupakan satu gambar JPEG dengan rasio lebar. */}
          <Image
            src={src}
            alt="Struktur organisasi SMK Negeri 24 Jakarta"
            width={1365}
            height={768}
            className="h-auto w-full rounded-xl"
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}
