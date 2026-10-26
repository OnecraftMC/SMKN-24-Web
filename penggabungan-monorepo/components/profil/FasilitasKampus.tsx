"use client";
import { ArrowRight, Building2, Library, X } from "lucide-react";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import type { FasilitasView } from "@/lib/shared/mappers";

export default function FasilitasKampus({
  fasilitas,
  error,
  variant = "all",
}: {
  fasilitas: FasilitasView[];
  error: string | null;
  variant?: "all" | "featured";
}) {
  const [selected, setSelected] = useState<FasilitasView | null>(null);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  const detailModal = selected && createPortal(
    <div
      role="presentation"
      onClick={() => setSelected(null)}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={selected.title}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface-container-lowest shadow-xl micro-pop"
      >
        <button
          type="button"
          onClick={() => setSelected(null)}
          aria-label="Tutup"
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface"
        >
          <X aria-hidden="true" className="h-6 w-6" />
        </button>
        <div className="h-64 w-full bg-surface-container-high">
          {selected.image ? (
            <Image
              src={selected.image}
              alt={selected.title}
              width={1280}
              height={720}
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-primary" aria-hidden="true">
              <Building2 aria-hidden="true" className="h-[3.75rem] w-[3.75rem]" />
            </div>
          )}
        </div>
        <div className="space-y-space-md p-space-lg">
          <div className="space-y-space-xs">
            {selected.unggulan && (
              <span className="inline-flex rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-[11px] font-bold text-on-secondary-container">
                Unggulan
              </span>
            )}
            <h2 className="font-headline-md text-headline-md font-bold text-primary">
              {selected.title}
            </h2>
          </div>
          {selected.desc && (
            <p className="font-body-md text-on-surface-variant">{selected.desc}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );

  if (variant === "featured") {
    const unggulan = fasilitas.filter((item) => item.unggulan);

    return (
      <>
        <section className="w-full bg-surface-container-low py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
          <div className="max-w-container-max mx-auto space-y-space-lg">
            <div className="flex flex-wrap items-end justify-between gap-space-md">
              <div className="max-w-2xl space-y-2">
                <span className="font-label-md uppercase tracking-wider text-secondary font-bold">
                  Pilihan Sekolah
                </span>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  Fasilitas Unggulan
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Sarana pilihan yang mendukung kegiatan belajar dan pengembangan keterampilan.
                </p>
              </div>
              <Link
                href="/fasilitas"
                className="inline-flex min-h-11 items-center gap-2 font-label-md text-label-md font-bold text-primary hover:text-secondary"
              >
                Lihat keseluruhan fasilitas
                <ArrowRight aria-hidden="true" className="h-[18px] w-[18px]" />
              </Link>
            </div>

            {error && unggulan.length === 0 ? (
              <p
                className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md font-body-sm text-body-sm text-on-surface-variant"
                role="status"
              >
                Fasilitas unggulan belum dapat dimuat: {error}
              </p>
            ) : unggulan.length === 0 ? (
              <p
                className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md font-body-sm text-body-sm text-on-surface-variant"
                role="status"
              >
                Belum ada fasilitas yang ditandai sebagai unggulan.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2 xl:grid-cols-3">
                {unggulan.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className="micro-card micro-shine flex w-full min-w-0 items-center gap-space-md rounded-xl border border-surface-container bg-surface-container-lowest p-space-sm text-left transition hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container-high sm:h-24 sm:w-28">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={224}
                          height={192}
                          sizes="112px"
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-primary" aria-hidden="true">
                          <Building2 aria-hidden="true" className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <span className="inline-flex rounded-full bg-secondary-container px-2 py-0.5 font-label-sm text-[11px] font-bold text-on-secondary-container">
                        Unggulan
                      </span>
                      <h3 className="line-clamp-1 font-title-md font-bold text-primary">
                        {item.title}
                      </h3>
                      {item.desc && (
                        <p className="line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                          {item.desc}
                        </p>
                      )}
                    </div>
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
    <div id="fasilitas" className="w-full py-space-4xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Sarana &amp; Prasarana</span>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Fasilitas SMKN 24 Jakarta</h2>
          <p className="font-body-md text-on-surface-variant">
            Dirancang higienis, aman, dan berstandar internasional demi menunjang kenyamanan belajar, riset, dan eksplorasi bakat.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-md">
          {fasilitas.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="micro-card micro-shine block w-full rounded-2xl overflow-hidden border border-surface-container bg-surface-container-lowest shadow-sm group text-left transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="h-52 overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.title} width={640} height={420} sizes="(max-width: 768px) 100vw, 33vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                ) : (
                  <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-primary" aria-hidden="true">
                    <Building2 aria-hidden="true" className="h-9 w-9" />
                  </div>
                )}
              </div>
              <div className="p-space-md space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-title-md font-bold text-primary">{item.title}</h3>
                  <Library aria-hidden="true" className="micro-icon h-6 w-6 text-secondary" />
                </div>
                <p className="text-body-sm text-on-surface-variant">{item.desc}</p>
              </div>
            </button>
          ))}
          {fasilitas.length === 0 && (
            <p className="md:col-span-3 rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
              {error ? `Fasilitas belum dapat dimuat: ${error}` : "Belum ada fasilitas yang dipublikasikan."}
            </p>
          )}
        </div>
      </div>
      {detailModal}
    </div>
  );
}
