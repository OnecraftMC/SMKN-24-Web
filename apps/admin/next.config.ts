import path from "node:path";
import type { NextConfig } from "next";

/**
 * Origin backend PHP. Gambar hasil upload dilayani dari origin ini
 * (UPLOAD_URL_BASE = "/backend/uploads/"), jadi host-nya didaftarkan ke
 * next/image agar pratinjau gambar admin bisa memakai <Image> yang dioptimalkan.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/backend";

function backendImagePatterns(): { protocol: "http" | "https"; hostname: string; port: string; pathname: string }[] {
  try {
    const url = new URL(apiUrl);
    return [
      {
        protocol: url.protocol === "https:" ? "https" : "http",
        hostname: url.hostname,
        port: url.port,
        pathname: "/**",
      },
    ];
  } catch {
    // NEXT_PUBLIC_API_URL tidak valid — jangan gagalkan build, cukup tanpa pola remote.
    return [];
  }
}

const nextConfig: NextConfig = {
  // Monorepo: app/globals.css mengimpor token dari packages/shared/tokens.css yang
  // berada DI LUAR folder apps/admin. Turbopack menolak impor yang keluar dari
  // project root, sehingga root diarahkan ke root monorepo.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  images: {
    remotePatterns: backendImagePatterns(),
  },
};

export default nextConfig;

