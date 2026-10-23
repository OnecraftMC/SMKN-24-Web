import ProfilHeader from '@/components/profil/ProfilHeader';
import VisiMisi from '@/components/profil/VisiMisi';
import DewanGuru from '@/components/profil/DewanGuru';
import FasilitasKampus from '@/components/profil/FasilitasKampus';
import EkstrakurikulerKampus from '@/components/ekstrakurikuler/EkstrakurikulerKampus';
import KalenderKegiatan from '@/components/profil/KalenderKegiatan';
import HubIndustri from '@/components/profil/HubIndustri';
import FeaturedNews from '@/components/kabar/FeaturedNews';
import { Reveal } from '@/components/ui/Reveal';
import { getAgendaCalendar, getBerita, getEkstrakurikuler, getFasilitas, getGuru } from '@/lib/api';

export default async function ProfilPage() {
  // Hotnews compact memakai sumber yang sama dengan `/kabar`: `utama: true`.
  // Fetch paralel bersama data profil agar tidak menambah waterfall request.
  const [guruRes, fasilitasRes, ekstrakurikulerRes, utamaRes, agendaRes] = await Promise.all([
    getGuru(),
    getFasilitas({ unggulan: true }),
    getEkstrakurikuler({ unggulan: true }),
    getBerita({ utama: true }),
    getAgendaCalendar(),
  ]);
  const guru = guruRes.data ?? [];
  const fasilitas = fasilitasRes.data ?? [];
  const ekstrakurikuler = ekstrakurikulerRes.data ?? [];

  return (
    <>
      <Reveal>
        <ProfilHeader />
      </Reveal>
      <Reveal>
        <VisiMisi />
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
        <DewanGuru guru={guru} error={guruRes.error} />
      </Reveal>
      <Reveal>
        <HubIndustri />
      </Reveal>
      <Reveal>
        <FasilitasKampus fasilitas={fasilitas} error={fasilitasRes.error} variant="featured" />
      </Reveal>
      <Reveal>
        <EkstrakurikulerKampus
          ekstrakurikuler={ekstrakurikuler}
          error={ekstrakurikulerRes.error}
          variant="featured"
        />
      </Reveal>
    </>
  );
}
