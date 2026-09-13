import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin SMKN 24",
  description: "Panel pengelolaan konten SMKN 24 Jakarta",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
