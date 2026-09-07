import ProfilHeader from '@/components/profil/ProfilHeader';
import VisiMisi from '@/components/profil/VisiMisi';
import DewanGuru from '@/components/profil/DewanGuru';
import FasilitasKampus from '@/components/profil/FasilitasKampus';

export default function ProfilPage() {
  return (
    <>
      <ProfilHeader />
      <VisiMisi />
      <DewanGuru />
      <FasilitasKampus />
    </>
  );
}