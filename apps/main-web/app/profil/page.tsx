import ProfilHeader from '@/components/profil/ProfilHeader';
import VisiMisi from '@/components/profil/VisiMisi';
import DewanGuru from '@/components/profil/DewanGuru';
import FasilitasKampus from '@/components/profil/FasilitasKampus';
import { Reveal } from '@/components/ui/Reveal';
import { getFasilitas, getGuru } from '@/lib/api';

export default async function ProfilPage() {
  const [guruRes, fasilitasRes] = await Promise.all([getGuru(), getFasilitas()]);
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
        <DewanGuru guru={guru} error={guruRes.error} />
      </Reveal>
      <Reveal>
        <FasilitasKampus fasilitas={fasilitas} error={fasilitasRes.error} />
      </Reveal>
    </>
  );
}