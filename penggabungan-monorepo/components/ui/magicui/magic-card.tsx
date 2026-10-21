"use client";

// MagicCard — adaptasi komponen MagicCard dari Magic UI
// (https://magicui.design/docs/components/magic-card). Lapisan sorot halus
// mengikuti kursor di atas kartu. Geraknya mengikuti pointer (pemetaan posisi,
// bukan animasi mandiri) sehingga tetap sopan bagi `prefers-reduced-motion`.
// Jabatan di repo ini: kartu saran pertanyaan chatbot, keduanya mode.

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { useCallback, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MagicCardProps {
  children?: ReactNode;
  className?: string;
  /** Jari-jari sorot di sekitar kursor (px). */
  gradientSize?: number;
  /** Warna puncak sorot. Tulis dengan alpha rendah agar teks tetap terbaca. */
  gradientColor?: string;
  style?: CSSProperties;
}

export function MagicCard({
  children,
  className,
  gradientSize = 180,
  gradientColor = "rgba(254, 166, 25, 0.18)",
  style,
}: MagicCardProps) {
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const lacak = useCallback(
    (acara: React.MouseEvent<HTMLDivElement>) => {
      // `clientX/Y` itu koordinat layar; kotak sorot perlu koordinat lokal.
      const kotak = acara.currentTarget.getBoundingClientRect();
      mouseX.set(acara.clientX - kotak.left);
      mouseY.set(acara.clientY - kotak.top);
    },
    [mouseX, mouseY],
  );
  const lepas = useCallback(
    () => {
      mouseX.set(-gradientSize);
      mouseY.set(-gradientSize);
    },
    [gradientSize, mouseX, mouseY],
  );

  const sorot = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`;

  return (
    <div
      onMouseMove={lacak}
      onMouseLeave={lepas}
      className={cn("group/magic relative", className)}
      style={style}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/magic:opacity-100"
        style={{ background: sorot }}
      />
      {children}
    </div>
  );
}
