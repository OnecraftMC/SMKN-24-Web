import ProfilHeader from '@/components/profil/ProfilHeader';
import VisiMisi from '@/components/profil/VisiMisi';
import DewanGuru from '@/components/profil/DewanGuru';
import FasilitasKampus from '@/components/profil/FasilitasKampus';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import { Reveal } from '@/components/ui/Reveal';
import { getBerita, getFasilitas, getGuru } from '@/lib/api';

export default async function ProfilPage() {
  // Hotnews compact memakai sumber yang sama dengan `/kabar`: `utama: true`.
  // Fetch paralel bersama data profil agar tidak menambah waterfall request.
  const [guruRes, fasilitasRes, utamaRes] = await Promise.all([
    getGuru(),
    getFasilitas({ unggulan: true }),
    getBerita({ utama: true }),
  ]);
  const guru = guruRes.data ?? [];
  const fasilitas = fasilitasRes.data ?? [];

  return (
    <>
      <Reveal>
        <ProfilHeader />
      </Reveal>
      <Reveal>
        <VisiMisi />
      </Reveal>
      <Reveal>
        <FeaturedNews
          variant="compact"
          berita={utamaRes.data?.[0] ?? null}
          error={utamaRes.error}
        />
      </Reveal>
      <Reveal>
        <DewanGuru guru={guru} error={guruRes.error} />
      </Reveal>
      <Reveal>
        <FasilitasKampus fasilitas={fasilitas} error={fasilitasRes.error} variant="featured" />
      </Reveal>
    </>
  );
}