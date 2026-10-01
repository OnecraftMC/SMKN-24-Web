"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { findNavLabel } from "@/components/shell/Sidebar";

export default function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-surface-container bg-surface-container-lowest/95 backdrop-blur">
      <div className="flex h-16 items-center gap-space-md px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Buka menu"
          className="rounded-md p-2 text-primary hover:bg-surface-container lg:hidden"
        >
          <Menu aria-hidden className="h-5 w-5" />
        </button>

        <nav aria-label="Posisi halaman">
          <ol className="flex items-center gap-1 font-label-sm text-label-sm">
            <li className="text-on-surface-variant">Dasbor</li>
            <li aria-hidden className="text-outline-variant">/</li>
            <li aria-current="page" className="font-bold text-primary">
              {findNavLabel(pathname)}
            </li>
          </ol>
        </nav>

        <div className="ml-auto flex items-center gap-space-sm">
          <div className="text-right leading-tight">
            <p className="font-label-md text-label-md font-bold text-primary">
              {user?.nama ?? user?.username ?? "Admin"}
            </p>
            <p className="font-label-sm text-label-sm capitalize text-on-surface-variant">
              {user?.role ?? "admin"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Keluar dari dashboard"
            title="Keluar"
            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
          >
            <LogOut aria-hidden className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
