import Hero from '@/components/beranda/Hero';
import QuickHighlights from '@/components/beranda/QuickHighlights';
import SambutanKepsek from '@/components/beranda/SambutanKepsek';
import BeritaTerkini from '@/components/beranda/BeritaTerkini';
import PapanPengumuman from '@/components/beranda/PapanPengumuman';
import AgendaKegiatan from '@/components/beranda/AgendaKegiatan';
import LokasiSekolahBanner from '@/components/beranda/LokasiSekolahBanner';
import { Reveal } from '@/components/ui/Reveal';
import { backendAktif, getAgenda, getBerita, getPengumuman } from '@/lib/api';
import { agendaContoh, beritaContoh, pengumumanContoh } from '@/lib/fallback';

// Tanpa BACKEND_URL, request() tidak menyentuh jaringan dan mengembalikan
// error "belum dikonfigurasi"; halaman lalu memakai data arsip lib/data.ts
// supaya beranda tidak kosong. Bila backend hidup tapi gagal, error aslinya
// diteruskan ke komponen (komponen menampilkan status, bukan data palsu).
export default async function Home() {
  const [beritaRes, pengumumanRes, agendaRes] = await Promise.all([
    getBerita({ limit: 4 }),
    getPengumuman({ beranda: true }),
    getAgenda(),
  ]);
  const tanpaBackend = !backendAktif();

  const berita = beritaRes.data ?? (tanpaBackend ? beritaContoh() : []);
  const pengumuman = pengumumanRes.data ?? (tanpaBackend ? pengumumanContoh() : []);
  const agenda = agendaRes.data ?? (tanpaBackend ? agendaContoh() : []);

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
