"use client";

// BorderBeam — adaptasi komponen BorderBeam dari Magic UI
// (https://magicui.design/docs/components/border-beam) yang disesuaikan dengan
// token sekolah: warna default mengambil token navy/amber dan efek hormat
// `prefers-reduced-motion` (pilihan kematian gerak = tidak dirender sama sekali).

import { motion, useReducedMotion, type MotionStyle } from "motion/react";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  /** Panjang sisi cahaya yang berjalan (px). */
  size?: number;
  /** Detik sekali putaran keliling. */
  duration?: number;
  /** Penundaan mulai (detik); negatif berarti mulai dari tengah siklus. */
  delay?: number;
  /** Warna ujung cahaya. Tanpa argumen: token amber container. */
  colorFrom?: string;
  /** Warna ekor cahaya. Tanpa argumen: token navy container. */
  colorTo?: string;
  /** Arah berlawanan (dari bawah kembali ke atas). */
  reverse?: boolean;
  className?: string;
  style?: MotionStyle;
}

export function BorderBeam({
  className,
  size = 110,
  duration = 6,
  delay = 0,
  colorFrom = "var(--color-secondary-container)",
  colorTo = "var(--color-primary-container)",
  reverse = false,
  style,
}: BorderBeamProps) {
  const kurangiGerak = useReducedMotion();
  if (kurangiGerak) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] border-[3px] border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <motion.div
        aria-hidden="true"
        className={cn("pointer-events-none absolute aspect-square", className)}
        style={{
          width: size,
          offsetPath: "rect(0 auto auto 0 round 28px)",
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          ...style,
        }}
        animate={{ offsetDistance: reverse ? ["100%", "0%"] : ["0%", "100%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration, delay: -delay }}
      />
    </div>
  );
}
