# ci: tambahkan workflow GitHub Actions (lint + typecheck + build)

## Masalah

Repo tidak punya CI sama sekali. Type-check baru saja menggagalkan PR — bukan karena kode salah, melainkan karena `typescript.ignoreBuildErrors: true` sempat menyamarkan 17 error selama berbulan-bulan, dan tidak ada yang menangkapnya sampai PR masuk ke Vercel.

## Bukti

- `Test-Path .github/workflows` → **False** (folder tidak ada)
- `apps/main-web/next.config.ts` — flag `typescript.ignoreBuildErrors: true` **sudah dihapus** pada 27 Sep 2026 (bagus), tetapi tidak ada pagar pengaman yang menggantikannya
- `npx eslint app components lib` di `apps/main-web` → saat ini 1 error, 5 warning
- PR check Vercel hanya menjalankan `npm run build`; tidak ada gate untuk lint

## Dampak

Tanpa CI, regressions masuk ke `main` tanpa terdeteksi. Temuan ini membuktikan biayanya nyata.

## Acceptance criteria

- [ ] `.github/workflows/ci.yml` ada
- [ ] Trigger: `push` ke `main`, `pull_request` ke `main`
- [ ] Job `lint` — `npx eslint app components lib` di `apps/main-web`
- [ ] Job `typecheck` — `npx tsc --noEmit` di `apps/main-web` (dijalankan terpisah karena build bisa melewati validasi)
- [ ] Job `build` — `npm run build` di `apps/main-web`
- [ ] Node version di-pin (repo memakai Next 16 + React 19)
- [ ] `working-directory: apps/main-web` dipakai; tidak ada package root untuk aplikasi
- [ ] Badge status ada di `README.md`
- [ ] Error lint yang sudah ada diperbaiki atau diabaikan **dengan alasan tertulis** (lihat issue 11), jangan dibiarkan menggagalkan build diam-diam

## Catatan

Jangan tambahkan `continue-on-error` pada typecheck — justru itu yang menutupi bug.

## Referensi

`pemindahan konteks main-web.md` §7 butir 8 · `report.md` §10.3.2
