import type { NextConfig } from "next";

/**
 * Konfigurasi Next.js untuk aplikasi gabungan (publik + dashboard admin).
 *
 * Sumber pengambilan gambar remote:
 * - `lh3.googleusercontent.com` : foto berita dari backend.
 * - `ak-d.tripcdn.com`          : foto gedung sekolah pada Hero.
 * - origin `BACKEND_URL`        : gambar hasil upload admin (backend PHP).
 */
const backendUrl = process.env.BACKEND_URL;
const backendImagePattern = (() => {
  if (!backendUrl) return [];
  try {
    const url = new URL(backendUrl);
    if (!["http:", "https:"].includes(url.protocol)) return [];
    return [
      {
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        // Foto gedung sekolah pada Hero (components/beranda/Hero.tsx).
        protocol: "https",
        hostname: "ak-d.tripcdn.com",
        port: "",
        pathname: "/**",
      },
      ...backendImagePattern,
    ],
  },
};

export default nextConfig;