"use client";

/**
 * Navigasi desktop dengan dropdown sub-kategori per tab.
 * Diadaptasi dari komponen "dropdown-navigation" (hover + pill morph) ke
 * bahasa visual M3 situs ini: token surface/outline, pill aktif eksisting
 * (layoutId active-navbar-pill), dan Link Next.js.
 *
 * Aksesibilitas: trigger tombol dengan aria-expanded, Escape menutup lalu
 * mengembalikan fokus, fokus keluar dari tab menutup panel, klik di luar
 * menutup, dan menu menutup otomatis saat rute berubah.
 */

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

import { IkonLucide } from "@/lib/ikonLucide";
import clsx from "clsx";

export interface NavSubItem {
  label: string;
  description: string;
  href: string;
  /** Nama ikon Material Symbols — dipetakan saat render via IkonLucide. */
  ikon?: string;
}

export interface NavGroup {
  title?: string;
  items: NavSubItem[];
}

export interface NavEntry {
  id: string;
  href: string;
  label: string;
  ikon?: string;
  /** Ada sub-kategori → trigger memakai tombol dropdown, bukan Link langsung. */
  groups?: NavGroup[];
}

interface DropdownNavProps {
  items: NavEntry[];
  className?: string;
}

/** Jeda sebelum panel tertutup saat kursor meninggalkan tab (hover forgiveness). */
const TUTUP_DELAY_MS = 140;

export default function DropdownNav({ items, className }: DropdownNavProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const navRef = useRef<HTMLElement | null>(null);
  const baseId = useId();

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpenId(null), TUTUP_DELAY_MS);
  };

  useEffect(() => () => clearCloseTimer(), []);

  // Klik di luar navigasi menutup menu (kasus open via klik/keyboard).
  useEffect(() => {
    if (!openId) return;
    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenId(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openId]);

  const isTabActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      ref={navRef}
      aria-label="Navigasi utama"
      className={clsx("relative flex items-center gap-1 p-1 rounded-full", className)}
    >
      <ul className="flex items-center gap-1">
        {items.map((item, index) => {
          const hasPanel = !!item.groups?.length;
          const active = isTabActive(item.href);
          const open = openId === item.id;
          const hovered = hoverId === item.id;
          const panelId = `${baseId}-panel-${item.id}`;
          const triggerId = `${baseId}-trigger-${item.id}`;
          // Tab di sepertiga kanan membuka panel ke kiri agar tidak overflow.
          const alignRight = index >= items.length - 2;

          const pill = (hovered || open || active) && (
            <motion.span
              layoutId="active-navbar-pill"
              className={clsx(
                "absolute inset-0 rounded-full -z-10",
                active ? "bg-surface-container shadow-sm" : "bg-primary/10",
              )}
              transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.8 }}
            />
          );

          const pillClasses =
            "relative inline-flex items-center justify-center gap-1 px-4 py-2 rounded-full font-label-md text-label-md font-bold select-none cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2";

          return (
            <li
              key={item.id}
              className="relative"
              onPointerEnter={() => {
                clearCloseTimer();
                setHoverId(item.id);
                if (hasPanel) setOpenId(item.id);
              }}
              onPointerLeave={() => {
                setHoverId(null);
                if (openId === item.id) scheduleClose();
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setOpenId(null);
                  setHoverId(null);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && open) {
                  setOpenId(null);
                  triggerRefs.current.get(item.id)?.focus();
                }
              }}
            >
              {hasPanel ? (
                <button
                  type="button"
                  id={triggerId}
                  ref={(node) => {
                    triggerRefs.current.set(item.id, node);
                  }}
                  aria-expanded={open}
                  aria-haspopup="true"
                  aria-controls={panelId}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    pillClasses,
                    active || open ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
                  )}
                  onClick={() => setOpenId(open ? null : item.id)}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={clsx(
                      "h-4 w-4 transition-transform duration-300 motion-reduce:transition-none",
                      open || hovered ? "rotate-180" : "",
                    )}
                  />
                  {pill}
                </button>
              ) : (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    pillClasses,
                    active ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  <span>{item.label}</span>
                  {pill}
                </Link>
              )}

              <AnimatePresence>
                {open && hasPanel && (
                  <div
                    className={clsx(
                      "absolute top-full z-30 pt-3",
                      alignRight ? "right-0" : "left-0",
                    )}
                  >
                    <motion.div
                      key={`panel-${item.id}`}
                      id={panelId}
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.22,
                        ease: [0.2, 0, 0, 1],
                      }}
                      className="w-max max-w-[min(90vw,44rem)] rounded-3xl border border-outline/40 bg-surface-container-lowest/95 backdrop-blur-xl shadow-xl p-space-lg"
                    >
                      <div
                        className={clsx(
                          "grid gap-x-8 gap-y-space-md",
                          item.groups!.length > 1 ? "grid-cols-2" : "grid-cols-1",
                        )}
                      >
                        {item.groups!.map((group) => (
                          <div key={group.title ?? "utama"} className="min-w-[16.5rem]">
                            {group.title && (
                              <h3 className="px-2.5 font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary">
                                {group.title}
                              </h3>
                            )}
                            <ul className={clsx("space-y-1", group.title && "mt-2")}>
                              {group.items.map((sub) => (
                                <li key={sub.label}>
                                  <Link
                                    href={sub.href}
                                    onClick={() => setOpenId(null)}
                                    className="group/sub -mx-2.5 flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
                                  >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-primary transition-colors duration-300 motion-reduce:transition-none group-hover/sub:bg-primary group-hover/sub:text-surface">
                                      <IkonLucide nama={sub.ikon} className="h-5 w-5" />
                                    </span>
                                    <span className="min-w-0 leading-5">
                                      <span className="block whitespace-nowrap text-sm font-bold text-on-surface">
                                        {sub.label}
                                      </span>
                                      <span className="block text-xs text-on-surface-variant">
                                        {sub.description}
                                      </span>
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
