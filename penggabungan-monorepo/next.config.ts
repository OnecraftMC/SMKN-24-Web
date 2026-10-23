import type { NextConfig } from "next";

/**
 * Konfigurasi Next.js untuk aplikasi gabungan (publik + dashboard admin).
 *
 * Sumber pengambilan gambar remote:
 * - `lh3.googleusercontent.com` : foto berita dari backend.
 * - `ak-d.tripcdn.com`          : foto gedung sekolah pada Hero.
 * - origin `BACKEND_URL`        : aset lama yang masih dilayani backend PHP.
 * - origin `NEXT_PUBLIC_ASSET_URL` : aset publik saat API dipisah ke subdomain.
 */
const backendImagePatterns = [
  process.env.BACKEND_URL,
  process.env.LARAVEL_API_URL,
  process.env.NEXT_PUBLIC_ASSET_URL,
].flatMap(
  (value) => {
    if (!value) return [];
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) return [];
      const hostnames = new Set([url.hostname]);
      if (url.hostname === "localhost") hostnames.add("127.0.0.1");
      if (url.hostname === "127.0.0.1") hostnames.add("localhost");

      return [...hostnames].map((hostname) => ({
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname,
        port: url.port,
        pathname: "/**",
      }));
    } catch {
      return [];
    }
  }
);

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
      ...backendImagePatterns,
    ],
  },
};

export default nextConfig;