import Image from 'next/image';
import Link from 'next/link';
import FasilitasKampus from '@/components/profil/FasilitasKampus';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import { Reveal } from '@/components/ui/Reveal';
import { getBerita, getFasilitas } from '@/lib/api';

export default async function FasilitasPage() {
  // Hotnews compact memakai sumber yang sama dengan `/kabar` (`utama: true`).
  const [fasilitasRes, utamaRes] = await Promise.all([
    getFasilitas(),
    getBerita({ utama: true }),
  ]);
  const fasilitas = fasilitasRes.data ?? [];

  return (
    <>
      <Reveal>
        <div className="bg-primary text-on-primary py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop relative overflow-hidden">
          <div className="max-w-container-max mx-auto space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 text-secondary-container font-label-sm font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">apartment</span>
              <span>Fasilitas &amp; Sarana Kampus</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg lg:text-[2.75rem] font-bold text-surface tracking-tight">
              Seluruh Fasilitas SMKN 24 Jakarta
            </h1>
            <p className="font-body-lg text-primary-fixed max-w-3xl">
              Jelajahi seluruh sarana untuk mendukung proses belajar mengajar dan pengembangan bakat siswa.
            </p>
          </div>
        </div>
      </Reveal>
      <Reveal>
        <FeaturedNews
          variant="compact"
          berita={utamaRes.data?.[0] ?? null}
          error={utamaRes.error}
        />
      </Reveal>
      <Reveal>
        <section className="px-margin-mobile py-space-lg md:px-margin-tablet lg:px-margin-desktop">
          <div className="mx-auto max-w-container-max">
            <Link href="/kantin" className="group grid overflow-hidden rounded-3xl border border-surface-container bg-surface-container-lowest shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:grid-cols-[1.1fr_1fr]">
              <div className="relative min-h-56 overflow-hidden bg-primary-container md:min-h-72">
                {/* Kantin is a local illustration so the entry remains available offline. */}
                <Image src="/images/kantin-sekolah.svg" alt="Ilustrasi area kantin sekolah" fill sizes="(max-width: 768px) 100vw, 55vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute left-5 top-5 rounded-full bg-surface/90 px-3 py-1 font-label-sm text-label-sm font-bold text-primary shadow-sm">Fasilitas sekolah</span>
              </div>
              <div className="flex flex-col justify-center gap-4 p-space-lg md:p-space-xl">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary-container px-3 py-1 font-label-sm text-label-sm font-bold text-on-secondary-container"><span className="material-symbols-outlined text-[17px]">restaurant</span> Kantin sekolah</span>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">Pesan makanan dari kantin</h2>
                <p className="max-w-xl font-body-md text-body-md text-on-surface-variant">Pilih stand, lihat menu, lalu pesan makanan atau minuman untuk diantar ke kelas atau diambil sendiri.</p>
                <span className="inline-flex items-center gap-2 font-label-md text-label-md font-bold text-primary">Lihat stand kantin <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span></span>
              </div>
            </Link>
          </div>
        </section>
      </Reveal>
      <Reveal>
        <FasilitasKampus fasilitas={fasilitas} error={fasilitasRes.error} variant="all" />
      </Reveal>
    </>
  );
}
