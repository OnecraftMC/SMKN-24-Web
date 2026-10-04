"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface NavLink {
  href: string;
  label: string;
  icon: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
  /** id pembungkus menu — dipakai tombol toggle di Navbar untuk `aria-controls`. */
  id?: string;
  /** Membuka layanan Bimbingan Konseling (counsellor AI). */
  onOpenBK: () => void;
}

export default function MobileMenu({
  isOpen,
  onClose,
  navLinks,
  id,
  onOpenBK,
}: MobileMenuProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  // Login menuju `/login` same-origin pada aplikasi gabungan.
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || '/login';

  // Escape menutup dropdown (paritas dengan drawer admin).
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Pembungkus tetap ter-mount dan diberi `inert` saat tertutup, sehingga isi
  // menu tidak pernah bisa di-Tab — termasuk selama animasi keluar.
  return (
    <div id={id} inert={!isOpen || undefined}>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="navbar-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: "easeOut" }}
            className="lg:hidden overflow-hidden border-t border-surface-container bg-surface-container-lowest shadow-xl"
          >
            <div className="space-y-1 px-margin-mobile py-space-sm">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={`w-full text-left px-space-md py-2.5 rounded-lg font-label-md hover:bg-surface-container-low flex items-center justify-between ${
                      isActive ? "font-bold text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    <span>{link.label}</span>
                    <span className="material-symbols-outlined text-[18px]">{link.icon}</span>
                  </Link>
                );
              })}
              <a
                className="block w-full text-center mt-2 py-2.5 rounded-lg bg-primary text-surface font-label-md font-bold"
                href="https://spmb.jakarta.go.id"
                rel="noopener noreferrer"
                target="_blank"
              >
                SPMB Online
              </a>
              <a
                href={adminUrl}
                onClick={onClose}
                className="block w-full text-center mt-2 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md font-bold"
              >
                Login Admin
              </a>
              <Link
                href="/#lokasi-sekolah"
                onClick={onClose}
                className="block w-full text-center mt-2 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md font-bold"
              >
                Lihat Lokasi Sekolah
              </Link>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBK();
                }}
                className="block w-full text-center mt-2 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md font-bold"
              >
                Bimbingan Konseling
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}