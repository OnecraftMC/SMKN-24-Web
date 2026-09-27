import path from 'node:path';
import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_URL;
const backendImagePattern = (() => {
  if (!backendUrl) return [];
  try {
    const url = new URL(backendUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return [];
    return [{
      protocol: url.protocol.slice(0, -1) as 'http' | 'https',
      hostname: url.hostname,
      port: url.port,
      pathname: '/**',
    }];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  // Monorepo: globals.css mengimpor token dari packages/shared/tokens.css yang ada
  // DI LUAR folder apps/main-web. Turbopack menolak impor yang keluar dari project
  // root, jadi root diarahkan ke root monorepo.
  turbopack: { root: path.join(__dirname, '..', '..') },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      ...backendImagePattern,
    ],
  },
};

export default nextConfig;
