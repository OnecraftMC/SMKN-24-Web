import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LatarKartu } from "@/components/jurusan/DaftarJurusan";
import { JADWAL_DATA, jurusanData } from "@/lib/data";

type Params = { params: Promise<{ key: string }> };

const SESI = [
  { key: "pagi", judul: "Sesi Pagi" },
  { key: "siang", judul: "Sesi Siang" },
] as const;

// Prerender kelima jurusan di build time; key di luar daftar tetap diterima
// route lalu ditolak lewat notFound() di bawah.
export function generateStaticParams() {
  return jurusanData.map(({ key }) => ({ key }));
}

function cariJurusan(key: string) {
  return jurusanData.find((item) => item.key === key);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { key } = await params;
  const jurusan = cariJurusan(key);
  if (!jurusan) return { title: "Jurusan Tidak Ditemukan" };
  return {
    title: `${jurusan.nama} — SMK Negeri 24 Jakarta`,
    description: jurusan.deskripsi,
  };
}

export default async function JurusanDetailPage({ params }: Params) {
  const { key } = await params;
  const jurusan = cariJurusan(key);
  if (!jurusan) notFound();

  const jadwal = JADWAL_DATA[jurusan.key];

  return (
    <>
      <header className="relative overflow-hidden bg-primary py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop text-on-primary">
        <div className="relative z-10 max-w-container-max mx-auto space-y-space-sm">
          <Link
            href="/jurusan"
            className="inline-flex items-center gap-2 font-label-md text-label-md font-bold text-secondary-container hover:text-surface"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              arrow_back
            </span>
            Semua Jurusan
          </Link>
          <div className="flex items-center gap-space-sm">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest/20"
            >
              <span className="material-symbols-outlined text-[28px]">{jurusan.ikon}</span>
            </span>
            <h1 className="font-headline-lg text-headline-lg lg:text-[2.75rem] font-bold text-surface tracking-tight">
              {jurusan.nama}
            </h1>
          </div>
          <p className="font-body-lg text-primary-fixed max-w-3xl">{jurusan.deskripsi}</p>
        </div>
      </header>

      <section className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
          {/* Slot galeri kegiatan: foto public/images/jurusan/<key>.jpg bila
              sudah diisi pada field `jurusanData.gambar`, jika belum memakai
              fallback yang sama persis dengan kartu di /jurusan. */}
          <div className="lg:col-span-7 space-y-space-sm">
            <span className="font-label-md uppercase tracking-wider text-secondary font-bold">
              Kegiatan Siswa
            </span>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm">
              <LatarKartu item={jurusan} sizes="(max-width: 1024px) 100vw, 58vw" />
            </div>
            {!jurusan.gambar && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Foto kegiatan jurusan ini belum tersedia.
              </p>
            )}
          </div>

          {/* Mata pelajaran praktik — sumber data sama dengan kartu daftar
              (JADWAL_DATA), bukan angka atau teks karangan. */}
          <div className="lg:col-span-5 space-y-space-md">
            <span className="font-label-md uppercase tracking-wider text-secondary font-bold">
              Mata Pelajaran Praktik
            </span>
            <div className="space-y-space-md">
              {SESI.map((sesi) => (
                <section
                  key={sesi.key}
                  className="overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm"
                >
                  <h2 className="bg-primary px-space-md py-space-sm font-title-md text-title-md text-surface">
                    {sesi.judul}
                  </h2>
                  <ol className="divide-y divide-surface-container">
                    {jadwal[sesi.key].map((mapel, index) => (
                      <li
                        key={`${sesi.key}-${index}`}
                        className="flex items-center gap-3 px-space-md py-space-sm font-body-sm text-body-sm text-on-surface-variant"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container font-label-sm text-label-sm text-primary">
                          {index + 1}
                        </span>
                        {mapel}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}