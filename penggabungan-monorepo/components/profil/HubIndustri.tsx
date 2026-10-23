import Image from "next/image";
import { ArrowUpRight, Building2, Mail, MapPin, Phone } from "lucide-react";

export default function HubIndustri() {
  return (
    <section id="hub-industri" aria-labelledby="hub-industri-heading" className="scroll-mt-32 w-full px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="max-w-2xl">
          <p className="font-label-sm font-bold uppercase tracking-wider text-secondary">Kolaborasi dan karier</p>
          <h2 id="hub-industri-heading" className="mt-2 font-headline-md text-headline-md font-bold text-primary">Hub Industri</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">Hubungi sekolah untuk informasi kemitraan, sinkronisasi kompetensi, praktik kerja lapangan, dan peluang kolaborasi.</p>
        </div>
        <article className="mt-space-lg grid overflow-hidden rounded-3xl border border-surface-container bg-surface-container-lowest shadow-sm md:grid-cols-[minmax(15rem,0.8fr)_1.2fr]">
          <div className="flex min-h-52 items-center justify-center bg-surface-container-low p-space-xl">
            <Image src="/logo-smkn24.png" alt="Logo SMKN 24 Jakarta" width={120} height={120} className="h-24 w-24 object-contain" />
          </div>
          <div className="p-space-lg md:p-space-xl">
            <div className="flex items-center gap-2 text-secondary"><Building2 aria-hidden className="size-5" /><span className="text-xs font-bold uppercase tracking-wider">Kontak kemitraan sekolah</span></div>
            <h3 className="mt-2 font-title-lg text-title-lg font-bold text-primary">SMKN 24 Jakarta</h3>
            <p className="mt-3 text-body-sm leading-relaxed text-on-surface-variant">Sekolah menerima komunikasi dari mitra industri untuk membahas kebutuhan kompetensi, kegiatan pembelajaran, dan penempatan praktik. Rincian mitra aktif dapat dikonfirmasi langsung kepada sekolah.</p>
            <p className="mt-4 flex items-start gap-2 text-sm text-on-surface-variant"><MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />Jalan Bambu Hitam, Bambu Apus, Cipayung, Jakarta Timur, DKI Jakarta</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="mailto:humassmkn24jakarta@gmail.com" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 font-label-sm font-bold text-on-primary hover:bg-primary/90"><Mail aria-hidden className="size-4" /> Hubungi via email <ArrowUpRight aria-hidden className="size-4" /></a>
              <a href="tel:+62218441976" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 py-2 font-label-sm font-bold text-primary hover:bg-surface-container-low"><Phone aria-hidden className="size-4" />(021) 844-1976</a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
