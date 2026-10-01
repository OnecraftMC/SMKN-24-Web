"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/shell/Sidebar";
import Topbar from "@/components/shell/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Guard: tanpa sesi valid, keluar dari area dashboard.
  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    // checking (validasi token) atau guest (sekejap sebelum redirect).
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 aria-hidden className="h-6 w-6 animate-spin text-primary" />
        <span className="sr-only">Memeriksa sesi admin…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`flex min-h-screen flex-col ${collapsed ? "md:pl-[4.5rem]" : "md:pl-64"}`}>
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-margin-mobile py-space-lg md:px-margin-tablet lg:px-margin-desktop">
          {children}
        </main>
      </div>
    </div>
  );
}
