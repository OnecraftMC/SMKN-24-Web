# Draft issue GitHub — `apps/main-web`

13 issue hasil inspeksi 27 September 2026 (perbaikan build PR `abc7859`).
Setiap file berisi judul (baris `# `) + body, format GitHub Issue.

**Isu ini BELUM dibuat di GitHub** — mesin ini tidak punya `gh` CLI maupun token.
Buat manual lewat web, atau pakai skrip di bawah.

## Cara paling cepat: GitHub CLI

```powershell
winget install --id GitHub.cli        # sekali saja
gh auth login                          # sekali saja

cd "C:\Users\user\Documents\first project\smk24\SMKN24JKT.worktrees\school-website-nextjs-tailwind-monorepo\github-issues"
.\buat-issue.ps1 -DryRun              # lihat pratinjau dulu
.\buat-issue.ps1                      # buat semua
```

## Tanpa `gh` CLI: tempel manual

Buka <https://github.com/OnecraftMC/SMKN-24-Web/issues/new>, salin judul + isi tiap file.

## Prioritas

| # | Prioritas | Judul |
|---|---|---|
| 01 | P0 | feat(berita): buat route detail `/berita/[slug]` — kartu berita 404 |
| 02 | P0 | feat(jurusan): buat route detail `/jurusan/[key]` — 5 kartu jurusan 404 |
| 03 | P0 | fix(bk): FormBK menampilkan "diterima" padahal tidak disimpan |
| 04 | P0 | docs(env): tidak ada `.env.example`; `BACKEND_URL` belum di Vercel |
| 05 | P1 | feat(chat): ganti simulasi `setTimeout` dengan backend chat |
| 06 | P1 | refactor(api): sambungkan 3 proxy route yang masih stub `501` |
| 07 | P1 | feat(berita): `/berita` masih baca data statis, bukan API |
| 08 | P1 | fix(galeri): fallback galeri kosong (aset data-URL base64) |
| 09 | P1 | fix(konten): `QuickHighlights` menampilkan angka belum terverifikasi |
| 10 | P2 | chore: hapus file mati dan `dist/` legacy |
| 11 | P2 | ci: tambah GitHub Actions (lint + typecheck + build) |
| 12 | P2 | fix(lint): `setState` sinkron di dalam effect pada splash |
| 13 | P2 | docs(deploy): catat konvensi env & SOP deploy |

> Issue 01 dan 02 saling terkait: keduanya mengembalikan 404 ke pengguna dari navigasi utama.

## Yang sudah beres (tidak dijadikan issue)

- **F01 splash memblokir children** — sudah diperbaiki; `index.html` sudah memuat `<main>` dan `<h1>`.
- **Redirect `/login` → `/admin` 404** — sudah memakai `NEXT_PUBLIC_ADMIN_URL` dengan fallback.
- **`next.config.ts` `ignoreBuildErrors: true`** — sudah dihapus; type-check kini benar-benar berjalan.
- **`server-only` belum terpasang** — sudah ditambahkan ke `dependencies`.
- **17 error TypeScript** — sudah diperbaiki; `tsc --noEmit` 0 error, `next build` exit 0.

## Verifikasi ulang sebelum mengerjakan issue

```powershell
cd apps\main-web
npx tsc --noEmit          # harus 0 error
npx eslint app components lib
npm run build
```
