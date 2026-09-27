import BeritaBanner from '@/components/berita/BeritaBanner';
import DaftarBerita from '@/components/berita/DaftarBerita';
import { Reveal } from '@/components/ui/Reveal';

export default function BeritaPage() {
  return (
    <>
      <Reveal>
        <BeritaBanner />
      </Reveal>
      <Reveal>
        <DaftarBerita />
      </Reveal>
    </>
  );
}