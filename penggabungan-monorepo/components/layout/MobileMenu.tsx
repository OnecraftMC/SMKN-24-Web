"use client";
import { ChevronDown, ExternalLink, LogIn, MessagesSquare } from "lucide-react";

import { IkonLucide } from "@/lib/ikonLucide";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface NavLinkItem {
  label: string;
  href: string;
  ikon?: string;
}

interface NavLinkGroup {
  title?: string;
  items: NavLinkItem[];
}

interface NavLink {
  href: string;
  label: string;
  ikon?: string;
  /** Sub-kategori tab — dirender sebagai akordeon di menu mobile. */
  groups?: NavLinkGroup[];
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Escape menutup dropdown (paritas dengan drawer admin).
  function handleClose() {
    setExpandedId(null);
    onClose();
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // handleClose hanya membungkus onClose + reset akordeon; efek re-fit bila
  // onClose berubah.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose]);

  // Menu ditutup → akordeon kembali terlipat agar pembukaan berikutnya bersih
  // (lewat handleClose; tidak ada setState dalam effect).

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
                const isExpanded = expandedId === link.href;

                if (link.groups?.length) {
                  const subItems = link.groups.flatMap((group) => group.items);
                  return (
                    <div key={link.href}>
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedId(isExpanded ? null : link.href)}
                        className={`micro-row flex items-center gap-3 w-full text-left px-space-md py-3 rounded-2xl font-label-md transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        <IkonLucide nama={link.ikon} className="h-5 w-5 shrink-0" />
                        <span className="flex-1">{link.label}</span>
                        <ChevronDown
                          aria-hidden="true"
                          className={`h-4 w-4 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                              duration: shouldReduceMotion ? 0 : 0.2,
                              ease: "easeOut",
                            }}
                            className="overflow-hidden"
                          >
                            <div className="mx-space-md my-1 space-y-1 rounded-2xl bg-surface-container-low p-2">
                              <Link
                                href={link.href}
                                onClick={handleClose}
                                className="micro-row flex items-center gap-3 rounded-xl px-space-md py-2.5 text-primary font-label-md font-bold hover:bg-surface-container"
                              >
                                <IkonLucide nama={link.ikon} className="h-4 w-4 shrink-0" />
                                <span>Lihat Semua {link.label}</span>
                              </Link>
                              {subItems.map((sub) => (
                                <Link
                                  key={sub.label}
                                  href={sub.href}
                                  onClick={handleClose}
                                  className="micro-row flex items-center gap-3 rounded-xl px-space-md py-2.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                                >
                                  <IkonLucide nama={sub.ikon} className="h-4 w-4 shrink-0 text-primary" />
                                  <span className="text-sm">{sub.label}</span>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleClose}
                    className={`micro-row flex items-center gap-3 w-full text-left px-space-md py-3 rounded-2xl font-label-md transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <IkonLucide nama={link.ikon} className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{link.label}</span>
                  </Link>
                );
              })}

              <div className="mt-3 flex flex-col gap-2 border-t border-surface-container pt-3">
                <a
                  className="micro-cta flex items-center justify-center gap-2 w-full rounded-full bg-primary px-5 py-3 text-surface font-label-md font-bold transition-opacity hover:opacity-90"
                  href="https://spmb.jakarta.go.id"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Pendaftaran SPMB Online
                  <ExternalLink aria-hidden="true" className="h-[18px] w-[18px]" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBK();
                  }}
                  className="micro-cta flex items-center justify-center gap-2 w-full rounded-full bg-secondary-container px-5 py-3 text-on-secondary-container font-label-md font-bold shadow-sm transition-transform active:scale-[0.98]"
                >
                  <MessagesSquare aria-hidden="true" className="h-[18px] w-[18px]" />
                  Bimbingan Konseling
                </button>

                <a
                  href={adminUrl}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full rounded-full border border-outline text-on-surface-variant px-5 py-2.5 font-label-md font-semibold transition-colors hover:bg-surface-container-low"
                >
                  <LogIn aria-hidden="true" className="h-[18px] w-[18px]" />
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