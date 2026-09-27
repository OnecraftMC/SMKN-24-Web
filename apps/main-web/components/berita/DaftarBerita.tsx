import Image from "next/image";
import Link from "next/link";
import { beritaData, beritaUtama } from "@/lib/data";

const SIZES_GRID = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

// Kartu berita sengaja TIDAK ditautkan ke halaman detail: rute /berita/<slug>
// belum ada (temuan F06 di report.md). Saat rute detail dibuat, bungkus kartu
// dengan <Link href={`/berita/${item.slug}`}> dan tambahkan tautan "Baca".
export default function DaftarBerita() {
  // beritaUtama tidak punya id dan judulnya sama dengan beritaData[0],
  // jadi disaring agar tidak tampil dua kali pada halaman yang sama.
  const beritaLain = beritaData.filter((item) => item.judul !== beritaUtama.judul);

  return (
    <div id="daftar-berita" className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-2xl">
        {/* Sorotan utama */}
        <section
          aria-labelledby="judul-sorotan"
          className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-3xl border border-surface-container bg-surface-container-lowest shadow-lg"
        >
          <div className="lg:col-span-7 relative h-72 lg:h-auto lg:min-h-[26rem] overflow-hidden">
            <Image
              src={beritaUtama.gambar}
              alt={beritaUtama.judul}
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="lg:col-span-5 flex flex-col justify-between gap-space-md p-space-lg lg:p-space-2xl">
            <div className="space-y-space-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-sm text-label-sm font-bold uppercase text-on-secondary-container">
                  {beritaUtama.kategori}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {beritaUtama.tanggal}
                </span>
              </div>
              <h2 id="judul-sorotan" className="font-headline-md text-headline-md font-bold leading-tight text-primary">
                {beritaUtama.judul}
              </h2>
              <p className="font-body-md text-on-surface-variant">{beritaUtama.ringkasan}</p>
            </div>
            <Link
              href="/kabar"
              className="inline-flex w-fit items-center gap-1 font-label-md text-label-md font-bold text-secondary hover:underline"
            >
              <span>Lihat dokumentasi lengkap</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* Berita lainnya */}
        <section aria-labelledby="judul-berita-lain" className="space-y-space-xl">
          <div className="space-y-2">
            <span className="font-label-md uppercase tracking-wider text-secondary font-bold">
              Jurnal Sekolah
            </span>
            <h2 id="judul-berita-lain" className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
              Berita Terbaru
            </h2>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-gutter-md">
            {beritaLain.map((item) => (
              <li key={item.id}>
                <article className="group h-full overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={item.gambar}
                      alt={item.judul}
                      fill
                      sizes={SIZES_GRID}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-space-xs p-space-lg">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-secondary-fixed px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-secondary-fixed">
                        {item.kategori}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {item.tanggal}
                      </span>
                    </div>
                    <h3 className="font-title-md text-title-md font-bold text-primary">{item.judul}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">
                      {item.ringkasan}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* Penutup: arahkan ke galeri yang memang sudah ada */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md rounded-2xl border border-surface-container bg-surface-container-low p-space-lg">
          <p className="font-body-md text-on-surface-variant">
            Halaman detail per berita sedang disiapkan. Sementara waktu, dokumentasi
            foto kegiatan siswa dapat dilihat langsung di galeri.
          </p>
          <Link
            href="/kabar"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-secondary-container px-space-lg py-2.5 font-label-md text-label-md font-bold text-on-secondary-container transition hover:brightness-95"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">photo_library</span>
            <span>Kunjungi Galeri</span>
          </Link>
        </div>
      </div>
    </div>
  );
}