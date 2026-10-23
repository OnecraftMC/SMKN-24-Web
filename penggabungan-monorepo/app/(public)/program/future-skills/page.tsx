import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Compass, Lightbulb } from "lucide-react";

export const metadata: Metadata = { title: "Future Skills Academic | SMKN 24 Jakarta", description: "Gambaran pembelajaran, mentor industri, dan pengembangan keterampilan masa depan." };

const steps = [
  { title: "Belajar dari konteks kerja", text: "Materi dapat dikaitkan dengan tantangan, alur kerja, dan standar profesi yang relevan dengan program keahlian." },
  { title: "Mendapatkan bimbingan", text: "Mentor praktisi dapat berbagi pengalaman, memberi umpan balik atas proyek, serta mengenalkan etika dan kebiasaan kerja." },
  { title: "Membangun bukti kompetensi", text: "Siswa berlatih menghasilkan proyek dan portofolio yang membantu menunjukkan kemampuan secara konkret." },
];

export default function FutureSkillsPage() {
  return <main className="px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop"><div className="mx-auto max-w-container-max">
    <Link href="/jurusan" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-label-sm font-bold text-primary hover:bg-surface-container-low"><ArrowLeft aria-hidden className="size-4" />Program Keahlian</Link>
    <header className="mt-space-xl rounded-3xl bg-primary p-space-lg text-on-primary md:p-space-2xl"><p className="font-label-sm font-bold uppercase tracking-wider text-secondary-container">Future Skills Academic</p><h1 className="mt-2 max-w-3xl font-headline-lg text-headline-lg font-bold text-surface">Keterampilan untuk dunia yang terus berubah</h1><p className="mt-4 max-w-3xl text-body-lg leading-relaxed text-primary-fixed">Pengalaman belajar yang menghubungkan kompetensi sekolah dengan praktik profesional, didukung bimbingan mentor dan proyek yang bermakna.</p></header>
    <section className="mt-space-2xl" aria-labelledby="future-skills-experience"><div className="max-w-2xl"><p className="font-label-sm font-bold uppercase tracking-wider text-secondary">Pengalaman siswa</p><h2 id="future-skills-experience" className="mt-2 font-headline-md text-headline-md font-bold text-primary">Dari belajar ke berkarya</h2></div>
      <ol className="mt-space-lg grid gap-gutter-md lg:grid-cols-3">{steps.map((step, index) => <li key={step.title} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"><span className="grid size-9 place-items-center rounded-full bg-secondary-container font-bold text-on-secondary-container">0{index + 1}</span><h3 className="mt-4 font-title-md text-title-md font-bold text-primary">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{step.text}</p></li>)}</ol>
    </section>
    <section className="mt-space-2xl grid gap-gutter-md md:grid-cols-3" aria-label="Manfaat program"><div className="rounded-2xl bg-surface-container-low p-space-lg"><BriefcaseBusiness aria-hidden className="size-6 text-primary" /><h2 className="mt-3 font-title-md font-bold text-primary">Wawasan industri</h2><p className="mt-2 text-sm text-on-surface-variant">Mengenal ekspektasi profesi dan kemungkinan jalur karier.</p></div><div className="rounded-2xl bg-surface-container-low p-space-lg"><Lightbulb aria-hidden className="size-6 text-primary" /><h2 className="mt-3 font-title-md font-bold text-primary">Keterampilan adaptif</h2><p className="mt-2 text-sm text-on-surface-variant">Melatih pemecahan masalah, kolaborasi, komunikasi, dan kreativitas.</p></div><div className="rounded-2xl bg-surface-container-low p-space-lg"><BadgeCheck aria-hidden className="size-6 text-primary" /><h2 className="mt-3 font-title-md font-bold text-primary">Portofolio dan kesiapan</h2><p className="mt-2 text-sm text-on-surface-variant">Membawa hasil karya dan pengalaman sebagai bekal melanjutkan studi atau memasuki dunia kerja.</p></div></section>
    <p className="mt-space-xl flex gap-3 rounded-2xl border border-secondary-container bg-secondary-container/20 p-space-lg text-sm leading-relaxed text-on-surface-variant"><Compass aria-hidden className="mt-0.5 size-5 shrink-0 text-secondary" />Kegiatan, mentor, dan mitra yang tersedia mengikuti program sekolah pada tahun berjalan. Untuk memastikan jadwal atau kesempatan terbaru, hubungi sekolah melalui halaman <Link href="/profil#hub-industri" className="font-bold text-primary underline">Hub Industri</Link>.</p>
  </div></main>;
}
