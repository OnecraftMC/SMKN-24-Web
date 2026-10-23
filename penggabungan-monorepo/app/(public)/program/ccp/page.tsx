import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  HeartHandshake,
  Lightbulb,
  MessageSquareText,
  Workflow,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Program Pendidikan CCP | SMKN 24 Jakarta",
  description:
    "Kenali pendekatan Character, Content & Process untuk mendukung karakter, kompetensi, dan pengalaman belajar siswa SMKN 24 Jakarta.",
};

const pilar = [
  {
    icon: HeartHandshake,
    title: "Character",
    subtitle: "Tumbuh sebagai pribadi yang siap bekerja dan berkarya",
    intro:
      "Pembelajaran karakter membantu siswa mengenali kekuatan diri dan membangun sikap yang dibutuhkan dalam kehidupan, pendidikan lanjutan, dan dunia kerja.",
    points: [
      "Melatih tanggung jawab, disiplin, integritas, dan kemandirian.",
      "Membiasakan komunikasi yang santun, kerja sama, dan sikap saling menghargai.",
      "Mengembangkan kebiasaan refleksi, kepedulian, dan kemauan untuk terus belajar.",
    ],
    example: "Terlihat dalam budaya kelas, kerja kelompok, praktik kejuruan, dan tanggung jawab terhadap hasil pekerjaan.",
  },
  {
    icon: BookOpenCheck,
    title: "Content",
    subtitle: "Menguasai pengetahuan dan keterampilan kejuruan",
    intro:
      "Materi belajar menghubungkan pengetahuan dasar dengan kompetensi program keahlian. Siswa dibimbing untuk memahami alasan di balik suatu praktik, bukan hanya menghafal langkahnya.",
    points: [
      "Mempelajari konsep dan istilah yang digunakan dalam bidang keahlian.",
      "Mengembangkan keterampilan teknis sesuai program keahlian masing-masing.",
      "Menghubungkan materi pelajaran dengan konteks kerja, layanan, dan kebutuhan masyarakat.",
    ],
    example: "Konten disesuaikan dengan bidang siswa, seperti teknologi, perhotelan, kuliner, busana, dan layanan pariwisata.",
  },
  {
    icon: Workflow,
    title: "Process",
    subtitle: "Belajar melalui praktik, umpan balik, dan perbaikan",
    intro:
      "Proses belajar memberi ruang bagi siswa untuk mencoba, menghasilkan karya, menerima masukan, lalu memperbaiki hasilnya secara bertahap.",
    points: [
      "Memahami tujuan, kriteria keberhasilan, dan tahapan suatu tugas.",
      "Menerapkan pengetahuan melalui praktik, proyek, simulasi, atau pemecahan masalah.",
      "Mendapatkan umpan balik dan menggunakannya untuk meningkatkan kualitas hasil.",
    ],
    example: "Guru dapat mengajak siswa meninjau proses dan hasil agar kemajuan serta kebutuhan dukungan berikutnya terlihat.",
  },
];

const alur = [
  { icon: Lightbulb, title: "Pahami tujuan", text: "Siswa mengetahui kompetensi yang akan dicapai dan kaitannya dengan bidang keahlian." },
  { icon: Workflow, title: "Coba dan praktikkan", text: "Pengetahuan diterapkan melalui latihan, tugas, praktik, proyek, atau simulasi." },
  { icon: MessageSquareText, title: "Terima masukan", text: "Guru dan teman memberi umpan balik yang jelas untuk membantu proses belajar." },
  { icon: CheckCircle2, title: "Refleksi dan tingkatkan", text: "Siswa menilai kemajuan, memperbaiki hasil, dan menetapkan langkah belajar berikutnya." },
];

export default function CCPPage() {
  return (
    <main className="px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <Link
          href="/jurusan"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-label-sm font-bold text-primary hover:bg-surface-container-low"
        >
          <ArrowRight aria-hidden className="size-4 rotate-180" /> Program Keahlian
        </Link>

        <header className="mt-space-xl rounded-3xl bg-primary px-space-lg py-space-2xl text-on-primary md:px-space-2xl lg:px-space-3xl">
          <p className="font-label-sm font-bold uppercase tracking-[0.16em] text-secondary-container">
            Pembelajaran holistik
          </p>
          <h1 className="mt-3 max-w-4xl font-headline-lg text-headline-lg font-bold">
            Program Pendidikan CCP
          </h1>
          <p className="mt-4 max-w-3xl text-body-lg leading-relaxed text-primary-fixed">
            Character, Content &amp; Process menyatukan pembentukan karakter, penguasaan kompetensi,
            dan pengalaman belajar yang terarah. Ketiganya membantu siswa berkembang sebagai pribadi
            sekaligus calon tenaga kerja yang siap belajar dan beradaptasi.
          </p>
          <div className="mt-space-lg flex flex-wrap gap-2" aria-label="Tiga pilar CCP">
            {pilar.map(({ title }) => (
              <span key={title} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-surface">
                {title}
              </span>
            ))}
          </div>
        </header>

        <section className="mt-space-3xl" aria-labelledby="ccp-tujuan">
          <div className="max-w-3xl">
            <p className="font-label-sm font-bold uppercase tracking-wider text-secondary">Tentang pendekatan ini</p>
            <h2 id="ccp-tujuan" className="mt-2 font-headline-md text-headline-md font-bold text-primary">
              Belajar untuk berkembang secara utuh
            </h2>
            <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
              CCP bukan tiga mata pelajaran terpisah. Character, Content, dan Process saling mendukung
              dalam kegiatan belajar sehari-hari: siswa membangun sikap yang baik, menguasai materi
              kejuruan, lalu menggunakannya dalam proses yang memberi ruang untuk berlatih dan berkembang.
            </p>
          </div>

          <div className="mt-space-xl grid gap-gutter-md lg:grid-cols-3">
            {pilar.map(({ icon: Icon, title, subtitle, intro, points, example }) => (
              <article key={title} className="flex h-full flex-col rounded-3xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon aria-hidden className="size-6" />
                </span>
                <h3 className="mt-5 font-headline-sm text-headline-sm font-bold text-primary">{title}</h3>
                <p className="mt-1 font-label-sm font-bold text-secondary">{subtitle}</p>
                <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">{intro}</p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-on-surface-variant">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-secondary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-auto border-t border-surface-container pt-4 text-xs leading-relaxed text-on-surface-variant">
                  <span className="font-bold text-primary">Contoh penerapan: </span>{example}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-space-3xl rounded-3xl bg-surface-container-low p-space-lg md:p-space-xl" aria-labelledby="ccp-alur">
          <div className="max-w-3xl">
            <p className="font-label-sm font-bold uppercase tracking-wider text-secondary">Pengalaman belajar</p>
            <h2 id="ccp-alur" className="mt-2 font-headline-md text-headline-md font-bold text-primary">
              Dari tujuan belajar hingga perbaikan
            </h2>
            <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
              Dalam pembelajaran kejuruan, siswa perlu kesempatan untuk mencoba dan memperbaiki.
              Alur berikut menggambarkan proses belajar yang dapat digunakan sesuai materi dan kegiatan.
            </p>
          </div>
          <ol className="mt-space-xl grid gap-gutter-sm sm:grid-cols-2 xl:grid-cols-4">
            {alur.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-on-primary">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="font-label-sm font-bold uppercase tracking-wide text-secondary">Tahap {index + 1}</span>
                </div>
                <h3 className="mt-4 font-title-md font-bold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-space-xl grid gap-gutter-md lg:grid-cols-2" aria-label="Manfaat dan penerapan CCP">
          <article className="rounded-3xl border border-surface-container bg-surface-container-lowest p-space-lg">
            <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Apa yang dikembangkan?</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Sikap profesional dan tanggung jawab", "Pengetahuan dan keterampilan sesuai keahlian", "Kemampuan berkomunikasi dan bekerja sama", "Kebiasaan refleksi dan belajar sepanjang hayat"].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-on-surface-variant">
                  <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-secondary" /> {item}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border border-surface-container bg-surface-container-lowest p-space-lg">
            <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Penerapan menyesuaikan pembelajaran</h2>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              Bentuk kegiatan CCP dapat berbeda menurut materi, program keahlian, dan agenda sekolah.
              Guru menentukan strategi, praktik, dan umpan balik yang sesuai dengan tujuan belajar serta
              kebutuhan siswa. Informasi pelaksanaan kegiatan tertentu dapat dikonfirmasi langsung kepada sekolah.
            </p>
            <Link href="/program/future-skills" className="mt-4 inline-flex min-h-11 items-center gap-2 font-label-md font-bold text-primary hover:text-secondary">
              Kenali program Future Skills Academic <ArrowRight aria-hidden className="size-4" />
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
