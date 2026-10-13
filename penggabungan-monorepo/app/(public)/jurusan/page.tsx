import JurusanBanner from '@/components/jurusan/JurusanBanner';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import { Reveal } from '@/components/ui/Reveal';
import { getBerita, getJadwal } from '@/lib/api';
import DaftarJurusan from '@/components/jurusan/DaftarJurusan';
import JurusanCta from '@/components/jurusan/JurusanCta';
import type { JurusanKey } from '@/lib/shared/types';

export default async function JurusanPage() {
  // Sumber data sama dengan `/kabar`: satu berita dengan flag `utama` dari backend.
  const [utamaRes, jadwalRes] = await Promise.all([
    getBerita({ utama: true }),
    getJadwal(),
  ]);
  const kelasByJurusan = (jadwalRes.data?.classes ?? []).reduce<
    Partial<Record<JurusanKey, string[]>>
  >((classesByProgram, kelas) => {
    (classesByProgram[kelas.jurusan] ??= []).push(kelas.nama);
    return classesByProgram;
  }, {});

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
        <DaftarJurusan kelasByJurusan={kelasByJurusan} />
      </Reveal>
      <Reveal>
        <JurusanCta />
      </Reveal>
    </>
  );
}
