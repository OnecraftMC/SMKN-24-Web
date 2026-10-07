"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, X } from "lucide-react";
import type { AgendaDTO } from "@/lib/shared/mappers";

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isDateInEventRange(date: string, event: AgendaDTO): boolean {
  const start = event.tglMulai.slice(0, 10);
  const end = (event.tglSelesai || event.tglMulai).slice(0, 10);
  return date >= start && date <= end;
}

export default function KalenderKegiatan({
  events,
  error,
}: {
  events: AgendaDTO[];
  error: string | null;
}) {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      0,
    ).getDate();
    const cellCount = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: cellCount }, (_, index) => {
      const date = new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        index - startOffset + 1,
      );
      const dateIso = isoDate(date);
      return {
        date,
        dateIso,
        inCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
        isToday: dateIso === isoDate(today),
        events: events.filter((event) => isDateInEventRange(dateIso, event)),
      };
    });
  }, [visibleMonth, events, today]);

  const selectedEvents = selectedDate
    ? events.filter((event) => isDateInEventRange(selectedDate, event))
    : [];

  return (
    <section className="w-full px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop">
      <div className="mx-auto max-w-container-max">
        <div className="mb-space-xl flex flex-col gap-space-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1.5 font-label-sm text-label-sm font-bold text-on-secondary-container">
              <CalendarDays aria-hidden className="h-4 w-4" />
              Kalender sekolah
            </span>
            <h2 className="mt-space-sm font-headline-md text-headline-md font-bold text-primary">
              Kegiatan SMKN 24 Jakarta
            </h2>
            <p className="mt-2 max-w-2xl font-body-md text-on-surface-variant">
              Pilih tanggal bertanda untuk melihat kegiatan yang sudah berlangsung maupun yang akan datang.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="h-3 w-3 rounded-full border-2 border-primary" aria-hidden />
            Tanggal dengan kegiatan
          </div>
        </div>

        <div className="grid gap-space-lg lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.7fr)]">
          <div className="rounded-3xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm sm:p-space-lg">
            <div className="mb-space-md flex items-center justify-between gap-3">
              <h3 className="min-w-0 font-title-lg font-bold capitalize text-on-surface">
                {MONTH_FORMATTER.format(visibleMonth)}
              </h3>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                  aria-label="Bulan sebelumnya"
                  className="grid h-10 w-10 place-items-center rounded-full border border-outline-variant text-on-surface transition hover:bg-surface-container-low"
                >
                  <ChevronLeft aria-hidden className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
                  className="rounded-full border border-outline-variant px-4 py-2 font-label-sm text-label-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
                >
                  Hari ini
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                  aria-label="Bulan berikutnya"
                  className="grid h-10 w-10 place-items-center rounded-full border border-outline-variant text-on-surface transition hover:bg-surface-container-low"
                >
                  <ChevronRight aria-hidden className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-surface-container pb-2">
              {WEEKDAYS.map((day) => (
                <span key={day} className="py-2 text-center text-xs font-bold text-on-surface-variant">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map(({ date, dateIso, inCurrentMonth, isToday, events: dayEvents }) => {
                const hasEvent = dayEvents.length > 0;
                return (
                  <button
                    key={dateIso}
                    type="button"
                    onClick={() => hasEvent && setSelectedDate(dateIso)}
                    disabled={!hasEvent}
                    aria-label={`${DATE_FORMATTER.format(date)}${hasEvent ? `, ${dayEvents.length} kegiatan` : ""}`}
                    aria-haspopup={hasEvent ? "dialog" : undefined}
                    className={`group flex min-h-12 flex-col items-center justify-center gap-0.5 border-b border-surface-container/70 py-1.5 text-sm transition sm:min-h-[4.25rem] ${
                      inCurrentMonth ? "text-on-surface" : "text-on-surface-variant/40"
                    } ${hasEvent ? "cursor-pointer hover:bg-primary/5" : "cursor-default"} ${
                      isToday ? "font-bold" : ""
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full transition ${
                        hasEvent
                          ? "border-2 border-primary font-bold text-primary group-hover:bg-primary group-hover:text-surface"
                          : isToday
                            ? "bg-primary text-surface"
                            : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {hasEvent && (
                      <span className="max-w-full truncate px-0.5 text-[9px] leading-tight text-primary sm:text-[10px]">
                        {dayEvents.length === 1 ? dayEvents[0].judul : `${dayEvents.length} kegiatan`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <p role="status" className="mt-4 rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                Kalender belum dapat memuat data kegiatan saat ini.
              </p>
            )}
            {!error && events.length === 0 && (
              <p className="mt-4 text-center text-sm text-on-surface-variant">
                Belum ada kegiatan yang tercatat.
              </p>
            )}
          </div>

          <aside className="rounded-3xl bg-primary-container p-space-lg text-surface">
            <p className="font-label-sm font-bold uppercase tracking-wider text-secondary-fixed">
              Jadwal sekolah
            </p>
            <h3 className="mt-2 font-title-lg font-bold">Kalender Kegiatan Sekolah</h3>
            <p className="mt-2 font-body-sm leading-relaxed text-surface/80">
              Tanggal bertanda lingkaran memuat agenda sekolah. Pilih tanggal untuk membaca detail, waktu, dan lokasi kegiatan.
            </p>
            <div className="mt-space-lg flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4">
              <CalendarDays aria-hidden className="h-8 w-8 shrink-0 text-secondary-fixed" />
              <p className="text-sm leading-relaxed">
                Kalender menampilkan seluruh agenda, termasuk kegiatan terdahulu dan yang akan datang.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {selectedDate && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-primary/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedDate(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-event-title"
            className="w-full max-w-md overflow-hidden rounded-3xl bg-surface-container-lowest shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 bg-primary-container p-space-lg text-surface">
              <div>
                <p className="font-label-sm font-bold uppercase tracking-wider text-secondary-fixed">
                  {DATE_FORMATTER.format(parseIsoDate(selectedDate))}
                </p>
                <h3 id="calendar-event-title" className="mt-1 font-title-lg font-bold">
                  Kegiatan sekolah
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                aria-label="Tutup detail kegiatan"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto p-space-lg">
              {selectedEvents.map((event) => (
                <article key={event.id} className="rounded-2xl border border-surface-container bg-surface-container-low p-space-md">
                  <h4 className="font-title-md font-bold text-on-surface">{event.judul}</h4>
                  {event.deskripsi && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
                      {event.deskripsi}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-on-surface-variant">
                    {event.waktu && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 aria-hidden className="h-4 w-4" />
                        {event.waktu}
                      </span>
                    )}
                    {event.lokasi && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin aria-hidden className="h-4 w-4" />
                        {event.lokasi}
                      </span>
                    )}
                  </div>
                  {event.tglSelesai && event.tglSelesai !== event.tglMulai && (
                    <p className="mt-3 text-xs font-semibold text-primary">
                      Berlangsung {DATE_FORMATTER.format(parseIsoDate(event.tglMulai))} – {DATE_FORMATTER.format(parseIsoDate(event.tglSelesai))}
                    </p>
                  )}
                </article>
              ))}
            </div>

            <div className="border-t border-surface-container p-space-md text-right">
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-surface"
              >
                Tutup
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
