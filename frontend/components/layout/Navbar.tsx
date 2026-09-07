"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Beranda", icon: "home" },
    { href: "/profil", label: "Profil", icon: "domain" },
    { href: "/akademik", label: "Akademik", icon: "calendar_month" },
    { href: "/kabar", label: "Galeri", icon: "newspaper" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(15,41,74,0.06)]">
      {/* Topbar */}
      <div className="bg-primary-container text-surface px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-xs">
        <div className="max-w-container-max mx-auto flex flex-wrap items-center justify-between gap-space-xs font-label-sm text-label-sm">
          <div className="flex items-center flex-wrap gap-space-md text-surface-container-high">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">call</span>
              (021) 844-1976
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">mail</span>
              humassmkn24jakarta@gmail.com
            </span>
            <span className="hidden md:flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              Senin - Jumat: 07.00 - 15.00 WIB
            </span>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold text-[11px] tracking-wide uppercase">
              Terakreditasi A
            </span>
            <span className="hidden sm:inline text-surface-container-high">BAN-S/M</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="h-20 max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-space-sm text-left group">
          <Image
            src="/logo-smkn24.png"
            alt="Logo SMK Negeri 24 Jakarta"
            width={36}
            height={36}
            className="h-9 w-auto object-contain rounded-md shadow-sm"
          />
          <span className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold leading-tight group-hover:text-secondary transition-colors">
              SMKN 24 Jakarta
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-normal leading-none hidden sm:inline">
              Nusantara • Unggul &amp; Berkarakter
            </span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-tab-btn px-4 py-2 rounded-lg font-label-md text-label-md transition-all font-bold ${
                isActive(link.href)
                  ? "bg-surface-container text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/profil#fasilitas"
            className={`nav-tab-btn px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
              pathname === "/profil"
                ? "bg-surface-container text-primary shadow-sm font-bold"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
            }`}
          >
            Fasilitas
          </Link>
        </nav>

        <div className="flex items-center gap-space-sm">
          <a
            className="hidden md:inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-primary text-surface font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all"
            href="https://spmb.jakarta.go.id"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>SPMB Online</span>
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </a>

          <Link
            href="/#lokasi-sekolah"
            className="hidden sm:inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold shadow-md hover:bg-secondary-fixed-dim transition-all"
          >
            <span>Lokasi Sekolah</span>
            <span className="material-symbols-outlined text-[18px]">location_on</span>
          </Link>

          <button
            aria-expanded={isMobileOpen}
            aria-label="Toggle Menu"
            className="lg:hidden p-2 rounded-lg bg-surface-container-low text-primary hover:bg-surface-container"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isMobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <MobileMenu isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} navLinks={navLinks} />
    </header>
  );
}
