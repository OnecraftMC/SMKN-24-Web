# docs(env): tidak ada `.env.example` di `apps/main-web` — `BACKEND_URL` belum diset di Vercel

## Masalah

`apps/main-web` tidak punya berkas `.env.example`. Cookbook env yang dibutuhkan belum jelas, dan di Vercel `BACKEND_URL` belum diisi — situs sedang berjalan memakai data contoh.

## Bukti

- `apps/main-web/` tidak memuat `.env*` sama sekali
- `apps/main-web/lib/api.ts:33` — membaca `process.env.BACKEND_URL`
- `apps/main-web/next.config.ts:4-19` — `remotePatterns` untuk gambar backend **diturunkan dari `BACKEND_URL`**; kosong ⇒ foto backend ditolak `next/image`
- Deployment 27 Sep 2026 berjalan tanpa env tersebut (fallback data contoh aktif, build exit 0)
- Bandingkan: `backend/.env.example` dan `apps/admin/.env.example` **sudah ada**

## Dampak

- Kontributor baru tidak tahu env mana yang wajib diisi.
- Admin yang dashboard-nya benar tidak sinkron dengan situs publik yang masih data contoh.
- `next.config.ts` membaca env saat **build**, jadi env baru berlaku setelah redeploy.

## Acceptance criteria

- [x] `apps/main-web/.env.example` dibuat berisi:
  - `BACKEND_URL=https://domain-anda/backend` (URL HTTP ke folder `backend/`, **bukan** port MySQL)
  - `NEXT_PUBLIC_ADMIN_URL=http://localhost:3001`
- [x] Komentar singkat menjelaskan bahwa `BACKEND_URL` dipakai untuk fetch data **dan** untuk `images.remotePatterns`
- [x] `.env.local` di-.gitignore (verifikasi: `git check-ignore apps/main-web/.env.local`)
- [x] README/`AGENTS.md` menyebut langkah deploy: set env di Vercel → Project → Settings → Environment Variables
- [x] Validasi URL: `BACKEND_URL` dengan port `3306` harus ditolak dengan pesan jelas (pola yang sama sudah diminta di `perbaikan error dan bug.md` E.1)

> Status 1 Okt 2026: seluruh AC terpenuhi. `.env.example` kini berketerangan, README
> memuat seksi "Set env di Vercel", dan `lib/api.ts` menolak port database 3306/5432
> (juga URL tidak valid/skema bukan http) dengan pesan eksplisit — terbukti di HTML
> build: `BACKEND_URL=http://localhost:3306 npm run build` → `berita.html` memuat
> "BACKEND_URL memakai port 3306 — itu port database, bukan URL backend."

## Verifikasi cepat

Isi env, lalu `npm run build` di `apps/main-web`; `berita.html` di `.next/server/app` harus memuat judul berita dari backend, bukan data contoh.

## Referensi

`perbaikan error dan bug.md` E.1 · `pemindahan konteks main-web.md` §4
