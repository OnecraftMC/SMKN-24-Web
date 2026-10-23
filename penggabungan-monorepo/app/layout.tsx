import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "react-easy-crop/react-easy-crop.css";

/**
 * Root layout aplikasi gabungan SMKN 24 Jakarta.
 *
 * Berisi hal-hal yang berlaku untuk SELURUH halaman (publik, login, dan
 * dashboard admin): elemen html/body dan font brand self-hosted.
 *
 * Kerangka visual berbeda per area dan dipisahkan lewat route group:
 *   - `app/(public)/layout.tsx` — Navbar, Footer, Chatbot, splash publik.
 *   - `app/(admin)/layout.tsx`  — AuthProvider dashboard admin (tanpa kerangka publik).
 */
const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SMK Negeri 24 Jakarta",
  description:
    "Menumbuhkan kecendekiaan generasi bangsa berwawasan global, berakar budi pekerti luhur, dan berdaya saing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={jakartaSans.variable}>
      <body className="bg-surface text-on-surface">
        {children}
      </body>
    </html>
  );
}
