import { BookOpen, MapPin } from "lucide-react";

export default function TentangSekolah() {
  return (
    <section
      id="tentang-sekolah"
      aria-labelledby="tentang-sekolah-heading"
      className="scroll-mt-32 w-full px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop"
    >
      <div className="mx-auto max-w-container-max">
        <div className="max-w-4xl rounded-3xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm md:p-space-2xl">
          <div className="flex items-center gap-2 font-label-sm font-bold uppercase tracking-wider text-secondary">
            <BookOpen aria-hidden className="size-5" /> Profil sekolah
          </div>
          <h2 id="tentang-sekolah-heading" className="mt-3 font-headline-md text-headline-md font-bold text-primary">
            Tentang Sekolah
          </h2>
          <p className="mt-4 text-body-md leading-relaxed text-on-surface-variant">
            <strong className="text-on-surface">SMK Negeri 24 Jakarta</strong> merupakan salah satu Sekolah Menengah Kejuruan Negeri unggulan yang berlokasi di kawasan Bambu Apus, Cipayung, Jakarta Timur. Terakreditasi <strong className="text-on-surface">A</strong> dan menerapkan sistem Pola Pengelolaan Keuangan Badan Layanan Umum Daerah (PPK-BLUD), sekolah ini berkomitmen penuh dalam mencetak lulusan yang berkarakter, kompeten, serta siap bersaing di dunia kerja, berwirausaha, maupun melanjutkan pendidikan ke jenjang perguruan tinggi.
          </p>
          <p className="mt-4 text-body-md leading-relaxed text-on-surface-variant">
            Lingkungan belajar di SMKN 24 Jakarta didukung oleh berbagai pilihan program keahlian yang sangat relevan dengan kebutuhan industri masa kini. Jurusan yang tersedia meliputi Rekayasa Perangkat Lunak (RPL) yang berfokus pada teknologi dan pemrograman digital, Perhotelan, Kuliner / Tata Boga, Desain dan Produksi Busana, serta Usaha Layanan Pariwisata.
          </p>
          <p className="mt-4 text-body-md leading-relaxed text-on-surface-variant">
            Untuk memastikan para siswa mendapatkan pengalaman praktis yang optimal, SMKN 24 Jakarta menyediakan fasilitas pendukung berstandar industri. Di antaranya adalah Edutel (hotel praktik) tiga lantai untuk siswa Perhotelan, laboratorium komputer modern untuk mendukung aktivitas pengembangan perangkat lunak, dapur dan ruang praktik kejuruan yang lengkap, serta auditorium dan perpustakaan sebagai pusat kegiatan literasi dan pengembangan minat siswa.
          </p>
          <p id="info-sekolah" className="mt-5 flex scroll-mt-32 items-start gap-2 text-sm font-semibold text-on-surface-variant">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-secondary" /> Bambu Apus, Cipayung, Jakarta Timur
          </p>
        </div>
      </div>
    </section>
  );
}
