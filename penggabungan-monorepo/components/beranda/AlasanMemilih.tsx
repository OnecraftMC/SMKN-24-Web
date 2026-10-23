import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, HeartHandshake, Medal, MonitorCog } from "lucide-react";

const keunggulan = [
  { ikon: BriefcaseBusiness, judul: "Belajar berbasis keahlian", isi: "Lima program keahlian membekali siswa dengan kompetensi yang relevan untuk dunia kerja." },
  { ikon: MonitorCog, judul: "Pengalaman praktik", isi: "Pembelajaran praktik membantu siswa membangun karya, portofolio, dan kebiasaan kerja profesional." },
  { ikon: HeartHandshake, judul: "Karakter dan kolaborasi", isi: "Lingkungan sekolah mendorong tanggung jawab, komunikasi, dan kepedulian." },
  { ikon: Medal, judul: "Sertifikasi kompetensi", isi: "LSP-P1 sekolah mendukung pengakuan kompetensi melalui skema sertifikasi yang tersedia." },
];

export default function AlasanMemilih() {
  return (
    <section aria-labelledby="alasan-memilih" className="px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="mb-space-xl flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-label-sm font-bold uppercase tracking-wider text-secondary">Masa depan dimulai di sini</p>
            <h2 id="alasan-memilih" className="mt-2 font-headline-md text-headline-md font-bold text-primary">Alasan Memilih SMKN 24 Jakarta</h2>
            <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">Bekal keahlian, pengalaman praktik, dan karakter untuk melangkah setelah lulus.</p>
          </div>
          <Link href="/profil" className="inline-flex min-h-11 items-center gap-2 font-label-md font-bold text-primary hover:text-secondary">
            Kenali sekolah <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
        <ul className="grid gap-gutter-md sm:grid-cols-2 lg:grid-cols-4">
          {keunggulan.map(({ ikon: Icon, judul, isi }) => (
            <li key={judul} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
              <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon aria-hidden className="size-5" /></span>
              <h3 className="font-title-md text-title-md font-bold text-primary">{judul}</h3>
              <p className="mt-2 text-body-sm text-on-surface-variant">{isi}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
