"use client";

import { useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Bot,
  Building2,
  CalendarClock,
  CalendarDays,
  Database,
  Dumbbell,
  FolderOpen,
  GraduationCap,
  Images,
  LayoutDashboard,
  Megaphone,
  MessageSquareHeart,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { useModul, type ModulContextValue, type ModulKey, type SumberState } from "@/lib/admin/moduleCounts";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** false = modul belum dibangun (Slice 2+), dirender nonaktif. */
  ready: boolean;
  /**
   * Sumber jumlah pada ModulProvider untuk lencana rail. Jumlah berasal
   * dari backend, bukan dekorasi: "—" berarti sumbernya gagal dimuat.
   */
  jumlah?: ModulKey;
};

export type NavGroup = {
  heading?: string;
  items: NavItem[];
};

/** Semua halaman dashboard hidup di namespace `/admin` (gabungan satu aplikasi). */
export const ADMIN_BASE = "/admin";

/** Struktur menu sesuai rencana dashboard (laporan inspeksi.md Bagian F.6). */
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: ADMIN_BASE, label: "Overview", icon: LayoutDashboard, ready: true }],
  },
  {
    heading: "Konten Website",
    items: [
      { href: `${ADMIN_BASE}/berita`, label: "Berita & Highlight", icon: Newspaper, ready: true, jumlah: "berita" },
      { href: `${ADMIN_BASE}/pengumuman`, label: "Pengumuman & Papan", icon: Megaphone, ready: true, jumlah: "pengumuman" },
      { href: `${ADMIN_BASE}/agenda`, label: "Agenda Kegiatan", icon: CalendarDays, ready: true, jumlah: "agenda" },
      { href: `${ADMIN_BASE}/galeri`, label: "Galeri Kegiatan", icon: Images, ready: true, jumlah: "galeri" },
      { href: `${ADMIN_BASE}/fasilitas`, label: "Fasilitas Sekolah", icon: Building2, ready: true, jumlah: "fasilitas" },
      { href: `${ADMIN_BASE}/ekstrakurikuler`, label: "Ekstrakurikuler", icon: Dumbbell, ready: true, jumlah: "ekstrakurikuler" },
      { href: `${ADMIN_BASE}/guru`, label: "Direktori Guru", icon: GraduationCap, ready: true, jumlah: "guru" },
    ],
  },
  {
    heading: "Akademik",
    items: [
      { href: `${ADMIN_BASE}/jadwal`, label: "Jadwal Pembelajaran", icon: CalendarClock, ready: true },
      { href: `${ADMIN_BASE}/arsip`, label: "Pusat Arsip", icon: FolderOpen, ready: true },
    ],
  },
  {
    heading: "Inbox & Moderasi",
    items: [
      { href: `${ADMIN_BASE}/bk`, label: "Pesan BK", icon: MessageSquareHeart, ready: true, jumlah: "bk" },
      { href: `${ADMIN_BASE}/prestasi`, label: "Pengajuan Prestasi", icon: Trophy, ready: true, jumlah: "prestasi" },
    ],
  },
  {
    heading: "Monitoring",
    // Dataset dulu: findNavLabel memilih match pertama (startsWith), jadi
    // /chat/dataset harus terdaftar sebelum /chat agar breadcrumb tepat.
    items: [
      { href: `${ADMIN_BASE}/chat/dataset`, label: "Memori Chatbot", icon: Database, ready: true },
      { href: `${ADMIN_BASE}/chat`, label: "Riwayat Chatbot", icon: Bot, ready: true },
    ],
  },
  {
    heading: "Pengaturan",
    items: [{ href: `${ADMIN_BASE}/pengaturan`, label: "Profil & Sesi", icon: Settings, ready: false }],
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === ADMIN_BASE) return pathname === ADMIN_BASE;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Label halaman untuk breadcrumb topbar. */
export function findNavLabel(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (isActivePath(pathname, item.href)) return item.label;
    }
  }
  return "Dasbor";
}

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

/* ---------------------------------------------------------------------------
 * Lencana jumlah per modul
 *
 * Angka berasal dari backend dan pindah ke sini bersama penghapusan kartu
 * modul di Overview. state "error" sengaja tampil sebagai "—" berpermalinkan
 * error, bukan 0: jumlah yang gagal dimuat bukan jumlah nol.
 * ------------------------------------------------------------------------- */

type Lencana = { status: "loading" | "error" | "ok"; value: number | null };

function dariSumber<T>(sumber: SumberState<T>, angka: (nilai: T) => number): Lencana {
  if (sumber.kind === "loading") return { status: "loading", value: null };
  if (sumber.kind === "error") return { status: "error", value: null };
  return { status: "ok", value: angka(sumber.value) };
}

function hitungLencana(modul: ModulContextValue, key?: ModulKey): Lencana | null {
  switch (key) {
    case "berita":
      return dariSumber(modul.berita, (n) => n);
    case "guru":
      return dariSumber(modul.guru, (n) => n);
    case "fasilitas":
      return dariSumber(modul.fasilitas, (n) => n);
    case "ekstrakurikuler":
      return dariSumber(modul.ekstrakurikuler, (n) => n);
    case "galeri":
      return dariSumber(modul.galeri, (n) => n);
    case "pengumuman":
      return dariSumber(modul.pengumuman, (n) => n.total);
    case "agenda":
      return dariSumber(modul.agenda, (n) => n.length);
    case "bk":
      return dariSumber(modul.bk, (n) => n.filter((p) => p.status === "Baru").length);
    case "prestasi":
      return dariSumber(modul.prestasi, (n) => n.baru);
    default:
      return null;
  }
}

/** Angka lencana memakai pemisah ribuan gaya Indonesia. */
function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function LencanaJumlah({
  lencana,
  item,
  aktif,
}: {
  lencana: Lencana;
  item: NavItem;
  aktif: boolean;
}) {
  if (lencana.status === "loading") {
    return (
      <span
        aria-hidden
        className="h-4 w-6 shrink-0 animate-pulse rounded bg-primary-fixed/25"
      />
    );
  }

  if (lencana.status === "error") {
    return (
      <span
        title={`Jumlah ${item.label} gagal dimuat`}
        className="shrink-0 tabular-nums font-label-sm text-label-sm text-error"
      >
        <span aria-hidden>—</span>
        <span className="sr-only">
          Jumlah {item.label} gagal dimuat. Muat ulang halaman untuk mencoba lagi.
        </span>
      </span>
    );
  }

  const nilai = lencana.value ?? 0;
  return (
    <span
      title={`${formatNumber(nilai)} di ${item.label}`}
      key={nilai}
      className={`badge-enter shrink-0 tabular-nums font-label-sm text-label-sm font-bold ${
        aktif ? "text-on-secondary-fixed" : "text-primary-fixed-dim"
      }`}
    >
      {formatNumber(nilai)}
      <span className="sr-only"> di {item.label}</span>
    </span>
  );
}

function NavList({
  collapsed,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const modul = useModul();
  return (
    <>
      {NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.heading ?? groupIndex} className={groupIndex > 0 ? "mt-space-md" : ""}>
          {group.heading && !collapsed && (
            <p className="mb-1 px-3 font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary-fixed-dim">
              {group.heading}
            </p>
          )}
          {group.heading && collapsed && <div className="mx-3 my-2 border-t border-primary-container" />}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.ready && isActivePath(pathname, item.href);

              if (!item.ready) {
                return (
                  <li key={item.href}>
                    <span
                      aria-disabled="true"
                      title="Modul segera tersedia"
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 font-label-md text-label-md text-primary-fixed/50"
                    >
                      <Icon aria-hidden className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 font-label-md text-label-md transition-colors ${
                      active
                        ? "bg-secondary-container font-bold text-on-secondary-fixed"
                        : "text-primary-fixed hover:bg-primary-container hover:text-on-primary"
                    }`}
                  >
                    <Icon aria-hidden className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.jumlah && (
                      <span className="ml-auto">
                        <LencanaJumlah
                          lencana={hitungLencana(modul, item.jumlah)!}
                          item={item}
                          aktif={active}
                        />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

/** Kotak logo berukuran tetap: 36px baik expanded maupun collapsed (tidak mengecil). */
function LogoMark() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md">
      <Image
        src="/logo-smkn24.png"
        alt=""
        width={36}
        height={36}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href={ADMIN_BASE}
      aria-label="SMKN 24 Jakarta — Dashboard Admin"
      title="SMKN 24 Jakarta"
      className={`flex min-w-0 items-center ${collapsed ? "" : "flex-1 gap-space-xs"}`}
    >
      <LogoMark />
      {collapsed ? (
        <span className="sr-only">SMKN 24 Jakarta — Dashboard Admin</span>
      ) : (
        <span className="min-w-0 flex-1">
          <span className="block font-headline-sm text-headline-sm font-bold leading-tight text-on-primary">
            SMKN 24 Jakarta
          </span>
          <span className="block truncate font-label-sm text-label-sm text-primary-fixed-dim">
            Dashboard Admin
          </span>
        </span>
      )}
    </Link>
  );
}

/**
 * Header sidebar.
 *
 * Expanded: logo + teks + aksi dalam satu baris (teks memakai sisa lebar agar
 * tidak terpotong oleh tombol toggle).
 * Collapsed: logo dan aksi ditumpuk vertikal sehingga box logo 36px tetap utuh
 * di dalam sidebar 72px (tidak terhimpit/terdistorsi).
 */
function SidebarHeader({ collapsed, action }: { collapsed: boolean; action: ReactNode }) {
  return (
    <div
      className={`flex ${
        collapsed
          ? "flex-col items-center gap-space-xs px-2 py-space-sm"
          : "items-center gap-1 py-space-md pl-3 pr-1"
      }`}
    >
      <Brand collapsed={collapsed} />
      {action}
    </div>
  );
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  // Drawer mobile bisa ditutup dengan Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseMobile();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      {/* Desktop: lebar dianimasikan saat collapse/expand. */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-primary-container bg-primary transition-[width] duration-300 ease-in-out motion-reduce:transition-none md:flex ${
          collapsed ? "w-[4.5rem]" : "w-64"
        }`}
      >
        <SidebarHeader
          collapsed={collapsed}
          action={
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Perlebar sidebar" : "Persempit sidebar"}
              title={collapsed ? "Perlebar sidebar" : "Persempit sidebar"}
              className="shrink-0 rounded-md p-1.5 text-primary-fixed transition-colors hover:bg-primary-container hover:text-on-primary"
            >
              {collapsed ? (
                <PanelLeftOpen aria-hidden className="h-4 w-4" />
              ) : (
                <PanelLeftClose aria-hidden className="h-4 w-4" />
              )}
            </button>
          }
        />
        <nav aria-label="Menu utama" className="flex-1 overflow-y-auto px-2 pb-space-lg">
          <NavList collapsed={collapsed} pathname={pathname} />
        </nav>
      </aside>

      {/* Mobile drawer: pembungkus diberi `inert` saat tertutup supaya isi drawer
          tidak bisa di-Tab, termasuk selama animasi keluar. */}
      <div inert={!mobileOpen || undefined}>
        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              key="admin-mobile-drawer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-50 md:hidden"
            >
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={onCloseMobile}
                className="absolute inset-0 bg-primary/50"
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Menu navigasi"
                initial={{ x: shouldReduceMotion ? 0 : "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: shouldReduceMotion ? 0 : "-100%" }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.28,
                  ease: "easeOut",
                }}
                className="absolute inset-y-0 left-0 flex w-72 flex-col bg-primary shadow-xl"
              >
                <SidebarHeader
                  collapsed={false}
                  action={
                    <button
                      type="button"
                      onClick={onCloseMobile}
                      aria-label="Tutup menu"
                      className="shrink-0 rounded-md p-1.5 text-primary-fixed transition-colors hover:bg-primary-container hover:text-on-primary"
                    >
                      <X aria-hidden className="h-5 w-5" />
                    </button>
                  }
                />
                <nav aria-label="Menu utama" className="flex-1 overflow-y-auto px-2 pb-space-lg">
                  <NavList collapsed={false} pathname={pathname} onNavigate={onCloseMobile} />
                </nav>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
