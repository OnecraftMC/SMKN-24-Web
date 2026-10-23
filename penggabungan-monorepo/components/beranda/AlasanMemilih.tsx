import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Building2,
  BriefcaseBusiness,
  HeartHandshake,
  MonitorCog,
} from "lucide-react";

const keunggulan = [
  {
    ikon: BriefcaseBusiness,
    judul: "Lima Program Keahlian",
    isi: "Rekayasa Perangkat Lunak, Perhotelan, Kuliner, Desain dan Produksi Busana, serta Usaha Layanan Pariwisata.",
  },
  {
    ikon: MonitorCog,
    judul: "Future Skills Academic",
    isi: "Pengalaman belajar bersama mentor industri, proyek praktik, dan bekal keterampilan untuk langkah setelah lulus.",
    href: "/program/future-skills",
    unggulan: true,
  },
  {
    ikon: Award,
    judul: "Terakreditasi A",
    isi: "Mendukung komitmen sekolah untuk menjaga mutu pendidikan dan pembelajaran kejuruan.",
  },
  {
    ikon: Building2,
    judul: "Fasilitas Praktik",
    isi: "Edutel sebagai hotel praktik, laboratorium komputer, serta dapur dan ruang praktik kejuruan.",
  },
  {
    ikon: BookOpenCheck,
    judul: "Program Pendidikan CCP",
    isi: "Character, Content & Process menguatkan karakter, penguasaan materi, dan proses belajar siswa.",
  },
  {
    ikon: HeartHandshake,
    judul: "Pengembangan Diri",
    isi: "Kegiatan ekstrakurikuler membantu siswa mengembangkan minat, bakat, dan kebiasaan berkolaborasi.",
  },
];

export default function AlasanMemilih() {
  return (
    <section
      aria-labelledby="alasan-memilih"
      className="w-full bg-[#f3f4f6] px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop"
    >
      <div className="mx-auto max-w-container-max">
        <div className="mb-space-xl max-w-3xl">
          <p className="font-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
            Pilihan untuk masa depan
          </p>
          <h2 id="alasan-memilih" className="mt-2 font-headline-md text-headline-md font-bold text-black">
            Alasan Memilih SMKN 24 Jakarta
          </h2>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Kenali program, pengalaman belajar, dan lingkungan yang mendukung perjalanan keahlian siswa.
          </p>
        </div>

        <ul className="grid gap-gutter-md sm:grid-cols-2 lg:grid-cols-3">
          {keunggulan.map(({ ikon: Icon, judul, isi, href, unggulan }) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid size-10 place-items-center rounded-full ${unggulan ? "bg-white text-[#1453b4]" : "bg-surface-container-low text-primary"}`}>
                    <Icon aria-hidden className="size-5" />
                  </span>
                  {unggulan && <ArrowRight aria-hidden className="size-5" />}
                </div>
                <h3 className="mt-3 font-title-md text-title-md font-bold">{judul}</h3>
                <p className={`mt-1 text-body-sm ${unggulan ? "text-white/90" : "text-on-surface-variant"}`}>{isi}</p>
                {unggulan && <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold">Pelajari program <ArrowRight aria-hidden className="size-4" /></span>}
              </>
            );

            return (
              <li key={judul}>
                {href ? (
                  <Link
                    href={href}
                    className="group block h-full min-h-40 rounded-2xl bg-[#1453b4] p-space-lg text-white shadow-sm transition hover:bg-[#104798] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1453b4]"
                  >
                    {content}
                  </Link>
                ) : (
                  <article className="h-full min-h-40 rounded-2xl border border-slate-300 bg-white p-space-lg text-[#111827] shadow-sm">
                    {content}
                  </article>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
