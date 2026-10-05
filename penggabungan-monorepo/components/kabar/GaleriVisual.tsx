"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { GaleriView } from "@/lib/shared/mappers";

gsap.registerPlugin(ScrollTrigger);

export default function GaleriVisual({
  galeri,
  error,
}: {
  galeri: GaleriView[];
  error: string | null;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track || galeri.length < 2) return;

    const media = gsap.matchMedia();
    media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const scrollDistance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      if (scrollDistance() === 0) return;

      gsap.to(track, {
        x: () => -scrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top+=120",
          end: () => `+=${scrollDistance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => media.revert();
  }, [galeri.length]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="galeri-momen-emas"
      className="w-full overflow-hidden bg-surface-container-low px-margin-mobile py-space-3xl md:px-margin-tablet lg:px-margin-desktop"
    >
      <div className="max-w-container-max mx-auto space-y-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
          <div>
            <span className="font-label-md uppercase tracking-wider text-secondary font-bold">Galeri Foto &amp; Lensa Kampus</span>
            <h2 id="galeri-momen-emas" className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Dokumentasi Momen Emas Siswa</h2>
          </div>
        </div>
        {galeri.length > 0 ? (
          <div
            ref={viewportRef}
            className="overflow-x-auto overscroll-x-contain pb-3 md:overflow-visible md:pb-0"
            aria-label="Galeri momen emas siswa, geser untuk melihat foto lainnya"
          >
            <div ref={trackRef} className="flex w-max gap-4">
              {galeri.map((item) => (
                <article
                  key={item.id}
                  className="group relative aspect-[4/5] w-[min(70vw,18rem)] shrink-0 overflow-hidden rounded-3xl border border-surface-container shadow-md md:w-[min(26vw,18rem)]"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={480}
                      height={600}
                      sizes="(max-width: 767px) 70vw, 26vw"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-surface-container-high text-primary" aria-hidden="true">
                      <span className="material-symbols-outlined text-4xl">photo_library</span>
                    </div>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-primary/80 px-3 py-2 text-sm font-semibold text-surface">
                    {item.title}
                  </span>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-md text-body-sm text-on-surface-variant" role="status">
            {error ? `Galeri belum dapat dimuat: ${error}` : "Belum ada dokumentasi."}
          </p>
        )}
      </div>
    </section>
  );
}
