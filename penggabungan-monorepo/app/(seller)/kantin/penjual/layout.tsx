import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aplikasi Penjual Kantin — SMKN 24 Jakarta",
  description: "Aplikasi pesanan kantin untuk penjual.",
  robots: { index: false, follow: false },
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface-container-low">{children}</div>;
}
