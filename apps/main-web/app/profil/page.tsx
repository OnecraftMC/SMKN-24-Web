import ProfilHeader from '@/components/profil/ProfilHeader';
import VisiMisi from '@/components/profil/VisiMisi';
import DewanGuru from '@/components/profil/DewanGuru';
import FasilitasKampus from '@/components/profil/FasilitasKampus';
import { Reveal } from '@/components/ui/Reveal';
import { backendAktif, getFasilitas, getGuru } from '@/lib/api';
import { fasilitasContoh, guruContoh } from '@/lib/fallback';

export default async function ProfilPage() {
  const [guruRes, fasilitasRes] = await Promise.all([getGuru(), getFasilitas()]);
  const tanpaBackend = !backendAktif();

  const guru = guruRes.data ?? (tanpaBackend ? guruContoh() : []);
  const fasilitas = fasilitasRes.data ?? (tanpaBackend ? fasilitasContoh() : []);

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