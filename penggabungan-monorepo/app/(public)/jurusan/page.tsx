import JurusanBanner from '@/components/jurusan/JurusanBanner';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import { Reveal } from '@/components/ui/Reveal';
import { getBerita } from '@/lib/api';
import DaftarJurusan from '@/components/jurusan/DaftarJurusan';
import JurusanCta from '@/components/jurusan/JurusanCta';

export default async function JurusanPage() {
  // Sumber data sama dengan `/kabar`: satu berita dengan flag `utama` dari backend.
  const utamaRes = await getBerita({ utama: true });

  return (
    <>
      <Reveal>
        <JurusanBanner />
      </Reveal>
      <Reveal>
        <FeaturedNews
          variant="compact"
          berita={utamaRes.data?.[0] ?? null}
          error={utamaRes.error}
        />
      </Reveal>
      <Reveal>
        <DaftarJurusan />
      </Reveal>
      <Reveal>
        <JurusanCta />
      </Reveal>
    </>
  );
}
