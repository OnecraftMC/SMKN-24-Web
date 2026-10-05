import Image from "next/image";
import Link from "next/link";
import { JADWAL_DATA, jurusanData } from "@/lib/data";
import type { Jurusan, JurusanKey } from "@/lib/types";

// Tata letak bento di desktop (3 kolom x 3 baris): satu kartu unggulan 2x2 dan
// satu kartu lebar yang menutup baris terakhir. Jumlah sel 4+1+1+1+2 = 9, jadi
// grid terisi penuh tanpa lubang. Di bawah lg semua kartu tetap 1 kolom.
const GAMBAR_LEBAR = "(min-width: 1024px) 66vw, (min-width: 768px) 100vw, 100vw";
const GAMBAR_SEMPIT = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

const TATA_LETAK: Record<
  JurusanKey,
  { kolom: string; sizes: string; unggulan?: boolean }
> = {
  perhotelan: { kolom: "lg:col-span-2 lg:row-span-2", sizes: GAMBAR_LEBAR, unggulan: true },
  boga: { kolom: "", sizes: GAMBAR_SEMPIT },
  busana: { kolom: "", sizes: GAMBAR_SEMPIT },
  pplg: { kolom: "", sizes: GAMBAR_SEMPIT },
  pariwisata: { kolom: "lg:col-span-2", sizes: GAMBAR_LEBAR },
};

// Chip mata pelajaran praktik yang tampil pada kartu non-unggulan.
const JUMLAH_CHIPE = 3;

// Latar kartu: foto kegiatan resmi bila tersedia (slot
// public/images/jurusan/<key>.jpg — lihat komentar `gambar` di lib/types.ts),
// jika belum: fallback token berupa gradien surface + ikon watermark besar.
export function LatarKartu({ item, sizes }: { item: Jurusan; sizes: string }) {
  if (item.gambar) {
    return (
      <Image
        src={item.gambar}
        alt={`Kegiatan siswa jurusan ${item.nama}`}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden bg-gradient-to-br from-surface-container-lowest via-surface-container to-surface-container-high"
    >
      <span className="material-symbols-outlined absolute -right-4 -top-8 select-none text-[7.5rem] leading-none text-primary/10">
        {item.ikon}
      </span>
      <span className="material-symbols-outlined absolute -bottom-10 -left-6 select-none text-[6rem] leading-none text-secondary/10">
        {item.ikon}
      </span>
    </div>
  );
}

export default function DaftarJurusan() {
  return (
    <div className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-label-md uppercase tracking-wider text-secondary font-bold">
            Kompetensi Keahlian
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Pilih Jurusan
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Kenali bidang pembelajaran dan kompetensi tiap program keahlian. Buka
            halaman khusus jurusan untuk informasi selengkapnya.
          </p>
        </div>

        <ul id="daftar-jurusan" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[16rem] md:auto-rows-[18rem] gap-gutter-md">
          {jurusanData.map((item) => {
            const tata = TATA_LETAK[item.key];
            const mapel = JADWAL_DATA[item.key].pagi;
            const chipMapel = tata.unggulan ? mapel : mapel.slice(0, JUMLAH_CHIPE);
            return (
              <li key={item.key} className={tata.kolom}>
                <article className="group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  {/* Lapis 1 — latar penuh kartu (foto/fallback) + scrim bawah */}
                  <div className="absolute inset-0">
                    <LatarKartu item={item} sizes={tata.sizes} />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"
                    />
                  </div>

                  {/* Lapis 2 — panel informasi; teks selalu terbaca di latar apa pun */}
                  <div className="relative z-10 m-space-sm space-y-space-xs rounded-xl border border-surface-container bg-surface-container-lowest/95 p-space-md backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition-colors duration-300 group-hover:bg-secondary group-hover:text-on-secondary">
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                          {item.ikon}
                        </span>
                      </span>
                      <h3
                        className={
                          tata.unggulan
                            ? "font-headline-sm text-headline-sm font-bold text-primary"
                            : "font-title-md text-title-md font-bold text-primary"
                        }
                      >
                        {item.nama}
                      </h3>
                    </div>

                    <p
                      className={
                        tata.unggulan
                          ? "font-body-md text-body-md text-on-surface-variant"
                          : "font-body-sm text-body-sm text-on-surface-variant line-clamp-2"
                      }
                    >
                      {item.deskripsi}
                    </p>

                    <ul className="flex flex-wrap gap-1">
                      {chipMapel.map((mapelPagi) => (
                        <li
                          key={mapelPagi}
                          className="rounded-full bg-surface-container-low px-2 py-0.5 font-label-sm text-label-sm font-bold text-on-surface-variant"
                        >
                          {mapelPagi}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/jurusan/${item.key}.html`}
                      title={`Lihat informasi jurusan ${item.nama}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-space-md py-2 font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span>Informasi Jurusan</span>
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
