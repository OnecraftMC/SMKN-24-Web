import Hero from '@/components/beranda/Hero';
import QuickHighlights from '@/components/beranda/QuickHighlights';
import SambutanKepsek from '@/components/beranda/SambutanKepsek';
import BeritaTerkini from '@/components/beranda/BeritaTerkini';
import PapanPengumuman from '@/components/beranda/PapanPengumuman';
import AgendaKegiatan from '@/components/beranda/AgendaKegiatan';
import LokasiSekolahBanner from '@/components/beranda/LokasiSekolahBanner';
import { Reveal } from '@/components/ui/Reveal';
import { getAgenda, getBerita, getPengumuman } from '@/lib/api';

// Backend adalah sumber kebenaran; setiap bagian menampilkan error/konfigurasi
// kosong, bukan menggantinya dengan konten contoh arsip.
export default async function Home() {
  const [beritaRes, pengumumanRes, agendaRes] = await Promise.all([
    getBerita({ utama: false, limit: 2 }),
    getPengumuman({ beranda: true }),
    getAgenda(),
  ]);
  const berita = beritaRes.data ?? [];
  const pengumuman = pengumumanRes.data ?? [];
  const agenda = agendaRes.data ?? [];

  return (
    <>
      <Hero />
      <Reveal>
        <QuickHighlights />
      </Reveal>
      <Reveal>
        <SambutanKepsek />
      </Reveal>
      <Reveal>
        <section className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
          <div className="max-w-container-max mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
              <BeritaTerkini berita={berita} error={beritaRes.error} />
              <PapanPengumuman pengumuman={pengumuman} error={pengumumanRes.error} />
            </div>
          </div>
        </section>
      </Reveal>
      <Reveal>
        <AgendaKegiatan agenda={agenda} error={agendaRes.error} />
      </Reveal>
      <Reveal>
        <LokasiSekolahBanner />
      </Reveal>
    </>
  );
}
