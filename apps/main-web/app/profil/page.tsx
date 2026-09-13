import ProfilHeader from '@/components/profil/ProfilHeader';
import VisiMisi from '@/components/profil/VisiMisi';
import DewanGuru from '@/components/profil/DewanGuru';
import FasilitasKampus from '@/components/profil/FasilitasKampus';
import { Reveal } from '@/components/ui/Reveal';

export default function ProfilPage() {
  return (
    <>
      <Reveal>
        <ProfilHeader />
      </Reveal>
      <Reveal>
        <VisiMisi />
      </Reveal>
      <Reveal>
        <DewanGuru />
      </Reveal>
      <Reveal>
        <FasilitasKampus />
      </Reveal>
    </>
  );
}