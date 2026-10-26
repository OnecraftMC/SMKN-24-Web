import ProfilHeader from '@/components/profil/ProfilHeader';
import VisiMisi from '@/components/profil/VisiMisi';
import DewanGuru from '@/components/profil/DewanGuru';
import StrukturOrganisasi from '@/components/profil/StrukturOrganisasi';
import FasilitasKampus from '@/components/profil/FasilitasKampus';
import KalenderKegiatan from '@/components/profil/KalenderKegiatan';
import HubIndustri from '@/components/profil/HubIndustri';
import TentangSekolah from '@/components/profil/TentangSekolah';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import { Reveal } from '@/components/ui/Reveal';
import { getAgendaCalendar, getBerita, getFasilitas, getGuru, getHubIndustri, getStrukturOrganisasi } from '@/lib/api';

export default async function ProfilPage() {
  // Hotnews compact memakai sumber yang sama dengan `/kabar`: `utama: true`.
  // Fetch paralel bersama data profil agar tidak menambah waterfall request.
  const [guruRes, fasilitasRes, utamaRes, agendaRes, hubIndustriRes, strukturRes] = await Promise.all([
    getGuru(),
    getFasilitas({ unggulan: true }),
    getBerita({ utama: true }),
    getAgendaCalendar(),
    getHubIndustri(),
    getStrukturOrganisasi(),
  ]);
  const guru = guruRes.data ?? [];
  const fasilitas = fasilitasRes.data ?? [];

  return (
    <>
      <Reveal>
        <ProfilHeader />
      </Reveal>
      <Reveal>
        <TentangSekolah />
      </Reveal>
      <Reveal>
        <VisiMisi />
      </Reveal>
      <Reveal>
        <StrukturOrganisasi gambar={strukturRes.data?.gambar ?? null} />
      </Reveal>
      <Reveal>
        <DewanGuru guru={guru} error={guruRes.error} />
      </Reveal>
      <Reveal>
        <KalenderKegiatan events={agendaRes.data ?? []} error={agendaRes.error} />
      </Reveal>
      <Reveal>
        <FeaturedNews
          variant="compact"
          berita={utamaRes.data?.[0] ?? null}
          error={utamaRes.error}
        />
      </Reveal>
      <Reveal>
        <HubIndustri mitra={hubIndustriRes.data ?? []} error={hubIndustriRes.error} />
      </Reveal>
      <Reveal>
        <FasilitasKampus fasilitas={fasilitas} error={fasilitasRes.error} variant="featured" />
      </Reveal>
    </>
  );
}
