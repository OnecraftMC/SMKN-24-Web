import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard Admin — SMK Negeri 24 Jakarta",
  description: "Panel pengelolaan konten, akademik, dan inbox SMK Negeri 24 Jakarta.",
  // Panel internal: jangan diindeks mesin pencari.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Pola yang sama dipakai situs publik. Aturan no-page-custom-font ditujukan
            untuk Pages Router; pada App Router, link di root layout berlaku untuk
            seluruh aplikasi. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
