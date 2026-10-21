"use client";

import { type ReactNode } from "react";

type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "attention"
  | "errorSolid"
  | "infoSoft"
  | "neutral"
  | "inkSolid"
  | "inkSecondary"
  /** Warna dibawa lewat `className` (mis. dari peta GAYA_*). */
  | "adat";

/**
 * Nada gerak badge. Inilah yang mengikat animasi ke makna, bukan ke bentuk:
 *
 *   - `static`     — hanya mendesak halus saat kartu induk disorot
 *                    (`.group:hover` / `.group:focus-within`), atau saat badge
 *                    itu sendiri disorot bila ia kendali interaktif.
 *   - `live`       — titik berdenyut dengan halo menyebar; berloop karena
 *                    menandai layanan yang sedang berjalan.
 *   - `attention`  — satu denyut lalu diam, untuk keadaan yang menunggu
 *                    tindakan manusia sekali.
 */
type BadgeTone = "static" | "live" | "attention";

interface BadgeProps {
  label: ReactNode;
  variant?: BadgeVariant;
  tone?: BadgeTone;
  /** Titik kecil di depan teks — untuk penanda status ("hidup"). */
  dot?: boolean;
  /** Entrance fade + scale saat pertama dirender. */
  animateOnMount?: boolean;
  /** Diperlukan supaya pembaca layar membaca makna badge, bukan titik kosong. */
  "aria-label"?: string;
  className?: string;
}

export default function Badge({
  label,
  variant = "primary",
  tone = "static",
  dot = false,
  animateOnMount = false,
  "aria-label": ariaLabel,
  className = "",
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    primary: "bg-primary-fixed text-on-primary-fixed",
    secondary: "bg-secondary-fixed text-on-secondary-fixed",
    success: "bg-secondary-container text-on-secondary-container",
    warning: "bg-secondary-container text-on-secondary-container",
    attention: "bg-error-container text-on-error-container",
    errorSolid: "bg-error text-on-error",
    infoSoft: "bg-primary-container text-on-primary-container",
    neutral: "bg-surface-container-high text-on-surface-variant",
    inkSolid: "bg-primary text-surface",
    inkSecondary: "bg-secondary text-surface",
    adat: "",
  };

  const gerak =
    tone === "attention"
      ? "badge-attention"
      : tone === "static"
        ? "badge-press"
        : "";

  return (
    <span
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold ${
        variants[variant]
      } ${gerak} ${
        animateOnMount
          ? "badge-enter"
          : ""
      } ${className}`}
    >
      {dot && tone === "live" && (
        <span aria-hidden="true" className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="badge-live-halo absolute inset-0 rounded-full bg-current" />
          <span className="badge-live-core relative h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}
