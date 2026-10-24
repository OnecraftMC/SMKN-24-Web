import { BookOpen, BriefcaseBusiness, MapPin, School, UsersRound } from "lucide-react";

const poinProfil = [
  { icon: School, label: "Komitmen & Karakter" },
  { icon: BriefcaseBusiness, label: "Kesiapan Lulusan" },
  { icon: UsersRound, label: "Lingkungan Praktis" },
];

export default function TentangSekolah() {
  return (
    <section
      id="tentang-sekolah"
      aria-labelledby="tentang-sekolah-heading"
      className="scroll-mt-32 w-full bg-[#f5f7fb] px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop"
    >
      <article className="mx-auto grid max-w-container-max gap-space-xl rounded-3xl border border-slate-200 bg-white p-space-lg shadow-sm md:p-space-2xl lg:grid-cols-[minmax(15rem,0.8fr)_1.5fr] lg:gap-space-2xl">
        <ul className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-5 lg:border-r lg:border-slate-200 lg:pr-space-xl">
          {poinProfil.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-2 text-center lg:flex-row lg:gap-4 lg:text-left">
              <span className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-200 via-violet-100 to-amber-100 text-primary shadow-inner sm:size-24">
                <Icon aria-hidden className="size-9 sm:size-11" strokeWidth={1.6} />
              </span>
              <span className="max-w-32 font-title-sm font-bold leading-tight text-on-surface sm:max-w-none">{label}</span>
            </li>
          ))}
        </ul>

        <div className="min-w-0 py-1">
          <div className="flex items-center gap-2 font-label-md font-bold uppercase tracking-wider text-secondary">
            <BookOpen aria-hidden className="size-5" /> Informasi Sekolah
          </div>
          <h2 id="tentang-sekolah-heading" className="mt-3 font-headline-md text-headline-md font-bold text-primary">
            Tentang Sekolah
          </h2>
          <div className="mt-4 space-y-4 text-body-md leading-relaxed text-on-surface-variant">
            <p>
              <strong className="text-on-surface">SMK Negeri 24 Jakarta</strong> merupakan salah satu Sekolah Menengah Kejuruan Negeri unggulan yang berlokasi di kawasan Bambu Apus, Cipayung, Jakarta Timur. Terakreditasi <strong className="text-on-surface">A</strong> dan menerapkan sistem Pola Pengelolaan Keuangan Badan Layanan Umum Daerah (PPK-BLUD), sekolah ini berkomitmen penuh dalam mencetak lulusan yang berkarakter, kompeten, serta siap bersaing di dunia kerja, berwirausaha, maupun melanjutkan pendidikan ke jenjang perguruan tinggi.
            </p>
            <p>
              Lingkungan belajar di SMKN 24 Jakarta didukung oleh berbagai pilihan program keahlian yang sangat relevan dengan kebutuhan industri masa kini. Jurusan yang tersedia meliputi Rekayasa Perangkat Lunak (RPL) yang berfokus pada teknologi dan pemrograman digital, Perhotelan, Kuliner / Tata Boga, Desain dan Produksi Busana, serta Usaha Layanan Pariwisata.
            </p>
            <p>
              Untuk memastikan para siswa mendapatkan pengalaman praktis yang optimal, SMKN 24 Jakarta menyediakan fasilitas pendukung berstandar industri. Di antaranya adalah Edutel (hotel praktik) tiga lantai untuk siswa Perhotelan, laboratorium komputer modern untuk mendukung aktivitas pengembangan perangkat lunak, dapur dan ruang praktik kejuruan yang lengkap, serta auditorium dan perpustakaan sebagai pusat kegiatan literasi dan pengembangan minat siswa.
            </p>
          </div>
          <p id="info-sekolah" className="mt-5 flex scroll-mt-32 items-start gap-2 text-sm font-semibold text-on-surface-variant">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-secondary" /> Bambu Apus, Cipayung, Jakarta Timur
          </p>
        </div>
      </article>
    </section>
  );
}
