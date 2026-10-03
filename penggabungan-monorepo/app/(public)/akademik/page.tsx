import AkademikBanner from '@/components/akademik/AkademikBanner';
import JadwalMatriks from '@/components/akademik/JadwalMatriks';
import KalenderUnduhan from '@/components/akademik/KalenderUnduhan';
import FormBK from '@/components/akademik/FormBK';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import { Reveal } from '@/components/ui/Reveal';
import { getBerita, getJadwal } from '@/lib/api';

export default async function AkademikPage() {
  // Hotnews compact memakai sumber yang sama dengan `/kabar` (`utama: true`).
  const [jadwalRes, utamaRes] = await Promise.all([
    getJadwal(),
    getBerita({ utama: true }),
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
        <JadwalMatriks jadwal={jadwal} error={jadwalRes.error} />
      </Reveal>
      <Reveal>
        <div className="w-full py-space-3xl bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
          <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
            <KalenderUnduhan />
            <div className="lg:col-span-5">
              <FormBK />
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}