import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, GraduationCap } from "lucide-react";
import { getArsip, getPengumuman } from "@/lib/api";
import { Reveal } from "@/components/ui/Reveal";
import CekKelulusan from "@/components/akademik/CekKelulusan";

export const metadata: Metadata = {
  title: "Pengumuman Kelulusan | SMKN 24 Jakarta",
  description: "Informasi resmi kelulusan dan dokumen alumni SMKN 24 Jakarta.",
};

export default async function PengumumanKelulusanPage() {
  const [noticeResult, archiveResult] = await Promise.all([getPengumuman(), getArsip()]);
  const notices = (noticeResult.data ?? []).filter((item) => /lulus|kelulusan|alumni/i.test(`${item.judul} ${item.kategori}`));
  const archives = (archiveResult.data ?? []).filter((item) => /lulus|kelulusan|alumni|ijazah/i.test(`${item.judul} ${item.kategori} ${item.deskripsi ?? ""}`));

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
        <Reveal delay={80}>
          <section aria-labelledby="pengumuman-kelulusan-heading"><h2 id="pengumuman-kelulusan-heading" className="font-headline-sm text-headline-sm font-bold text-primary">Pengumuman resmi</h2>
            {noticeResult.error ? <p role="alert" className="mt-4 rounded-xl border border-error-container bg-error-container/30 p-space-md text-sm">Informasi belum dapat dimuat. {noticeResult.error}</p> : notices.length ? <ul className="mt-4 space-y-3">{notices.map((item) => <li key={item.id} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg"><Link href={`/pengumuman/${item.id}`} className="font-title-md font-bold text-primary hover:text-secondary">{item.judul}<ArrowUpRight aria-hidden className="ml-2 inline size-4" /></Link><p className="mt-2 text-sm text-on-surface-variant">{item.deskripsi}</p></li>)}</ul> : <p role="status" className="mt-4 rounded-xl border border-surface-container bg-surface-container-low p-space-lg text-sm text-on-surface-variant">Belum ada pengumuman kelulusan aktif. Silakan pantau kanal resmi sekolah.</p>}
          </section>
        </Reveal>
        <Reveal delay={140}>
          <section aria-labelledby="arsip-lulusan-heading"><h2 id="arsip-lulusan-heading" className="font-headline-sm text-headline-sm font-bold text-primary">Arsip data kelulusan alumni</h2>
            {archiveResult.error ? <p role="alert" className="mt-4 rounded-xl border border-error-container bg-error-container/30 p-space-md text-sm">Arsip belum dapat dimuat. {archiveResult.error}</p> : archives.length ? <ul className="mt-4 grid gap-3 md:grid-cols-2">{archives.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md"><div><p className="font-bold text-primary">{item.judul}</p><p className="mt-1 text-xs text-on-surface-variant">{item.kategori} · {item.namaFile}</p></div><a href={item.downloadUrl} download={item.namaFile} className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary">Unduh</a></li>)}</ul> : <p role="status" className="mt-4 rounded-xl border border-surface-container bg-surface-container-low p-space-lg text-sm text-on-surface-variant">Belum ada arsip kelulusan alumni yang dipublikasikan di direktori arsip.</p>}
          </section>
        </Reveal>
        <Reveal delay={180}><p className="text-sm text-on-surface-variant">Untuk verifikasi dokumen atau informasi pribadi kelulusan, hubungi sekolah melalui <a className="font-bold text-primary underline" href="mailto:humassmkn24jakarta@gmail.com">email humas</a>.</p></Reveal>
      </div></main>
    </div>
  );
}
