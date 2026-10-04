import KabarBanner from '@/components/kabar/KabarBanner';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import GaleriVisual from '@/components/kabar/GaleriVisual';
import { Reveal } from '@/components/ui/Reveal';
import { getBerita, getGaleri } from '@/lib/api';

export default async function KabarPage() {
  const [utamaRes, galeriRes] = await Promise.all([
    getBerita({ utama: true }),
    getGaleri(),
  ]);
  // FeaturedNews menerima satu berita, jadi ambil entri pertama hasil ?utama=1.
  const utama = utamaRes.data?.[0] ?? null;
  const galeri = galeriRes.data ?? [];
  const galeriError = galeriRes.error;

  return (
    <>
      <Reveal>
        <KabarBanner />
      </Reveal>
      <Reveal>
        <FeaturedNews berita={utama} error={utamaRes.error} />
      </Reveal>
      <Reveal>
        <GaleriVisual galeri={galeri} error={galeriError} />
      </Reveal>
    </>
  );
}