"use client";

import { useEffect, useRef, useState } from "react";
import { IkonLucide } from "@/lib/ikonLucide";

const highlights = [
  {
    icon: "groups",
    label: "Siswa Aktif",
    target: 1200,
    suffix: "+",
    desc: "5 Kompetensi Keahlian Terpadu",
  },
  {
    icon: "school",
    label: "Pendidik",
    target: 58,
    suffix: " Guru",
    desc: "100% Tersertifikasi Profesional",
  },
  {
    icon: "military_tech",
    label: "Akreditasi",
    target: null,
    suffix: "",
    desc: "Predikat 'A' Unggul Nasional",
  },
  {
    icon: "trophy",
    label: "Prestasi",
    target: 100,
    suffix: "+",
    desc: "Juara Tingkat Provinsi & Nasional",
  },
];

const COUNTER_DURATION = 700;

export default function QuickHighlights() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const startCounting = () => {
      const startedAt = performance.now();
      let frame = 0;
      const update = (now: number) => {
        const duration = COUNTER_DURATION * highlights.length;
        const nextElapsed = Math.min(now - startedAt, duration);
        setElapsed(nextElapsed);
        if (nextElapsed < duration) frame = requestAnimationFrame(update);
      };
      frame = requestAnimationFrame(update);
      return () => cancelAnimationFrame(frame);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => {
        setElapsed(COUNTER_DURATION * highlights.length);
      });
      return () => cancelAnimationFrame(frame);
    }

    let stopCounting: (() => void) | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        stopCounting = startCounting();
      },
      { threshold: 0.3 },
    );
    observer.observe(grid);

    return () => {
      observer.disconnect();
      stopCounting?.();
    };
  }, []);

  return (
    <div className="relative z-10 -mt-10 w-full px-margin-mobile pb-space-2xl md:-mt-12 md:px-margin-tablet lg:px-margin-desktop">
      <div className="max-w-container-max mx-auto">
        <div ref={gridRef} className="micro-stagger grid grid-cols-2 lg:grid-cols-4 gap-gutter-sm bg-surface-container-lowest rounded-2xl p-space-md md:p-space-lg shadow-xl shadow-primary/5 border border-surface-container">
          {highlights.map((item, index) => {
            const progress = elapsed === null
              ? 1
              : Math.max(0, Math.min(1, (elapsed - index * COUNTER_DURATION) / COUNTER_DURATION));
            const easedProgress = 1 - (1 - progress) ** 3;
            const value = item.target === null
              ? "A"
              : `${Math.round(item.target * easedProgress).toLocaleString("id-ID")}${item.suffix}`;

            return (
            <div
              key={item.label}
              className="micro-shine group relative p-space-md flex flex-col justify-center rounded-xl bg-surface-container-low transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="flex items-center gap-2 text-secondary font-bold mb-1">
                <IkonLucide nama={item.icon} className="h-[22px] w-[22px] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transform-none motion-reduce:transition-none" />
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  {item.label}
                </span>
              </div>
              <span aria-label={item.target === null ? "A" : `${item.target.toLocaleString("id-ID")}${item.suffix}`} aria-live="off" className={`font-display-hero-mobile md:font-display-hero text-display-hero-mobile md:text-display-hero text-primary font-extrabold leading-none tracking-tight ${item.target === null ? (progress > 0 ? "opacity-100 transition-opacity duration-300 motion-reduce:transition-none" : "opacity-0") : ""}`}>
                {value}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{item.desc}</p>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
