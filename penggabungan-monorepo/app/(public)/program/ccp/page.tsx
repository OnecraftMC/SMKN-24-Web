import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, HeartHandshake, Workflow } from "lucide-react";

export const metadata: Metadata = { title: "Program Pendidikan CCP | SMKN 24 Jakarta", description: "Pengenalan Character, Content & Process dalam pendidikan kejuruan." };

const pillars = [
  { icon: HeartHandshake, title: "Character", subtitle: "Karakter", text: "Membangun integritas, tanggung jawab, disiplin, komunikasi, dan sikap kerja yang baik." },
  { icon: BookOpenCheck, title: "Content", subtitle: "Konten kompetensi", text: "Mempelajari pengetahuan dan keterampilan kejuruan sesuai program keahlian dan kebutuhan belajar." },
  { icon: Workflow, title: "Process", subtitle: "Proses belajar", text: "Mengembangkan kompetensi lewat praktik, proyek, umpan balik, dan evaluasi yang terarah." },
];

export default function CCPPage() {
  return <main className="px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop"><div className="mx-auto max-w-container-max">
    <Link href="/jurusan" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-label-sm font-bold text-primary hover:bg-surface-container-low"><ArrowLeft aria-hidden className="size-4" />Program Keahlian</Link>
    <header className="mt-space-xl max-w-3xl"><p className="font-label-sm font-bold uppercase tracking-wider text-secondary">Pembelajaran holistik</p><h1 className="mt-2 font-headline-lg text-headline-lg font-bold text-primary">Program Pendidikan CCP</h1><p className="mt-4 text-body-lg leading-relaxed text-on-surface-variant">Character, Content &amp; Process memberi kerangka untuk mengembangkan diri, menguasai kompetensi, dan belajar melalui proses yang bermakna.</p></header>
    <ul className="mt-space-2xl grid gap-gutter-md md:grid-cols-3">{pillars.map(({ icon: Icon, title, subtitle, text }) => <li key={title} className="rounded-3xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm"><span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon aria-hidden className="size-6" /></span><h2 className="mt-5 font-headline-sm text-headline-sm font-bold text-primary">{title}</h2><p className="mt-1 font-label-sm font-bold text-secondary">{subtitle}</p><p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{text}</p></li>)}</ul>
    <p className="mt-space-xl max-w-3xl rounded-2xl bg-surface-container-low p-space-lg text-sm text-on-surface-variant">Rincian kegiatan dan penerapan CCP dapat berbeda menurut program serta agenda pembelajaran. Hubungi sekolah untuk informasi pelaksanaan terbaru.</p>
  </div></main>;
}
