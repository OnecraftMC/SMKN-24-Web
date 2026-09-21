/** @type {import('next').NextConfig} */
const path = require('node:path');

const nextConfig = {
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
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
