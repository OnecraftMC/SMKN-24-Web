import Hero from '@/components/beranda/Hero';
import QuickHighlights from '@/components/beranda/QuickHighlights';
import SambutanKepsek from '@/components/beranda/SambutanKepsek';
import BeritaTerkini from '@/components/beranda/BeritaTerkini';
import PapanPengumuman from '@/components/beranda/PapanPengumuman';
import AgendaKegiatan from '@/components/beranda/AgendaKegiatan';
import LokasiSekolahBanner from '@/components/beranda/LokasiSekolahBanner';

export default function Home() {
  return (
    <>
      <Hero />
      <QuickHighlights />
      <SambutanKepsek />
      <section className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
            <BeritaTerkini />
            <PapanPengumuman />
          </div>
        </div>
      </section>
      <AgendaKegiatan />
      <LokasiSekolahBanner />
    </>
  );
}
