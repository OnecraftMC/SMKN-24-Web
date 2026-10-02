"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Building2,
  CalendarClock,
  CalendarDays,
  FolderOpen,
  GraduationCap,
  Images,
  LayoutDashboard,
  Lightbulb,
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

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** false = modul belum dibangun (Slice 2+), dirender nonaktif. */
  ready: boolean;
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
      { href: `${ADMIN_BASE}/berita`, label: "Berita & Highlight", icon: Newspaper, ready: true },
      { href: `${ADMIN_BASE}/pengumuman`, label: "Pengumuman & Papan", icon: Megaphone, ready: true },
      { href: `${ADMIN_BASE}/agenda`, label: "Agenda Kegiatan", icon: CalendarDays, ready: true },
      { href: `${ADMIN_BASE}/galeri`, label: "Galeri Kegiatan", icon: Images, ready: true },
      { href: `${ADMIN_BASE}/fasilitas`, label: "Fasilitas Sekolah", icon: Building2, ready: true },
      { href: `${ADMIN_BASE}/guru`, label: "Direktori Guru", icon: GraduationCap, ready: true },
    ],
  },
  {
    heading: "Akademik",
    items: [
      { href: `${ADMIN_BASE}/jadwal`, label: "Jadwal Pembelajaran", icon: CalendarClock, ready: true },
      { href: `${ADMIN_BASE}/arsip`, label: "Pusat Arsip", icon: FolderOpen, ready: false },
    ],
  },
  {
    heading: "Inbox & Moderasi",
    items: [
      { href: `${ADMIN_BASE}/bk`, label: "Pesan BK", icon: MessageSquareHeart, ready: false },
      { href: `${ADMIN_BASE}/aspirasi`, label: "Aspirasi", icon: Lightbulb, ready: false },
      { href: `${ADMIN_BASE}/prestasi`, label: "Pengajuan Prestasi", icon: Trophy, ready: false },
    ],
  },
  {
    heading: "Monitoring",
    items: [{ href: `${ADMIN_BASE}/chat`, label: "Riwayat Chatbot", icon: Bot, ready: false }],
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

function NavList({
  collapsed,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.heading ?? groupIndex} className={groupIndex > 0 ? "mt-space-md" : ""}>
          {group.heading && !collapsed && (
            <p className="mb-1 px-3 font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface-variant/70">
              {group.heading}
            </p>
          )}
          {group.heading && collapsed && <div className="mx-3 my-2 border-t border-surface-container" />}
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
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 font-label-md text-label-md text-on-surface-variant/50"
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
                        ? "bg-primary font-bold text-surface"
                        : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                    }`}
                  >
                    <Icon aria-hidden className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
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

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href={ADMIN_BASE} className="flex items-center gap-space-sm px-3 py-space-md" title="SMKN 24 Jakarta">
      <Image
        src="/logo-smkn24.png"
        alt="Logo SMK Negeri 24 Jakarta"
        width={36}
        height={36}
        className="h-9 w-auto shrink-0 rounded-md"
      />
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate font-headline-sm text-headline-sm font-bold leading-tight text-primary">
            SMKN 24 Jakarta
          </span>
          <span className="block truncate font-label-sm text-label-sm text-on-surface-variant">
            Dashboard Admin
          </span>
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

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
      {/* Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-surface-container bg-surface-container-lowest transition-[width] duration-200 md:flex ${
          collapsed ? "w-[4.5rem]" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between pr-2">
          <Brand collapsed={collapsed} />
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Perlebar sidebar" : "Persempit sidebar"}
            className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="h-4 w-4" />
            ) : (
              <PanelLeftClose aria-hidden className="h-4 w-4" />
            )}
          </button>
        </div>
        <nav aria-label="Menu utama" className="flex-1 overflow-y-auto px-2 pb-space-lg">
          <NavList collapsed={collapsed} pathname={pathname} />
        </nav>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-primary/50"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface-container-lowest shadow-xl"
          >
            <div className="flex items-center justify-between pr-2">
              <Brand collapsed={false} />
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Tutup menu"
                className="rounded-md p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Menu utama" className="flex-1 overflow-y-auto px-2 pb-space-lg">
              <NavList collapsed={false} pathname={pathname} onNavigate={onCloseMobile} />
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}


