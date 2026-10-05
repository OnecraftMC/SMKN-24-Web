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
            <div className="max-h-[min(32rem,calc(100dvh-6rem))] space-y-1 overflow-y-auto overscroll-contain px-margin-mobile py-space-sm">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 w-full text-left px-space-md py-3 rounded-2xl font-label-md transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] shrink-0">{link.icon}</span>
                    <span className="flex-1">{link.label}</span>
                  </Link>
                );
              })}

              <div className="mt-3 flex flex-col gap-2 border-t border-surface-container pt-3">
                <a
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-primary px-5 py-3 text-surface font-label-md font-bold transition-opacity hover:opacity-90"
                  href="https://spmb.jakarta.go.id"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Pendaftaran SPMB Online
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBK();
                  }}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-secondary-container px-5 py-3 text-on-secondary-container font-label-md font-bold shadow-sm transition-transform active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  Bimbingan Konseling
                </button>

                <a
                  href={adminUrl}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full rounded-full border border-outline text-on-surface-variant px-5 py-2.5 font-label-md font-semibold transition-colors hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Login Admin
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}