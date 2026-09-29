import BeritaBanner from '@/components/berita/BeritaBanner';
import DaftarBerita from '@/components/berita/DaftarBerita';
import { Reveal } from '@/components/ui/Reveal';
import { getBerita } from '@/lib/api';

export const revalidate = 60;

export default async function BeritaPage() {
  const result = await getBerita({ utama: false });

  return (
    <>
      <Reveal>
        <BeritaBanner />
      </Reveal>
      <Reveal>
        <DaftarBerita berita={result.data ?? []} error={result.error} />
      </Reveal>
    </>
  );
}