import AkademikBanner from '@/components/akademik/AkademikBanner';
import JadwalMatriks from '@/components/akademik/JadwalMatriks';
import KalenderUnduhan from '@/components/akademik/KalenderUnduhan';
import PrestasiCTA from '@/components/akademik/PrestasiCTA';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import DaftarBerita from '@/components/berita/DaftarBerita';
import { Reveal } from '@/components/ui/Reveal';
import { getArsip, getBerita, getJadwal } from '@/lib/api';

/**
 * Halaman akademik.
 *
 * Layanan Bimbingan Konseling diakses melalui chat AI di navbar dan beranda.
 */
export default async function AkademikPage() {
  // Hotnews compact memakai sumber yang sama dengan `/kabar` (`utama: true`).
  const [jadwalRes, utamaRes, prestasiAkademikRes, arsipRes] = await Promise.all([
    getJadwal(),
    getBerita({ utama: true }),
    getBerita({ kategori: "Prestasi & Akademik" }),
    getArsip(),
  ]);
  const jadwal = jadwalRes.data ?? {};

  return (
    <>
      <Reveal>
        <AkademikBanner />
      </Reveal>
      <Reveal>
        <FeaturedNews
          variant="compact"
          berita={utamaRes.data?.[0] ?? null}
          error={utamaRes.error}
        />
      </Reveal>
      <Reveal>
        <DaftarBerita
          berita={prestasiAkademikRes.data ?? []}
          error={prestasiAkademikRes.error}
          eyebrow="Kabar Akademik"
          heading="Prestasi & Akademik"
        />
      </Reveal>
      <Reveal>
        <PrestasiCTA />
      </Reveal>
      <Reveal>
        <JadwalMatriks jadwal={jadwal} error={jadwalRes.error} />
      </Reveal>
      <Reveal>
        <div className="w-full py-space-3xl bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
          <div className="max-w-container-max mx-auto">
            <KalenderUnduhan dokumen={arsipRes.data} error={arsipRes.error} />
          </div>
        </div>
      </Reveal>
    </>
  );
}
