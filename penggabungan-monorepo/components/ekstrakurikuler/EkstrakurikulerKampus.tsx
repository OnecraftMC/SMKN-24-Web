"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  MapPin,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { EkstrakurikulerView } from "@/lib/shared/mappers";

type Variant = "all" | "featured";

function LogoMark({ item, compact = false }: { item: EkstrakurikulerView; compact?: boolean }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),rgba(240,244,250,0.9))] ring-1 ring-inset ring-primary/10 ${
        compact ? "h-16 w-16" : "h-24 w-24"
      }`}
    >
      {item.logo ? (
        <Image
          src={item.logo}
          alt={`Logo ${item.nama}`}
          width={compact ? 64 : 96}
          height={compact ? 64 : 96}
          unoptimized
          className={`h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transition-none ${
            compact ? "p-2" : "p-3"
          }`}
        />
      ) : (
        <Users aria-hidden className={`${compact ? "h-7 w-7" : "h-10 w-10"} text-primary`} />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80"
      />
    </span>
  );
}

function CategoryChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2.5 py-1 font-label-sm text-[11px] font-bold uppercase tracking-wide text-on-secondary-container">
      <Sparkles aria-hidden className="h-3 w-3" />
      {children}
    </span>
  );
}

export default function EkstrakurikulerKampus({
  ekstrakurikuler,
  error,
  variant = "all",
}: {
  ekstrakurikuler: EkstrakurikulerView[];
  error: string | null;
  variant?: Variant;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<EkstrakurikulerView | null>(null);
  const [filter, setFilter] = useState("Semua");
  const closeRef = useRef<HTMLButtonElement>(null);

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(ekstrakurikuler.map((item) => item.kategori).filter(Boolean)))],
    [ekstrakurikuler],
  );

  const visible = useMemo(
    () => (filter === "Semua" ? ekstrakurikuler : ekstrakurikuler.filter((item) => item.kategori === filter)),
    [ekstrakurikuler, filter],
  );

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  const detailModal = selected && typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence>
          <motion.div
            key="eskul-modal"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-primary/60 p-4 backdrop-blur-[2px]"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="eskul-modal-title"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.26, ease: [0.2, 0, 0, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/40 bg-surface-container-lowest shadow-2xl"
            >
              <button
                ref={closeRef}
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Tutup info ekstrakurikuler"
                className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high/90 text-on-surface shadow-sm transition hover:bg-primary hover:text-surface"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>

              <div className="relative overflow-hidden bg-primary px-space-lg pb-space-lg pt-space-xl text-on-primary">
                <span aria-hidden className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-secondary-container/20 blur-2xl" />
                <span aria-hidden className="absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex flex-col items-center gap-space-md text-center sm:flex-row sm:text-left">
                  <LogoMark item={selected} />
                  <div className="min-w-0 space-y-2">
                    {selected.kategori && <CategoryChip>{selected.kategori}</CategoryChip>}
                    <h2 id="eskul-modal-title" className="font-headline-md text-headline-md font-bold text-surface">
                      {selected.nama}
                    </h2>
                    {selected.unggulan && (
                      <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-surface">
                        <Sparkles aria-hidden className="h-3.5 w-3.5" /> Ekstrakurikuler unggulan
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-space-lg p-space-lg">
                {selected.deskripsi && (
                  <p className="font-body-md leading-relaxed text-on-surface-variant">{selected.deskripsi}</p>
                )}

                <dl className="grid gap-space-sm sm:grid-cols-2">
                  {[
                    { icon: UserRound, label: "Pembina", value: selected.pembina },
                    { icon: CalendarClock, label: "Jadwal", value: selected.jadwal },
                    { icon: MapPin, label: "Lokasi", value: selected.lokasi },
                    { icon: Users, label: "Kategori", value: selected.kategori },
                  ]
                    .filter((row) => row.value)
                    .map((row) => {
                      const Icon = row.icon;
                      return (
                        <div
                          key={row.label}
                          className="micro-card flex items-start gap-3 rounded-2xl border border-surface-container bg-surface-container-low/60 p-space-sm"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <Icon aria-hidden className="h-4 w-4" />
                          </span>
                          <div>
                            <dt className="text-[11px] font-bold uppercase tracking-wider text-secondary">{row.label}</dt>
                            <dd className="text-sm font-semibold text-on-surface">{row.value}</dd>
                          </div>
                        </div>
                      );
                    })}
                </dl>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container pt-space-md">
                  <p className="text-sm text-on-surface-variant">
                    Tertarik bergabung? Hubungi pembina atau bagian kesiswaan di sekolah.
                  </p>
                  <Link
                    href="/akademik#bimbingan-konseling"
                    className="micro-cta inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-surface shadow-md"
                  >
                    Tanya kesiswaan
                    <ArrowRight aria-hidden className="micro-arrow h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )
    : null;

  if (variant === "featured") {
    const unggulan = ekstrakurikuler.filter((item) => item.unggulan);

    return (
      <>
        <section className="w-full bg-surface-container-low py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
          <div className="max-w-container-max mx-auto space-y-space-lg">
            <div className="flex flex-wrap items-end justify-between gap-space-md">
              <div className="max-w-2xl space-y-2">
                <span className="font-label-md uppercase tracking-wider text-secondary font-bold">
                  Kesiswaan
                </span>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  Ekstrakurikuler Unggulan
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Wadah pengembangan bakat, karakter, dan kebersamaan siswa di luar jam pelajaran.
                </p>
              </div>
              <Link
                href="/ekstrakurikuler"
                className="micro-row inline-flex min-h-11 items-center gap-2 font-label-md text-label-md font-bold text-primary hover:text-secondary"
              >
                Lihat semua ekstrakurikuler
                <ArrowRight aria-hidden className="micro-arrow h-[18px] w-[18px]" />
              </Link>
            </div>

            {error && unggulan.length === 0 ? (
              <p
                className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md font-body-sm text-body-sm text-on-surface-variant"
                role="status"
              >
                Ekstrakurikuler unggulan belum dapat dimuat: {error}
              </p>
            ) : unggulan.length === 0 ? (
              <p
                className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md font-body-sm text-body-sm text-on-surface-variant"
                role="status"
              >
                Belum ada ekstrakurikuler yang ditandai unggulan.
              </p>
            ) : (
              <div className="micro-stagger grid grid-cols-1 gap-space-sm md:grid-cols-2 xl:grid-cols-3">
                {unggulan.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="micro-card micro-shine group flex w-full min-w-0 items-center gap-space-md rounded-2xl border border-surface-container bg-surface-container-lowest p-space-sm text-left shadow-sm"
                  >
                    <LogoMark item={item} compact />
                    <span className="min-w-0 space-y-1.5">
                      {item.kategori && <CategoryChip>{item.kategori}</CategoryChip>}
                      <span className="block truncate font-title-md font-bold text-primary">{item.nama}</span>
                      <span className="line-clamp-2 block font-body-sm text-body-sm text-on-surface-variant">
                        {item.deskripsi}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-secondary">
                        Lihat info
                        <ArrowRight aria-hidden className="micro-arrow h-3.5 w-3.5" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
        {detailModal}
      </>
    );
  }

  return (
    <div id="ekstrakurikuler" className="w-full py-space-3xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="flex flex-wrap items-end justify-between gap-space-md">
          <div className="max-w-2xl space-y-2">
            <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Kesiswaan</span>
            <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
              Ekstrakurikuler SMKN 24 Jakarta
            </h2>
            <p className="font-body-md text-on-surface-variant">
              Pilih wadah yang paling cocok untuk mengasah minat, bakat, dan karakter bersama teman-teman.
            </p>
          </div>
          <span className="micro-pop inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface-container-lowest px-3 py-1.5 text-sm font-bold text-primary shadow-sm">
            <Sparkles aria-hidden className="h-4 w-4 text-secondary" />
            {ekstrakurikuler.length} ekstrakurikuler aktif
          </span>
        </div>

        {categories.length > 2 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori ekstrakurikuler">
            {categories.map((category) => {
              const active = filter === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(category)}
                  className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none ${
                    active
                      ? "text-surface"
                      : "border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="eskul-filter-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-primary shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  {category}
                </button>
              );
            })}
          </div>
        )}

        <motion.div layout className="grid grid-cols-1 gap-gutter-md md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((item, index) => (
              <motion.button
                key={item.id}
                layout
                type="button"
                onClick={() => setSelected(item)}
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  delay: shouldReduceMotion ? 0 : Math.min(index * 0.035, 0.24),
                  ease: [0.2, 0, 0, 1],
                }}
                whileHover={shouldReduceMotion ? undefined : { y: -5 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                className="micro-shine group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-surface-container bg-surface-container-lowest p-space-md text-left shadow-sm"
              >
                <span className="flex items-start justify-between gap-3">
                  <LogoMark item={item} />
                  <span className="flex flex-col items-end gap-1.5">
                    {item.kategori && <CategoryChip>{item.kategori}</CategoryChip>}
                    {item.unggulan && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-secondary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary">
                        <Sparkles aria-hidden className="h-3 w-3" /> Unggulan
                      </span>
                    )}
                  </span>
                </span>

                <span className="mt-space-md block font-title-md text-lg font-bold text-primary">{item.nama}</span>
                <span className="mt-1 line-clamp-3 block flex-1 text-sm leading-relaxed text-on-surface-variant">
                  {item.deskripsi || "Informasi kegiatan akan segera dilengkapi."}
                </span>

                <span className="mt-space-md flex flex-wrap items-center gap-x-space-sm gap-y-1 border-t border-surface-container pt-space-sm text-xs text-on-surface-variant">
                  {item.jadwal && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock aria-hidden className="micro-icon h-3.5 w-3.5 text-secondary" />
                      <span className="line-clamp-1">{item.jadwal}</span>
                    </span>
                  )}
                  {item.pembina && (
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound aria-hidden className="micro-icon h-3.5 w-3.5 text-secondary" />
                      <span className="line-clamp-1">{item.pembina}</span>
                    </span>
                  )}
                </span>

                <span className="mt-space-sm inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  Lihat info lengkap
                  <ArrowRight aria-hidden className="micro-arrow h-4 w-4" />
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {visible.length === 0 && (
          <p
            className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg text-center text-body-sm text-on-surface-variant"
            role="status"
          >
            {error
              ? `Ekstrakurikuler belum dapat dimuat: ${error}`
              : filter === "Semua"
                ? "Belum ada ekstrakurikuler yang dipublikasikan."
                : `Belum ada ekstrakurikuler untuk kategori ${filter}.`}
          </p>
        )}
      </div>
      {detailModal}
    </div>
  );
}
