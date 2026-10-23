"use client";
import { Clock, ExternalLink, LogIn, Mail, MessagesSquare, Phone } from "lucide-react";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import MobileMenu from "./MobileMenu";
import DropdownNav from "./DropdownNav";
import BKChatModal from "@/components/bk/BKChatModal";

/** id dropdown mobile — dipakai tombol toggle untuk `aria-controls`. */
const MOBILE_MENU_ID = "navbar-mobile-menu";

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isBKOpen, setIsBKOpen] = useState(false);
  const [indonesiaTime, setIndonesiaTime] = useState("--:--:--");
  const [logoAnimationKey, setLogoAnimationKey] = useState(0);
  // Tombol Login mengarah ke `/login` SAME-ORIGIN pada aplikasi gabungan.
  // NEXT_PUBLIC_ADMIN_URL disimpan untuk kasus admin masih dipisah.
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || '/login';

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const updateTime = () => setIndonesiaTime(formatter.format(new Date()));
    updateTime();
    const interval = window.setInterval(updateTime, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const navLinks = [
    { id: "beranda", href: "/", label: "Beranda", ikon: "home" },
    {
      id: "profil",
      href: "/profil",
      label: "Profil",
      ikon: "domain",
      groups: [
        {
          title: "Tentang Sekolah",
          items: [
            {
              label: "Informasi Sekolah",
              description: "Profil & program SMKN 24 Jakarta",
              href: "/profil",
              ikon: "domain",
            },
            {
              label: "Kalender Kegiatan",
              description: "Agenda kegiatan siswa & sekolah",
              href: "/profil#kalender-kegiatan",
              ikon: "calendar_month",
            },
          ],
        },
        {
          title: "Direktori & Sarana",
          items: [
            {
              label: "Direktori Guru",
              description: "Pendidik & tenaga manajemen",
              href: "/profil#dewan-guru",
              ikon: "groups",
            },
            {
              label: "Fasilitas Unggulan",
              description: "Sorotan sarana prasarana kampus",
              href: "/profil#fasilitas",
              ikon: "apartment",
            },
          ],
        },
      ],
    },
    {
      id: "akademik",
      href: "/akademik",
      label: "Akademik",
      ikon: "calendar_month",
      groups: [
        {
          title: "Pembelajaran",
          items: [
            {
              label: "Jadwal Program Keahlian",
              description: "Jadwal pembelajaran tiap jurusan",
              href: "/akademik",
              ikon: "schedule",
            },
            {
              label: "Kalender Akademik",
              description: "Unduh kalender & dokumen tahunan",
              href: "/akademik#arsip-kalender",
              ikon: "download",
            },
          ],
        },
        {
          title: "Pengembangan Siswa",
          items: [
            {
              label: "Pengajuan Prestasi",
              description: "Ajukan capaian lomba & juara",
              href: "/akademik/pengajuan-prestasi",
              ikon: "emoji_events",
            },
            {
              label: "Pusat Arsip",
              description: "Dokumen & album kegiatan",
              href: "/akademik/arsip",
              ikon: "folder",
            },
          ],
        },
      ],
    },
    { id: "galeri", href: "/kabar", label: "Galeri", ikon: "photo_library" },
    { id: "jurusan", href: "/jurusan", label: "Jurusan", ikon: "school" },
    { id: "berita", href: "/berita", label: "Berita", ikon: "article" },
    { id: "fasilitas", href: "/fasilitas", label: "Fasilitas", ikon: "apartment" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(15,41,74,0.06)]">
      {/* Topbar */}
      <div className="bg-primary-container text-surface px-margin-mobile md:px-margin-tablet lg:px-margin-desktop py-space-xs">
        <div className="max-w-container-max mx-auto flex flex-wrap items-center justify-between gap-space-xs font-label-sm text-label-sm">
          <div className="flex items-center flex-wrap gap-space-md text-surface-container-high">
            <span className="flex items-center gap-1">
              <Phone aria-hidden="true" className="h-[15px] w-[15px]" />
              (021) 844-1976
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Mail aria-hidden="true" className="h-[15px] w-[15px]" />
              humassmkn24jakarta@gmail.com
            </span>
            <span className="hidden md:flex items-center gap-1">
              <Clock aria-hidden="true" className="h-[15px] w-[15px]" />
              Senin - Jumat: 07.00 - 15.00 WIB
            </span>
            <span className="flex items-center gap-1 tabular-nums" aria-label={`Waktu Indonesia Barat ${indonesiaTime}`}>
              <Clock aria-hidden="true" className="h-[15px] w-[15px]" />
              {indonesiaTime} WIB
            </span>
          </div>
          <div className="flex items-center gap-space-sm">
            <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold text-[11px] tracking-wide uppercase">
              Terakreditasi A
            </span>
            <span className="hidden sm:inline text-surface-container-high">BAN-S/M</span>
            <a
              href={adminUrl}
              className="hidden sm:inline-flex items-center gap-1 px-space-sm py-1.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold shadow-sm hover:bg-secondary-fixed-dim transition-all"
            >
              <span>Login</span>
              <LogIn aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="h-16 md:h-20 max-w-container-max mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-space-md">
        {/* Brand / Logo */}
        <Link
          href="/"
          onClick={() => setLogoAnimationKey((current) => current + 1)}
          className="flex items-center gap-2 md:gap-space-sm text-left group min-w-0 shrink"
        >
          <span
            key={logoAnimationKey}
            className={logoAnimationKey > 0 ? "navbar-logo-3d-click inline-flex shrink-0" : "inline-flex shrink-0"}
          >
            <Image
              src="/logo-smkn24.png"
              alt="Logo SMK Negeri 24 Jakarta"
              width={36}
              height={36}
              className="h-8 md:h-9 w-auto object-contain rounded-md shadow-sm shrink-0"
            />
          </span>
          <span className="flex flex-col min-w-0">
            <span className="font-headline-sm text-[15px] md:text-headline-sm text-primary tracking-tight font-bold leading-tight group-hover:text-secondary transition-colors whitespace-nowrap">
              SMKN 24 Jakarta
            </span>
            <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant font-normal leading-tight truncate whitespace-nowrap">
              Sekolah • Unggul &amp; Berkarakter
            </span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <DropdownNav
          className="hidden lg:flex"
          items={navLinks}
        />

        <div className="flex items-center gap-space-sm">
          <a
            className="hidden md:inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-primary text-surface font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all"
            href="https://spmb.jakarta.go.id"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>SPMB Online</span>
            <ExternalLink aria-hidden="true" className="h-[18px] w-[18px]" />
          </a>

          <button
            type="button"
            onClick={() => setIsBKOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold shadow-md hover:bg-secondary-fixed-dim transition-all"
          >
            <span>Bimbingan Konseling</span>
            <MessagesSquare aria-hidden="true" className="h-[18px] w-[18px]" />
          </button>

          <button
            aria-controls={MOBILE_MENU_ID}
            aria-expanded={isMobileOpen}
            aria-label={isMobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="lg:hidden p-2 rounded-lg bg-surface-container-low text-primary hover:bg-surface-container"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            type="button"
          >
            <span className="relative block h-6 w-6" aria-hidden="true">
              <span
                className={`absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none ${isMobileOpen ? "translate-y-0 rotate-45" : "-translate-y-[6px]"}`}
              />
              <span
                className={`absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-all duration-200 ease-out motion-reduce:transition-none ${isMobileOpen ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"}`}
              />
              <span
                className={`absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none ${isMobileOpen ? "translate-y-0 -rotate-45" : "translate-y-[6px]"}`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      <MobileMenu
        id={MOBILE_MENU_ID}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        navLinks={navLinks}
        onOpenBK={() => {
          setIsMobileOpen(false);
          setIsBKOpen(true);
        }}
      />

      {/* Layanan Bimbingan Konseling (counsellor AI) */}
      <BKChatModal open={isBKOpen} onClose={() => setIsBKOpen(false)} />
    </header>
  );
}
