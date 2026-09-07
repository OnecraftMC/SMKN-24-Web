"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Beranda", icon: "home" },
    { href: "/profil", label: "Profil Sekolah", icon: "domain" },
    { href: "/akademik", label: "Akademik & Jadwal", icon: "calendar_month" },
    { href: "/kabar", label: "Kabar & Galeri", icon: "newspaper" },
    { href: "/profil#fasilitas", label: "Fasilitas & Kampus", icon: "apartment" },
  ];

  if (!isOpen) return null;

  return (
    <div className="lg:hidden border-t border-surface-container bg-surface-container-lowest px-margin-mobile py-space-sm shadow-xl space-y-1">
      {navLinks.map((link) => {
        const isActive = link.href === pathname || (link.href.startsWith("/profil#") && pathname === "/profil");
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
      <Link
        href="/#lokasi-sekolah"
        onClick={onClose}
        className="block w-full text-center mt-2 py-2.5 rounded-lg bg-secondary-container text-on-secondary-container font-label-md font-bold"
      >
        Lihat Lokasi Sekolah
      </Link>
    </div>
  );
}