import JurusanBanner from '@/components/jurusan/JurusanBanner';
import DaftarJurusan from '@/components/jurusan/DaftarJurusan';
import JurusanCta from '@/components/jurusan/JurusanCta';
import { Reveal } from '@/components/ui/Reveal';

export default function JurusanPage() {
  return (
    <>
      <Reveal>
        <JurusanBanner />
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
