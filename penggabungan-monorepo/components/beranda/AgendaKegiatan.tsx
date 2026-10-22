import { CalendarDays, ChevronDown, Clock, History } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { formatDateId } from "@/lib/shared/mappers";
import type { AgendaView } from "@/lib/shared/mappers";

export default function AgendaKegiatan({
  agenda,
  pastAgenda,
  error,
}: {
  agenda: AgendaView[];
  pastAgenda: AgendaView[];
  error: string | null;
}) {
  return (
    <section className="w-full py-space-3xl bg-surface-container-low px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">
              Kalender Sekolah
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              Agenda &amp; Aktivitas Terdekat
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <details className="group relative">
              <summary
                aria-label={`Papan agenda, ${pastAgenda.length} agenda lampau`}
                className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 font-label-md text-label-md font-bold text-primary transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary [&::-webkit-details-marker]:hidden"
              >
                <History aria-hidden="true" className="h-[18px] w-[18px]" />
                <span>Papan agenda</span>
                <Badge variant="neutral" className="tabular-nums" label={String(pastAgenda.length)} />
                <ChevronDown aria-hidden="true" className="h-[18px] w-[18px] transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute left-0 top-full z-30 mt-space-sm w-[min(26rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-xl sm:left-auto sm:right-0">
                <div className="border-b border-surface-container px-space-md py-space-sm">
                  <h3 className="font-title-md font-bold text-primary">Agenda lampau</h3>
                  <p className="mt-1 font-body-sm text-on-surface-variant">
                    Kegiatan yang sudah selesai.
                  </p>
                </div>
                {error ? (
                  <p className="px-space-md py-space-lg font-body-sm text-error" role="alert">
                    Agenda lampau belum dapat dimuat: {error}
                  </p>
                ) : pastAgenda.length > 0 ? (
                  <ul className="max-h-80 divide-y divide-surface-container overflow-y-auto px-space-md">
                    {pastAgenda.map((item) => (
                      <li key={item.id} className="py-space-sm">
                        <p className="font-label-sm font-bold text-on-surface-variant">
                          {formatDateId(item.tglMulai)}
                          {item.tglSelesai && item.tglSelesai !== item.tglMulai
                            ? ` – ${formatDateId(item.tglSelesai)}`
                            : ""}
                        </p>
                        <h4 className="mt-1 font-title-sm text-title-sm font-bold text-primary">{item.title}</h4>
                        {item.deskripsi && (
                          <p className="mt-1 line-clamp-2 font-body-sm text-on-surface-variant">
                            {item.deskripsi}
                          </p>
                        )}
                        {(item.waktu || item.lokasi) && (
                          <p className="mt-1 font-label-sm text-on-surface-variant">
                            {[item.waktu, item.lokasi].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-space-md py-space-lg font-body-sm text-on-surface-variant" role="status">
                    Belum ada agenda yang berlalu.
                  </p>
                )}
              </div>
            </details>
            <Link
              href="/akademik"
              className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 py-2 font-label-md text-label-md font-bold text-primary transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <span>Kalender Akademik Lengkap</span>
              <CalendarDays aria-hidden="true" className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>

        <div className="micro-stagger grid grid-cols-1 md:grid-cols-3 gap-gutter-md">
          {agenda.map((item) => (
            <div
              key={item.id}
              className="micro-shine group relative bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-start gap-space-md border border-surface-container motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-primary text-surface flex flex-col items-center justify-center text-center transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
                <span className="font-headline-md text-headline-md font-extrabold text-secondary-container leading-none">
                  {item.day}
                </span>
                <span className="font-label-sm text-label-sm uppercase font-bold tracking-wider text-surface-container-high">
                  {item.month}
                </span>
              </div>
              <div className="space-y-1">
                <Badge variant="adat" className="bg-surface-container-high text-on-surface" label={item.badge} />
                <h3 className="font-title-md text-title-md text-primary font-bold">{item.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{item.desc}</p>
                <p className="font-label-sm text-label-sm text-outline flex items-center gap-1 pt-1">
                  <Clock aria-hidden="true" className="h-4 w-4" />
                  {item.time}
                </p>
              </div>
            </div>
          ))}
          {agenda.length === 0 && (
            <p className="md:col-span-3 rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
              {error ? `Agenda belum dapat dimuat: ${error}` : "Belum ada agenda yang ditampilkan."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
