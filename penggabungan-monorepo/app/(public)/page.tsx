import Hero from '@/components/beranda/Hero';
import QuickHighlights from '@/components/beranda/QuickHighlights';
import SambutanKepsek from '@/components/beranda/SambutanKepsek';
import BeritaTerkini from '@/components/beranda/BeritaTerkini';
import PapanPengumuman from '@/components/beranda/PapanPengumuman';
import AgendaKegiatan from '@/components/beranda/AgendaKegiatan';
import LokasiSekolahBanner from '@/components/beranda/LokasiSekolahBanner';
import { Reveal } from '@/components/ui/Reveal';
import { getAgenda, getBerita, getPengumuman } from '@/lib/api';
import AlasanMemilih from '@/components/beranda/AlasanMemilih';

// Backend adalah sumber kebenaran; setiap bagian menampilkan error/konfigurasi
// kosong, bukan menggantinya dengan konten contoh arsip.
export default async function Home() {
  const [beritaRes, pengumumanRes, agendaRes] = await Promise.all([
    getBerita({ utama: false, limit: 2 }),
    getPengumuman({ beranda: true }),
    getAgenda(),
  ]);
  const berita = beritaRes.data ?? [];
  const semuaPengumuman = pengumumanRes.data ?? [];
  const allAgenda = agendaRes.data ?? [];
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const pengumumanTersusun = [...semuaPengumuman].sort(
    (a, b) => (a.tanggalIso ?? "").localeCompare(b.tanggalIso ?? ""),
  );
  const pengumumanMendatang = pengumumanTersusun.filter((item) => item.tanggalIso >= today);
  const pengumumanLampau = pengumumanTersusun
    .filter((item) => item.tanggalIso < today)
    .sort((a, b) => (b.tanggalIso ?? "").localeCompare(a.tanggalIso ?? ""));
  const agenda = allAgenda
    .filter((item) => (item.tglSelesai || item.tglMulai) >= today)
    .sort((a, b) => a.tglMulai.localeCompare(b.tglMulai));
  const pastAgenda = allAgenda
    .filter((item) => (item.tglSelesai || item.tglMulai) < today)
    .sort((a, b) => b.tglMulai.localeCompare(a.tglMulai));

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
        <AlasanMemilih />
      </Reveal>
      <Reveal>
        <PapanPengumuman
          pengumuman={pengumumanMendatang.slice(0, 2)}
          pengumumanLampau={pengumumanLampau}
          error={pengumumanRes.error}
        />
      </Reveal>
      <Reveal>
        <AgendaKegiatan agenda={agenda} pastAgenda={pastAgenda} error={agendaRes.error} />
      </Reveal>
      <Reveal>
        <section className="w-full px-margin-mobile py-space-4xl md:px-margin-tablet lg:px-margin-desktop">
          <div className="mx-auto max-w-container-max">
            <BeritaTerkini berita={berita} error={beritaRes.error} />
          </div>
        </section>
      </Reveal>
      <Reveal>
        <LokasiSekolahBanner />
      </Reveal>
    </>
  );
}
