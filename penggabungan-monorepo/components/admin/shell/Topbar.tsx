"use client";

/**
 * Header hari dashboard admin.
 *
 * Dulu posisinya di hero "Command Center" pada halaman Overview: blok besar
 * berisi sapaan, jam, dan chip angka. Sekarang tanggal, jam, dan sapaan tinggal
 * sebagai header — di sini mereka jadi konteks kerja, bukan pernyataan. Jam
 * lokal bergerak tiap 30 detik mengikuti waktu Indonesia.
 */

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { useJam } from "@/lib/admin/useJam";
import { findNavLabel } from "@/components/admin/shell/Sidebar";

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "Selasa, 18 Oktober 2026" — jam Indonesia (WIB), tanpa zona tambahan. */
function tanggalPanjang(now: Date): string {
  return `${HARI[now.getDay()]}, ${now.getDate()} ${BULAN[now.getMonth()]} ${now.getFullYear()}`;
}

/** "14:32" — format 24 jam gaya Indonesia. */
function jamPendek(now: Date): string {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/** Sapaan mengikuti jam kerja sekolah; netral di luar itu. */
function sapaan(now: Date): string {
  const jam = now.getHours();
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Jam bergerak tiap 30 detik; null sebelum hydration agar render server dan
  // klien sama.
  const now = useJam();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const nama = user?.nama ?? user?.username ?? "Admin";

  return (
    <header className="sticky top-0 z-30 border-b border-primary-container bg-primary">
      <div className="flex h-16 items-center gap-space-md px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Buka menu"
          className="micro-wiggle rounded-md p-2 text-primary-fixed hover:bg-primary-container hover:text-on-primary lg:hidden"
        >
          <Menu aria-hidden className="h-5 w-5" />
        </button>

        {/* Header hari: tanggal, jam Indonesia, dan sapaan — konteks, bukan hero. */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-title-md text-title-md font-bold text-on-primary">
            {now ? tanggalPanjang(now) : "Memuat tanggal…"}
          </p>
          <p className="flex items-center gap-space-xs truncate font-label-sm text-label-sm text-primary-fixed-dim">
            <span>{sapaan(now ?? new Date())}, {nama}</span>
            <span aria-hidden className="text-primary-fixed/40">
              ·
            </span>
            <span className="tabular-nums" aria-live="off">
              {now ? `${jamPendek(now)} WIB` : "--:-- WIB"}
            </span>
          </p>
        </div>

        <nav aria-label="Posisi halaman" className="hidden shrink-0 lg:block">
          <ol className="flex items-center gap-1 font-label-sm text-label-sm">
            <li className="text-primary-fixed-dim">Dasbor</li>
            <li aria-hidden className="text-primary-fixed/40">
              /
            </li>
            <li aria-current="page" className="font-bold text-secondary-container">
              {findNavLabel(pathname)}
            </li>
          </ol>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Keluar dari dashboard"
          title="Keluar"
          className="micro-wiggle shrink-0 rounded-lg p-2 text-primary-fixed transition-colors hover:bg-error-container hover:text-on-error-container"
        >
          <LogOut aria-hidden className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}