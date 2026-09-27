import KabarBanner from '@/components/kabar/KabarBanner';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import GaleriVisual from '@/components/kabar/GaleriVisual';
import FormAspirasi from '@/components/kabar/FormAspirasi';
import { Reveal } from '@/components/ui/Reveal';
import { backendAktif, getBerita, getGaleri } from '@/lib/api';
import { beritaUtamaContoh, galeriContoh } from '@/lib/fallback';

export default async function KabarPage() {
  const [utamaRes, galeriRes] = await Promise.all([
    getBerita({ utama: true }),
    getGaleri(),
  ]);
  const tanpaBackend = !backendAktif();

  // FeaturedNews menerima satu berita, jadi ambil entri pertama hasil ?utama=1.
  const utama = (utamaRes.data ?? (tanpaBackend ? [beritaUtamaContoh()] : []))[0] ?? null;
  const galeri = galeriRes.data ?? (tanpaBackend ? galeriContoh() : []);
  const galeriError = galeriRes.error ?? (tanpaBackend ? 'Galeri belum diisi — backend belum dikonfigurasi (BACKEND_URL).' : null);

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
      <Reveal>
        <FormAspirasi />
      </Reveal>
    </>
  );
}