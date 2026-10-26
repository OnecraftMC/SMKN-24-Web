import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import CekKelulusan from "@/components/akademik/CekKelulusan";

export const metadata: Metadata = {
  title: "Pengumuman Kelulusan | SMKN 24 Jakarta",
  description: "Informasi resmi kelulusan dan dokumen alumni SMKN 24 Jakarta.",
};

export default async function PengumumanKelulusanPage() {
  return (
    <div className="min-h-[60vh]">
      <header className="bg-primary px-margin-mobile py-space-2xl text-on-primary md:px-margin-tablet lg:px-margin-desktop"><div className="mx-auto max-w-container-max">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-label-sm font-bold text-primary-fixed hover:bg-white/10"><ArrowLeft aria-hidden className="size-4" />Beranda</Link>
        <div className="mt-space-lg flex items-center gap-2 text-secondary-container"><GraduationCap aria-hidden className="size-5" /><span className="text-xs font-bold uppercase tracking-wider">Informasi siswa dan alumni</span></div>
        <h1 className="mt-2 font-headline-lg text-headline-lg font-bold text-surface">Pengumuman Kelulusan</h1>
        <p className="mt-3 max-w-2xl text-primary-fixed">Pengumuman dan dokumen kelulusan ditampilkan di sini setelah diterbitkan melalui kanal resmi sekolah.</p>
      </div></header>
      <main className="px-margin-mobile py-space-2xl md:px-margin-tablet lg:px-margin-desktop"><div className="mx-auto max-w-container-max space-y-space-2xl">
        <Reveal>
          <section aria-labelledby="cek-kelulusan-heading">
            <CekKelulusan />
          </section>
        </Reveal>
        <Reveal delay={180}><p className="text-sm text-on-surface-variant">Untuk verifikasi dokumen atau informasi pribadi kelulusan, hubungi sekolah melalui <a className="font-bold text-primary underline" href="mailto:humassmkn24jakarta@gmail.com">email humas</a>.</p></Reveal>
      </div></main>
    </div>
  );
}
