# Rencana Jalur A + B

- [x] Amankan SSR splash, font brand, route berita/login, dan type-check build.
- [x] Sambungkan halaman publik ke API PHP dan tampilkan state error/kosong tanpa data contoh.
- [x] Sambungkan FormBK dan chatbot melalui proxy Next.js; pertahankan status HTTP backend.
- [x] Jalankan type-check, lint, production build, dan verifikasi proxy dengan backend mock.
- [ ] Verifikasi alur simpan FormBK/chatbot, data publik, serta DB dengan PHP/MySQL aktif.
- [ ] Jalankan uji browser JavaScript mati, navigasi, font, dan responsif.
- [ ] Tambahkan proteksi rate limit di backend sebelum rilis publik.

## Lanjutan 29 Sep 2026 (issue 01/02 + lint)

- [x] Route `/jurusan/[key]` dengan `generateStaticParams` (5 jurusan) + `generateMetadata` (issue 02).
- [x] `generateMetadata` judul berita via helper `ambilBerita()` bersama (issue 01).
- [x] `<img>` → `next/image` di `Hero` & `SambutanKepsek`; `remotePatterns` tripcdn ditambah — lint 0 warning.
- [x] Verifikasi: `tsc` exit 0, `eslint` exit 0, `next build` exit 0, smoke test prod server (200/404 benar).
- [ ] Unggah foto kegiatan ke `public/images/jurusan/<key>.jpg` lalu isi `jurusanData[].gambar`.
- [ ] Sisanya: issue 03–13 dan verifikasi backend PHP/MySQL aktif (butuh lingkungan berjalan).

## Fase 1 — 1 Okt 2026 (issue 04 + E2E backend aktif)

- [x] `.env.example` berketerangan, README dapat seksi "Set env di Vercel", `lib/api.ts` menolak `BACKEND_URL` port 3306/5432 — terbukti di `berita.html` hasil build (lihat issue 04).
- [x] Bug P0 baru: `slug` berita berisi path `/berita/...` → **semua** `/berita/[slug]` 404; diubah jadi segmen URL + 3 link komponen disesuaikan → kini 200.
- [x] E2E backend PHP + database remote aktif: judul berita & nama guru di HTML build dari DB; FormBK → 201 + row di `pesan_bk` (dibersihkan); chat → 200; galeri 0 → empty state jujur.
- [x] Verifikasi: `tsc` 0, `eslint` 0/0, `next build` 0 (build normal & build dengan backend hidup).
- [ ] Uji browser (JS mati, filter interaktif, admin→publik) + rate limit backend (B9).
- [ ] Issue 05–13 yang tersisa.
