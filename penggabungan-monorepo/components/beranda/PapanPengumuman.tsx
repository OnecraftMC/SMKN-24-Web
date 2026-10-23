"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Megaphone } from "lucide-react";
import type { PengumumanView } from "@/lib/shared/mappers";
import Badge from "@/components/ui/Badge";

export default function PapanPengumuman({
  pengumuman,
  error,
}: {
  pengumuman: PengumumanView[];
  error: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = pengumuman[activeIndex];
  const change = (step: number) => setActiveIndex((index) => (index + step + pengumuman.length) % pengumuman.length);

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
          {pengumuman.length > 1 && (
            <div className="flex items-center gap-3" aria-label="Navigasi pengumuman">
              <span className="text-sm tabular-nums text-primary-fixed" aria-live="polite">{activeIndex + 1} / {pengumuman.length}</span>
              <button type="button" onClick={() => change(-1)} aria-label="Pengumuman sebelumnya" className="grid size-11 place-items-center rounded-full border border-white/30 text-surface transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><ArrowLeft aria-hidden className="size-5" /></button>
              <button type="button" onClick={() => change(1)} aria-label="Pengumuman berikutnya" className="grid size-11 place-items-center rounded-full border border-white/30 text-surface transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><ArrowRight aria-hidden className="size-5" /></button>
            </div>
          )}
        </div>

        {current ? (
          <article className="mt-space-lg rounded-3xl border border-white/15 bg-white p-space-lg text-on-surface shadow-lg md:p-space-xl" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={current.variant === "secondary" ? "inkSecondary" : "inkSolid"} label={current.badge || current.kategori} />
              {current.penting && <span className="rounded-full bg-error-container px-3 py-1 text-xs font-bold text-on-error-container">Prioritas</span>}
              {current.status && <span className="text-sm font-bold text-secondary">{current.status}</span>}
            </div>
            <h3 className="mt-4 max-w-4xl font-headline-sm text-headline-sm font-bold text-primary">{current.judul}</h3>
            <p className="mt-3 max-w-4xl whitespace-pre-line text-body-md leading-relaxed text-on-surface-variant">{current.deskripsi}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/pengumuman/${current.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-label-md font-bold text-on-primary transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Info Selengkapnya <ArrowRight aria-hidden className="size-4" />
              </Link>
              {current.linkHref && current.linkLabel && (
                <a href={current.linkHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-outline-variant px-5 py-2.5 font-label-md font-bold text-primary hover:bg-surface-container-low">{current.linkLabel}</a>
              )}
            </div>
          </article>
        ) : (
          <p role="status" className="mt-space-lg rounded-2xl border border-white/20 bg-white/10 p-space-lg text-sm text-surface">
            {error ? `Pengumuman belum dapat dimuat: ${error}` : "Belum ada pengumuman aktif."}
          </p>
        )}
        {pengumuman.length > 1 && (
          <div className="mt-4 flex justify-center gap-2" aria-label="Pilih pengumuman">
            {pengumuman.map((item, index) => (
              <button key={item.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`Tampilkan pengumuman ${index + 1}: ${item.judul}`} aria-current={index === activeIndex ? "true" : undefined} className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-secondary-container" : "w-2.5 bg-white/40 hover:bg-white/70"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
