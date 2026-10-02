import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * Root layout aplikasi gabungan SMKN 24 Jakarta.
 *
 * Berisi hal-hal yang berlaku untuk SELURUH halaman (publik, login, dan
 * dashboard admin): elemen html/body, font brand self-hosted, dan stylesheet
 * ikon Material Symbols.
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Ikon Material Symbols dipakai komponen publik. Aturan `no-page-custom-font`
            menyasar Pages Router; di App Router link pada root layout berlaku untuk
            seluruh aplikasi. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="bg-surface text-on-surface">{children}</body>
    </html>
  );
}