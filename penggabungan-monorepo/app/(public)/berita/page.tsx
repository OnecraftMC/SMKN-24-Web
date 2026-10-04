import BeritaBanner from '@/components/berita/BeritaBanner';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import DaftarBerita from '@/components/berita/DaftarBerita';
import { Reveal } from '@/components/ui/Reveal';
import { getBerita } from '@/lib/api';

export const revalidate = 10;

export default async function BeritaPage() {
  // Dua fetch paralel: daftar berita + satu berita highlight (`utama: true`),
  // sumber identik dengan yang dipakai `/kabar`.
  const [result, utamaRes] = await Promise.all([
    getBerita({ utama: false }),
    getBerita({ utama: true }),
  ]);

  return (
    <>
      <Reveal>
        <BeritaBanner />
      </Reveal>
      <Reveal>
        <FeaturedNews
          variant="compact"
          berita={utamaRes.data?.[0] ?? null}
          error={utamaRes.error}
        />
      </Reveal>
      <Reveal>
        <DaftarBerita berita={result.data ?? []} error={result.error} />
      </Reveal>
    </>
  );
}