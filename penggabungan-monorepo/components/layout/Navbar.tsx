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
  const [language, setLanguage] = useState<"id" | "en">("id");
  // Tombol Login mengarah ke `/login` SAME-ORIGIN pada aplikasi gabungan.
  // NEXT_PUBLIC_ADMIN_URL disimpan untuk kasus admin masih dipisah.
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || '/login';

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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

  const inEnglish = language === "en";
  const navLinks = [
    { id: "beranda", href: "/", label: inEnglish ? "Home" : "Beranda", ikon: "home" },
    {
      id: "profil",
      href: "/profil",
      label: inEnglish ? "Profile" : "Profil",
      ikon: "domain",
      groups: [
        {
          title: inEnglish ? "School Information" : "Informasi Sekolah",
          items: [
            {
              label: inEnglish ? "About the School" : "Tentang Sekolah",
              description: inEnglish ? "School profile, programs, and learning facilities" : "Profil, program, dan fasilitas belajar sekolah",
              href: "/profil#tentang-sekolah",
              ikon: "domain",
            },
            {
              label: inEnglish ? "School Calendar" : "Kalender Kegiatan",
              description: inEnglish ? "Student and school events" : "Agenda kegiatan siswa & sekolah",
              href: "/profil#kalender-kegiatan",
              ikon: "calendar_month",
            },
          ],
        },
        {
          title: inEnglish ? "Directory & Facilities" : "Direktori & Sarana",
          items: [
            {
              label: inEnglish ? "Staff Directory" : "Direktori Guru",
              description: inEnglish ? "Educators and school staff" : "Pendidik & tenaga manajemen",
              href: "/profil#dewan-guru",
              ikon: "groups",
            },
            {
              label: inEnglish ? "School Facilities" : "Fasilitas Sekolah",
              description: inEnglish ? "Campus facilities and learning spaces" : "Sorotan sarana prasarana kampus",
              href: "/profil#fasilitas",
              ikon: "apartment",
            },
          ],
        },
      ],
    },
    {
      id: "informasi", href: "/berita", label: inEnglish ? "Information" : "Informasi", ikon: "article",
      groups: [{ title: inEnglish ? "School Information" : "Informasi Sekolah", items: [
        { label: inEnglish ? "News" : "Berita", description: inEnglish ? "Latest news and school achievements" : "Kabar terbaru dan prestasi sekolah", href: "/berita", ikon: "article" },
        { label: inEnglish ? "Graduation Information" : "Pengumuman Kelulusan", description: inEnglish ? "Graduation information and alumni records" : "Informasi kelulusan dan data alumni", href: "/pengumuman-kelulusan", ikon: "school" },
      ] }],
    },
    {
      id: "program", href: "/jurusan", label: inEnglish ? "Programs" : "Program", ikon: "school",
      groups: [{ title: inEnglish ? "Student Programs" : "Program Siswa", items: [
        { label: inEnglish ? "Expertise Programs" : "Profil Jurusan / Program Keahlian", description: inEnglish ? "Explore the school's expertise programs" : "Kenali kompetensi keahlian di sekolah", href: "/jurusan", ikon: "school" },
        { label: inEnglish ? "Extracurriculars" : "Ekstrakurikuler (Eskul)", description: inEnglish ? "Clubs and student activities" : "Klub dan kegiatan pengembangan siswa", href: "/ekstrakurikuler", ikon: "sports_soccer" },
        { label: inEnglish ? "CCP Education" : "Program Pendidikan CCP", description: "Character, Content & Process", href: "/program/ccp", ikon: "psychology" },
        { label: "Future Skills Academic", description: inEnglish ? "Industry mentors and future-ready learning" : "Mentor industri dan pengalaman belajar", href: "/program/future-skills", ikon: "lightbulb" },
      ] }],
    },
    {
      id: "akademik",
      href: "/akademik",
      label: inEnglish ? "Academics" : "Akademik",
      ikon: "calendar_month",
      groups: [
        {
          title: inEnglish ? "Learning" : "Pembelajaran",
          items: [
            {
              label: inEnglish ? "Program Schedule" : "Jadwal Program Keahlian",
              description: "Jadwal pembelajaran tiap jurusan",
              href: "/akademik",
              ikon: "schedule",
            },
            {
              label: inEnglish ? "Academic Calendar" : "Kalender Akademik",
              description: "Unduh kalender & dokumen tahunan",
              href: "/akademik#arsip-kalender",
              ikon: "download",
            },
          ],
        },
        {
          title: inEnglish ? "Student Development" : "Pengembangan Siswa",
          items: [
            {
              label: inEnglish ? "Submit an Achievement" : "Pengajuan Prestasi",
              description: "Ajukan capaian lomba & juara",
              href: "/akademik/pengajuan-prestasi",
              ikon: "emoji_events",
            },
            {
              label: inEnglish ? "Archive Center" : "Pusat Arsip",
              description: "Dokumen & album kegiatan",
              href: "/akademik/arsip",
              ikon: "folder",
            },
          ],
        },
      ],
    },
    { id: "galeri", href: "/kabar", label: inEnglish ? "Gallery" : "Galeri", ikon: "photo_library" },
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
              {inEnglish ? "Accredited A" : "Terakreditasi A"}
            </span>
            <div className="inline-flex rounded-full border border-white/25 p-0.5" aria-label="Pilih bahasa">
              {(["id", "en"] as const).map((locale) => (
                <button key={locale} type="button" lang={locale} aria-pressed={language === locale} onClick={() => setLanguage(locale)} className={`min-h-7 rounded-full px-2 text-[11px] font-bold uppercase transition-colors ${language === locale ? "bg-white text-primary" : "text-surface-container-high hover:bg-white/10"}`}>
                  {locale}
                </button>
              ))}
            </div>
            <span className="hidden sm:inline text-surface-container-high">BAN-S/M</span>
            <a
              href={adminUrl}
              className="micro-cta hidden sm:inline-flex items-center gap-1 px-space-sm py-1.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold shadow-sm hover:bg-secondary-fixed-dim transition-all"
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
            className="micro-cta hidden md:inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-primary text-surface font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all"
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
            className="micro-cta hidden sm:inline-flex items-center gap-1.5 px-space-md py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold shadow-md hover:bg-secondary-fixed-dim transition-all"
          >
            <span>Bimbingan Konseling</span>
            <MessagesSquare aria-hidden="true" className="h-[18px] w-[18px]" />
          </button>

          <button
            aria-controls={MOBILE_MENU_ID}
            aria-expanded={isMobileOpen}
            aria-label={isMobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            className="micro-wiggle lg:hidden p-2 rounded-lg bg-surface-container-low text-primary hover:bg-surface-container"
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
