import Image from "next/image";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import type { HubIndustriView } from "@/lib/shared/mappers";

export default function HubIndustri({
  mitra,
  error,
}: {
  mitra: HubIndustriView[];
  error: string | null;
}) {
  return (
    <section id="hub-industri" aria-labelledby="hub-industri-heading" className="scroll-mt-32 w-full px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="mx-auto mb-space-xl max-w-3xl text-center">
          <span aria-hidden className="mx-auto mb-3 block h-1 w-20 rounded-full bg-[#c8102e]" />
          <h2 id="hub-industri-heading" className="font-headline-md text-headline-md font-bold text-primary">
            Kolaborasi Nyata untuk <span className="text-[#c8102e]">Generasi Digital yang Siap Bersaing.</span>
          </h2>
          <p className="mt-3 text-body-sm text-on-surface-variant">Kenali mitra industri dan peluang kolaborasi pembelajaran SMKN 24 Jakarta.</p>
        </div>

        <div className="grid gap-gutter-md sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-[#c8102e] p-space-lg text-center text-white shadow-sm">
            <Building2 aria-hidden className="size-7" />
            <p className="mt-4 font-headline-sm text-headline-sm font-bold">Hub Industri</p>
            <p className="mt-1 max-w-52 text-sm text-white/90">Kolaborasi untuk pengalaman belajar dan kesiapan kerja siswa.</p>
          </div>

          {mitra.map((item) => {
            const external = item.linkHref?.startsWith("http") ?? false;
            return (
              <article key={item.id} className="flex h-full min-h-48 flex-col rounded-2xl border border-dashed border-slate-300 bg-white p-space-md transition hover:border-[#c8102e]/50 hover:shadow-md">
                <div className="flex items-center justify-between gap-3">
                  {item.logo ? (
                    <Image src={item.logo} alt={`Logo ${item.nama}`} width={120} height={48} className="h-10 max-w-36 object-contain object-left" unoptimized />
                  ) : (
                    <span className="grid size-10 place-items-center rounded-lg bg-surface-container-low text-primary"><Building2 aria-hidden className="size-5" /></span>
                  )}
                  {item.linkHref && (
                    <a href={item.linkHref} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} aria-label={`${item.linkLabel || "Kunjungi"} — ${item.nama}`} className="grid size-9 shrink-0 place-items-center rounded-full bg-[#c8102e] text-white transition hover:bg-[#a60d25]">
                      <ArrowUpRight aria-hidden className="size-4" />
                    </a>
                  )}
                </div>
                <h3 className="mt-3 font-title-md text-title-md font-bold text-primary">{item.nama}</h3>
                <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-on-surface-variant"><MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />{item.alamat}</p>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-on-surface-variant">{item.deskripsi}</p>
                {item.linkHref && item.linkLabel && (
                  <a href={item.linkHref} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="mt-3 inline-flex min-h-9 items-center self-start text-xs font-bold text-[#c8102e] hover:underline">
                    {item.linkLabel} <ArrowUpRight aria-hidden className="ml-1 size-3.5" />
                  </a>
                )}
              </article>
            );
          })}
        </div>

        {error ? (
          <p role="status" className="mt-4 rounded-xl border border-error-container bg-error-container/30 p-space-md text-sm text-on-error-container">Daftar mitra belum dapat dimuat. {error}</p>
        ) : mitra.length === 0 ? (
          <p role="status" className="mt-4 rounded-xl border border-dashed border-surface-container bg-surface-container-lowest p-space-md text-center text-sm text-on-surface-variant">Belum ada mitra industri yang dipublikasikan. Informasi akan ditampilkan setelah ditambahkan melalui admin.</p>
        ) : null}
      </div>
    </section>
  );
}
