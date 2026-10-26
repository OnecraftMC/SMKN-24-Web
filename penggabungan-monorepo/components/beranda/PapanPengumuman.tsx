import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import type { PengumumanView } from "@/lib/shared/mappers";
import Badge from "@/components/ui/Badge";

export default function PapanPengumuman({
  pengumuman,
  pengumumanLampau,
  error,
}: {
  pengumuman: PengumumanView[];
  pengumumanLampau: PengumumanView[];
  error: string | null;
}) {
  return (
    <section aria-labelledby="pengumuman-penting" className="w-full bg-primary px-margin-mobile py-space-3xl text-on-primary md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 font-label-sm font-bold uppercase tracking-wider text-secondary-container">
              <Megaphone aria-hidden className="size-[18px]" /> Informasi prioritas sekolah
            </div>
            <h2 id="pengumuman-penting" className="mt-1 font-headline-md text-headline-md font-bold text-surface">Pengumuman Penting</h2>
            <p className="mt-2 max-w-2xl text-sm text-primary-fixed">Informasi resmi untuk siswa, orang tua, dan calon peserta didik.</p>
          </div>
          <details className="group relative self-start sm:self-auto">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-white/30 px-4 py-2 font-label-md font-bold text-surface transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&::-webkit-details-marker]:hidden">
              <span>Papan pengumuman</span>
              <Badge variant="neutral" className="tabular-nums" label={String(pengumumanLampau.length)} />
            </summary>
            <div className="absolute right-0 top-full z-30 mt-2 w-[min(28rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest text-on-surface shadow-xl">
              <div className="border-b border-surface-container px-space-md py-space-sm">
                <h3 className="font-title-md font-bold text-primary">Pengumuman sebelumnya</h3>
                <p className="mt-1 font-body-sm text-on-surface-variant">Pengumuman yang tanggalnya telah berlalu.</p>
              </div>
              {pengumumanLampau.length ? (
                <ul className="max-h-80 divide-y divide-surface-container overflow-y-auto px-space-md">
                  {pengumumanLampau.map((item) => (
                    <li key={item.id} className="py-space-sm">
                      <time dateTime={item.tanggalIso} className="font-label-sm font-bold text-on-surface-variant">
                        {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(
                          new Date(`${item.tanggalIso}T00:00:00Z`),
                        )}
                      </time>
                      <h4 className="mt-1 font-title-sm font-bold text-primary">{item.judul}</h4>
                      <p className="mt-1 line-clamp-2 font-body-sm text-on-surface-variant">{item.deskripsi}</p>
                      <Link href={`/pengumuman/${item.id}`} className="mt-2 inline-flex min-h-10 items-center gap-1 font-label-sm font-bold text-primary underline underline-offset-4">
                        Info selengkapnya <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-space-md py-space-lg font-body-sm text-on-surface-variant" role="status">
                  Belum ada pengumuman yang berlalu.
                </p>
              )}
            </div>
          </details>
        </div>

        {pengumuman.length ? (
          <div className="mt-space-lg grid gap-gutter-md md:grid-cols-2" aria-live="polite">
            {pengumuman.map((item) => (
              <article key={item.id} className="rounded-3xl border border-white/15 bg-white p-space-lg text-on-surface shadow-lg md:p-space-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.variant === "secondary" ? "inkSecondary" : "inkSolid"} label={item.badge || item.kategori} />
                  {item.penting && <span className="rounded-full bg-error-container px-3 py-1 text-xs font-bold text-on-error-container">Prioritas</span>}
                  {item.status && <span className="text-sm font-bold text-secondary">{item.status}</span>}
                </div>
                <time dateTime={item.tanggalIso} className="mt-4 block font-label-sm font-bold text-on-surface-variant">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(
                    new Date(`${item.tanggalIso}T00:00:00Z`),
                  )}
                </time>
                <h3 className="mt-2 max-w-4xl font-headline-sm text-headline-sm font-bold text-primary">{item.judul}</h3>
                <p className="mt-3 max-w-4xl whitespace-pre-line text-body-md leading-relaxed text-on-surface-variant">{item.deskripsi}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/pengumuman/${item.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md font-bold text-on-primary transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                    Info Selengkapnya <ArrowRight aria-hidden className="size-4" />
                  </Link>
                  {item.linkHref && item.linkLabel && (
                    <a href={item.linkHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline-variant px-5 py-2.5 font-label-md font-bold text-primary hover:bg-surface-container-low">{item.linkLabel}</a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p role="status" className="mt-space-lg rounded-2xl border border-white/20 bg-white/10 p-space-lg text-sm text-surface">
            {error ? `Pengumuman belum dapat dimuat: ${error}` : "Belum ada pengumuman aktif."}
          </p>
        )}
      </div>
    </section>
  );
}
