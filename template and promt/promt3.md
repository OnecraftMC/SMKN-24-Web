---
title: Prompt Eksekusi Jalur A + B — Main-Web SMKN 24 Jakarta
version: 1.0
created: 2026-09-27
target_app: apps/main-web
scope: |
  Jalur A — Amankan Fondasi (F01, F13, F06, F03, F02)
  Jalur B — Wiring Publik (B1-B5: API client + wire komponen ke backend PHP)
related_docs:
  - pemindahan memori.md
  - laporan inspeksi.md
  - report.md
  - pemindahan konteks main-web.md
  - perbaikan error dan bug.md
  - implementasi.md
status: ready-for-execution
---

# Prompt Eksekusi: Jalur A + B — Main-Web SMKN 24 Jakarta

> **Untuk AI Agent:** Dokumen ini adalah instruksi kerja lengkap. Bacalah dari atas ke bawah, jangan melompat. Setiap bagian punya peran tertentu.

---

## Daftar Isi

1. [Peran dan Konteks](#1-peran-dan-konteks)
2. [Wajib: Baca Dokumentasi Sebelum Menulis Kode](#2-wajib-baca-dokumentasi-sebelum-menulis-kode)
3. [Aturan Kerja yang Tidak Boleh Dilanggar](#3-aturan-kerja-yang-tidak-boleh-dilanggar)
4. [Jalur A — Amankan Fondasi](#4-jalur-a--amankan-fondasi)
   - [A1. F01 — Hentikan gating splash](#a1-f01--hentikan-gating-splash-di-main-web)
   - [A2. F13 — Muat font brand Plus Jakarta Sans](#a2-f13--muat-font-brand-plus-jakarta-sans)
   - [A3. F06 — Hapus atau implementasikan route yang hilang](#a3-f06--hapus-atau-implementasikan-route-yang-hilang)
   - [A4. F03 — Netralisir login publik palsu](#a4-f03--netralisir-login-publik-palsu)
   - [A5. F02 — Aktifkan type-checking saat build](#a5-f02--aktifkan-type-checking-saat-build)
5. [Jalur B — Wiring Publik](#5-jalur-b--wiring-publik)
   - [B1. Setup API client + environment](#b1-setup-api-client--environment)
   - [B2. Wire komponen beranda](#b2-wire-komponen-beranda-slice-2-lanjutan)
   - [B3. Wire komponen profil & akademik](#b3-wire-komponen-profil--akademik)
   - [B4. Wire FormBK ke backend](#b4-wire-formbk-ke-backend)
   - [B5. Wire ChatbotWidget ke backend](#b5-wire-chatbotwidget-ke-backend)
6. [Batasan & Larangan](#6-batasan--larangan)
7. [Cara Kerja yang Diharapkan](#7-cara-kerja-yang-diharapkan)
8. [Checklist Verifikasi Manual](#8-checklist-verifikasi-manual)
9. [Output yang Harus Kamu Berikan](#9-output-yang-harus-kamu-berikan)
10. [Gaya Komunikasi](#10-gaya-komunikasi)

---

## 1. Peran dan Konteks

Kamu adalah **AI agent senior** untuk proyek **website profil SMK Negeri 24 Jakarta** yang sedang dipersiapkan untuk **lomba web development tingkat nasional**. Kamu bekerja di workspace monorepo yang sama dengan agent-agent sebelumnya.

### 1.1 Tugasmu

Mengeksekusi dua jalur berikut secara berurutan:

| Jalur | Nama | Fokus | Estimasi |
|---|---|---|---|
| **A** | Amankan Fondasi | Main-web P0 (F01, F13, F06, F03, F02) | 1 sesi |
| **B** | Wiring Publik | Sambungkan main-web ke backend PHP | 1-2 sesi |

Total target: **1-2 sesi kerja terfokus**.

### 1.2 Filosofi Kerja

- **Hemat waktu pemilik proyek.** Kerjakan mandiri, jangan tunggu konfirmasi berulang.
- **Jangan memalsukan hasil.** Setiap klaim "selesai" harus disertai bukti perintah.
- **Jangan menebak secara diam-diam.** Jika ambigu, pilih opsi rasional, catat asumsinya di laporan, lanjut kerja.

### 1.3 Sumber Kebenaran

| Sumber | Peran |
|---|---|
| `backend/` (PHP) | Satu-satunya sumber data bisnis |
| `apps/main-web/AGENTS.md` | Panduan Next.js lokal (wajib dibaca) |
| `packages/shared/tokens.css` | Token visual bersama |
| Route `apps/main-web/app/api/*` | **BUKAN** integrasi backend — jangan dipakai |

---

## 2. Wajib: Baca Dokumentasi Sebelum Menulis Kode

Baca file berikut **secara berurutan**. Setiap file punya konteks yang tidak tergantikan.

### 2.1 Dokumentasi Naratif (urut)

1. `pemindahan memori.md` — otak utama / rencana besar
2. `laporan inspeksi.md` — temuan koreksi + log Slice 0-3 (**fokus Bagian A, B, G, H**)
3. `report.md` — quality review main-web (**fokus S1: F01-F05, S3: F13/F14/F17/F18/F19, S4: F20-F29**)
4. `pemindahan konteks main-web.md` — inspeksi fokus frontend (**sumber tunggal untuk P1/P2 main-web**)
5. `perbaikan error dan bug.md` — bug yang **sudah** diperbaiki (jangan ulangi)
6. `implementasi.md` — progress terakhir `/jurusan`

### 2.2 File Kode Wajib Baca

**Konfigurasi & layout:**
- `apps/main-web/app/layout.tsx`
- `apps/main-web/app/globals.css`
- `apps/main-web/app/page.tsx`
- `apps/main-web/next.config.ts`
- `apps/main-web/AGENTS.md` (jika ada)

**Komponen target:**
- `apps/main-web/components/ui/LoadingScreenProvider.tsx`
- `apps/main-web/components/layout/Navbar.tsx`
- `apps/main-web/components/layout/MobileMenu.tsx`
- `apps/main-web/components/ui/footer-section.tsx`
- `apps/main-web/components/beranda/BeritaTerkini.tsx`
- `apps/main-web/components/beranda/PapanPengumuman.tsx`
- `apps/main-web/components/beranda/AgendaKegiatan.tsx`
- `apps/main-web/components/profil/DewanGuru.tsx`
- `apps/main-web/components/profil/FasilitasKampus.tsx`
- `apps/main-web/components/kabar/GaleriVisual.tsx`
- `apps/main-web/components/kabar/FeaturedNews.tsx`
- `apps/main-web/components/akademik/JadwalMatriks.tsx`
- `apps/main-web/components/akademik/FormBK.tsx`
- `apps/main-web/components/chatbot/ChatbotWidget.tsx`

**Data & tipe:**
- `apps/main-web/lib/data.ts`
- `apps/main-web/lib/types.ts`
- `packages/shared/types.ts`
- `packages/shared/tokens.css`

> ⚠️ **Jangan lewati langkah ini.** Melompat langsung ke kode akan menghasilkan integrasi yang salah kontrak.

---

## 3. Aturan Kerja yang Tidak Boleh Dilanggar

Diambil dari `pemindahan memori.md` §0 dan `pemindahan konteks main-web.md` §0.

| # | Aturan | Alasan |
|---|---|---|
| 1 | Backend PHP `backend/` adalah **satu-satunya sumber data bisnis** | Route `app/api/*` statis/501 tidak layak jadi kontrak |
| 2 | Jangan nyatakan submit berhasil jika data belum tersimpan | Tidak ada `alert("berhasil")` tanpa request nyata |
| 3 | Jangan hapus/timpa perubahan lokal lain | Cek `git status` dulu; tanya jika ragu |
| 4 | Pertahankan token visual bersama dari `packages/shared/tokens.css` | Jangan salin token ke komponen |
| 5 | Jangan hardcode domain admin/backend | Pakai environment variable |
| 6 | Jangan commit `.env`, `.env.local`, secret, atau token | Keamanan |
| 7 | Ikuti `apps/main-web/AGENTS.md` jika ada | Panduan Next.js lokal |
| 8 | Semua teks user-facing **Bahasa Indonesia** | Konsisten dengan gaya repo |
| 9 | Konsisten dengan pattern repo: `Reveal`, token spacing/warna, Material Symbols | Visual consistency |
| 10 | Setiap perubahan lolos `npx tsc --noEmit` dan `npm run lint` tanpa error/warning baru | Kualitas |
| 11 | Jangan pakai `window.alert` untuk feedback baru | UX buruk, tidak styleable |
| 12 | Jangan pakai `<img>` untuk komponen baru; gunakan `next/image` | Optimasi & konsistensi |

---

## 4. Jalur A — Amankan Fondasi

Kerjakan **berurutan** (A1 → A5). Setiap item punya file target dan kriteria sukses.

### A1. F01 — Hentikan gating splash di main-web

#### Masalah

**Bukti di `report.md` §4 F01:**
`components/ui/LoadingScreenProvider.tsx` baris 19–25 memakai `{!isLoading && children}`, sehingga seluruh halaman tidak dirender selama SSR. HTML yang dikirim hanya splash + SVG logo.

**Terverifikasi di:**
- `.next/server/app/index.html`
- `.next/server/app/profil.html`

#### Yang Harus Dilakukan

- [ ] **Selalu render `children`** di server.
- [ ] Splash menjadi **overlay** di atas konten:
  - Ketika selesai: `fixed inset-0 z-50 pointer-events-none`
  - Atau hilangkan dari DOM setelah animasi selesai.
- [ ] **Hilangkan animasi wajib 3,2 detik untuk kunjungan berulang.**
  - Gunakan `sessionStorage` (kunci: `smkn24-splash-shown`).
  - Kunjungan kedua tidak menampilkan splash.
- [ ] Hormati `prefers-reduced-motion`: jika user set reduce, langsung sembunyikan splash.
- [ ] Pastikan `<h1>`/`<main>` benar-benar ada di DOM hasil prerender.

#### Kriteria Sukses

- ✅ `.next/server/app/index.html` dan `profil.html` memuat `<main>` dan `<h1>`.
- ✅ Tanpa JavaScript, konten tetap terbaca (tidak putih polos).
- ✅ Splash tetap muncul **sekali** di kunjungan pertama (visual sama seperti sekarang).

---

### A2. F13 — Muat font brand Plus Jakarta Sans

#### Masalah

**Bukti di `report.md` §6 F13:**
- `packages/shared/tokens.css` menyebut `Plus Jakarta Sans`.
- `app/globals.css` baris 23 memaksa `Arial, Helvetica, sans-serif`.
- `app/layout.tsx` baris 21 hanya memuat Material Symbols.

Hasil: **seluruh identitas tipografi hilang**, semua teks dirender di Arial.

#### Yang Harus Dilakukan

- [ ] Muat Plus Jakarta Sans via `next/font/google` di `app/layout.tsx` — **self-hosted**, tidak render-blocking.
- [ ] Hapus aturan `font-family: Arial, Helvetica, sans-serif;` di `globals.css` baris 23.
- [ ] Ekspos font sebagai CSS variable (mis. `--font-sans`) dan referensikan di `body`/`html`.
- [ ] Jangan ubah token `fontFamily` di `tokens.css` (biarkan sebagai referensi nama).

#### Bonus: F14 (berdekatan, kerjakan jika mudah)

- [ ] Tambahkan `<link rel="preconnect">` untuk `fonts.googleapis.com` dan `fonts.gstatic.com` sebelum memuat Material Symbols.
- [ ] Tambahkan parameter `&display=swap` di URL Material Symbols.
- [ ] (Opsional) Tambahkan `&text=` subset berisi glyph ikon yang benar-benar dipakai.

#### Kriteria Sukses

- ✅ HTML hasil prerender memuat class font Google (`__variable_...`).
- ✅ Dev tools > computed font body menunjukkan **"Plus Jakarta Sans"**, bukan Arial.
- ✅ Ikon Material Symbols tidak lagi flash sebagai teks ligatur di cold load.

---

### A3. F06 — Hapus atau implementasikan route yang hilang

#### Masalah

**Bukti di `report.md` §5 F06:**
- Navbar desktop (`components/layout/Navbar.tsx` baris 19-20)
- Footer (`components/ui/footer-section.tsx` baris 33-34)
- CTA "Semua Berita" (`components/beranda/BeritaTerkini.tsx` baris 20)

Ketiganya menautkan `/jurusan` dan `/berita` — **keduanya 404**.

#### Keputusan yang Harus Diambil

Pilih **satu** opsi, jelaskan di laporan.

**🅰️ Opsi A (Direkomendasikan):** Buat route `/berita` minimal.

- [ ] `/berita` — daftar berita (dari `beritaData` dulu; wiring backend di Jalur B).
- [ ] `/berita/[slug]` — halaman detail sederhana (judul, gambar, isi, tanggal).
- [ ] Tambahkan helper `slugify()` di `lib/utils.ts` (buat jika belum ada).
- [ ] **Jangan** hubungkan ke backend dulu.

**🅱️ Opsi B (Jika waktu mepet):** Hapus semua link.

- [ ] Hapus link `/berita` dari Navbar, Footer, `BeritaTerkini`.
- [ ] Ubah label "Semua Berita" jadi tidak clickable atau arahkan ke `/kabar`.

**Untuk `/jurusan`:**

Route sudah ada (`app/jurusan/page.tsx` dari `implementasi.md`). Pastikan hanya link yang sudah diverifikasi mengarah ke sana. **Jangan ubah** `DaftarJurusan.tsx` — link internal `/jurusan/<key>` memang menuju halaman per jurusan yang belum ada (keputusan pemilik, lihat `implementasi.md` §1).

#### Kriteria Sukses

- ✅ Tidak ada link `href` di Navbar/Footer/CTA yang mengarah ke 404.
- ✅ Jika Opsi A dipilih: `/berita` dan `/berita/[slug]` muncul di build route table.

---

### A4. F03 — Netralisir login publik palsu

#### Masalah

**Bukti di `report.md` §4 F03:**
`app/login/page.tsx` menerima kredensial apapun lalu redirect ke `/admin` (tidak ada). Backend login sebenarnya pakai **username + password**, bukan email.

#### Yang Harus Dilakukan

- [ ] Hapus seluruh file `app/login/page.tsx`, **atau** ubah menjadi redirect ke admin origin.
- [ ] Ganti link `/login` di Navbar (dan MobileMenu jika ada) menjadi link ke:
  ```
  process.env.NEXT_PUBLIC_ADMIN_URL
  ```
  Fallback: `http://localhost:3001`.
- [ ] Tambahkan `.env.example` di `apps/main-web/` dengan minimal:
  ```env
  NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
  ADMIN_ORIGIN=http://localhost:3001
  ```
- [ ] Jangan hardcode domain apapun.
- [ ] Dokumentasikan di README main-web.

#### Kriteria Sukses

- ✅ Tidak ada form login di main-web.
- ✅ Klik "Login" di Navbar membuka admin origin.
- ✅ `.env.example` ada dan terdokumentasi.

---

### A5. F02 — Aktifkan type-checking saat build

#### Masalah

**Bukti di `report.md` §4 F02:**
`apps/main-web/next.config.ts` memasang `typescript.ignoreBuildErrors: true`. Build sukses tidak membuktikan `tsc` lolos.

#### Yang Harus Dilakukan

- [ ] Hapus `ignoreBuildErrors: true` dari `next.config.ts`.
- [ ] Jalankan `npx tsc --noEmit` — pastikan **exit 0**.
  - Jika ada error, perbaiki.
  - **Jangan** matikan lagi.
- [ ] Perbaiki error tunggal ESLint di `next.config.ts:2` (`@typescript-eslint/no-require-imports`):
  - Konversi `require()` ke `import`.

#### Bonus: F20 (CI)

- [ ] Buat `.github/workflows/ci.yml` minimal untuk `apps/main-web`:

  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    main-web:
      runs-on: ubuntu-latest
      defaults:
        run:
          working-directory: apps/main-web
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: npm
            cache-dependency-path: apps/main-web/package-lock.json
        - run: npm ci
        - run: npx tsc --noEmit
        - run: npm run lint
        - run: npm run build
  ```

#### Kriteria Sukses

- ✅ `npm run build` mencetak proses type-checking (tidak lagi "Skipping validation of types").
- ✅ `npx tsc --noEmit` exit 0.
- ✅ `npm run lint` tidak menambah error baru.

---

## 5. Jalur B — Wiring Publik

**Prasyarat:** Selesaikan Jalur A dulu. Konfirmasi backend PHP dan MySQL siap (lihat `perbaikan error dan bug.md` E.3 untuk cara menjalankan PHP CLI server lokal).

### Prinsip Kerja Jalur B

| Prinsip | Penjelasan |
|---|---|
| **Satu client API terpusat** | Buat baru di `apps/main-web/lib/api.ts`. Jangan pakai route `app/api/*` yang statis. |
| **Jangan ubah field backend** | Buat **mapper eksplisit** di `packages/shared/mappers.ts`. |
| **Jangan ubah komponen visual** | Kecuali mengganti sumber data + state loading/error/empty. |
| **Gunakan Server Components** | `async function Page() { ... }` untuk fetch data di server. |
| **ISR** | `export const revalidate = 60;` pada halaman berita dari backend. |
| **Fallback aman** | Jika backend down, tampilkan empty state jujur. |

---

### B1. Setup API client + environment

- [ ] Buat `apps/main-web/lib/api.ts`:
  - Baca base URL dari `process.env.BACKEND_URL` (server-only, **bukan** `NEXT_PUBLIC_`).
  - Helper:
    - `getBerita()`, `getPengumuman({ beranda?: boolean })`, `getAgenda()`
    - `getGuru()`, `getFasilitas()`, `getGaleri()`, `getJadwal(jurusan)`
    - `postBK(payload)`, `postChat(payload)`
  - Semua return `{ data, error }` — **jangan** lempar error ke komponen.
  - Set timeout (5 detik) supaya build tidak hang.

- [ ] Update `.env.example` dan `.env.local`:
  ```env
  BACKEND_URL=http://localhost:8000
  NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
  ADMIN_ORIGIN=http://localhost:3001
  ```

- [ ] Tambahkan di `next.config.ts` (jika perlu) `images.remotePatterns` untuk backend upload host (mis. `localhost:8000` di dev).

---

### B2. Wire komponen beranda (Slice 2 lanjutan)

Target: **data dari backend** menggantikan array lokal. Komponen tetap sama visualnya.

#### B2.1 `components/beranda/BeritaTerkini.tsx`

- [ ] Terima props `berita: BeritaView[]` dari server component.
- [ ] `app/page.tsx` fetch `getBerita({ utama: false, limit: 2 })`.
- [ ] Ganti `window.location.href = "/kabar"` (F09) dengan `<Link href={`/berita/${slug}`}>` (setelah F06 Opsi A selesai).

#### B2.2 `components/beranda/PapanPengumuman.tsx`

- [ ] Fetch `getPengumuman({ beranda: true })`.
- [ ] Backend sudah mengirim `tampilBeranda` setelah Slice 2 (lihat `laporan inspeksi.md` G.1 B3).

#### B2.3 `components/beranda/AgendaKegiatan.tsx`

- [ ] Fetch `getAgenda()`, filter `tampilBeranda === true`.
- [ ] **Peta bulan Indonesia** di `lib/format.ts` — jangan tampilkan "DEC" dari backend.

---

### B3. Wire komponen profil & akademik

#### B3.1 `components/profil/DewanGuru.tsx`

- [ ] Fetch `getGuru()`.
- [ ] **Perbaiki filter** (F11):
  - Hanya render tombol kategori yang punya data.
  - Tambahkan `flex-wrap`.
- [ ] Mapper: `{ nama, jabatan, deskripsi, kategori, gambar, urutan }` → `{ name, title, desc, category, image, order }`.

#### B3.2 `components/profil/FasilitasKampus.tsx`

- [ ] Fetch `getFasilitas()`.
- [ ] Mapper: `{ judul, deskripsi, gambar }` → `{ title, desc, image }`.
- [ ] **Ganti `<img>` ke `next/image`** (F15).

#### B3.3 `components/kabar/GaleriVisual.tsx`

- [ ] Fetch `getGaleri()`.
- [ ] **Ini fix F10 (galeri broken)** — populate dari backend.
- [ ] Jika data kosong: empty state **"Belum ada dokumentasi"**.
- [ ] Batasi `grid-cols-1 md:grid-cols-2` saat <4 item, `md:grid-cols-4` saat >=4.

#### B3.4 `components/akademik/JadwalMatriks.tsx`

- [ ] Fetch `getJadwal(jurusan)`.
- [ ] Header kolom pakai `jam` dari backend, bukan hardcoded.
- [ ] Hapus label "Praktik Kejuruan" yang menempel di semua sel (lihat `report.md` §8).

---

### B4. Wire FormBK ke backend

#### B4.1 `components/akademik/FormBK.tsx`

- [ ] Ganti `alert(...)` dengan `postBK(payload)`.
- [ ] Tampilkan status inline: loading / sukses / gagal (**bukan** `alert`).
- [ ] Tambahkan `aria-live="polite"` untuk status sukses/gagal.
- [ ] Reset form **hanya jika sukses**.
- [ ] Field: `nama`, `kelas`, `no_hp`, `keperluan`, `pesan`.

#### B4.2 Buat proxy route `app/api/bk/route.ts`

- [ ] Terima POST dari client.
- [ ] Forward ke `${BACKEND_URL}/api/bk/index.php`.
- [ ] Return error/status apa adanya.
- [ ] **Jangan mark 200 kalau backend 5xx.**

**Alternatif:** Fetch langsung ke `BACKEND_URL` dari client.
- Perlu `NEXT_PUBLIC_BACKEND_URL` + CORS.
- Cek `backend/config/config.php` di `ALLOWED_ORIGINS` sudah memuat `http://localhost:3000`.

**Keputusan:** Pilih **proxy route** (lebih aman, tidak exposed backend URL ke client). Dokumentasikan di laporan.

---

### B5. Wire ChatbotWidget ke backend

> **Aset tersembunyi** (`laporan inspeksi.md` A9):
> Backend `api/chat/index.php` sudah matang — 3 provider, konteks sekolah (pengumuman + agenda terbaru), kontinuitas 10 pesan terakhir.

#### B5.1 `components/chatbot/ChatbotWidget.tsx`

- [ ] Ganti `setTimeout` simulasi dengan POST ke `/api/chat` (proxy route di main-web).
- [ ] Maintain `sessionId` (uuid di `localStorage`, kunci `smkn24-chat-session`).
- [ ] Kirim `{ sessionId, message }` dan render balasan.
- [ ] Tampilkan error eksplisit jika backend 5xx.
- [ ] Tambahkan typing indicator yang jujur (bukan timer palsu).

#### B5.2 Buat proxy route `app/api/chat/route.ts`

- [ ] Forward ke `${BACKEND_URL}/api/chat/index.php`.

> ⚠️ **Catatan:** Jangan lupa rate-limit di backend (B9) sebelum rilis publik. Karena belum ada, catat sebagai **risiko** di laporan.

---

## 6. Batasan & Larangan

| Kode | Larangan | Catatan |
|---|---|---|
| ❌ | Sentuh backend PHP untuk Jalur A/B | Kecuali bug blocking — laporkan, jangan perbaiki sendiri tanpa izin |
| ❌ | Sentuh `apps/admin` | Kecuali sinkronisasi `.env.example` (kecil) |
| ❌ | Tambah dependency baru tanpa alasan kuat | Pilih yang ringan, jelaskan di laporan |
| ❌ | Ubah token visual di `packages/shared/tokens.css` | Kecuali ada bug |
| ❌ | Pakai `window.alert` untuk feedback baru | UX buruk |
| ❌ | Pakai `<img>` untuk komponen baru | Gunakan `next/image` |
| ❌ | Commit `.env.local` atau file berisi secret | Keamanan |
| ❌ | Hapus file tanpa menjelaskan alasannya | Kecuali `dist/`, `FasilitasSekolah.tsx` (itu urusan P2, bukan Jalur A/B) |

---

## 7. Cara Kerja yang Diharapkan

### 7.1 Alur Kerja

```
1. git status → catat perubahan lokal
2. Baca semua dokumentasi di §2
3. Baca semua file target
4. Buat rencana kecil (checklist) → tuliskan di PLAN.md (jangan commit)
5. Kerjakan per-item Jalur A lalu Jalur B
6. Commit terpisah per item (lihat §7.2)
7. Verifikasi per commit: tsc → lint → build
8. Setelah semua selesai: jalankan uji end-to-end manual (§8)
```

### 7.2 Format Commit Message

Commit **terpisah** per item:

```
fix(main-web): F01 - splash tidak lagi menggerbang konten SSR
fix(main-web): F13 - muat Plus Jakarta Sans via next/font
feat(main-web): F06 - route /berita + /berita/[slug]
fix(main-web): F03 - hapus login publik palsu
fix(main-web): F02 - aktifkan type-check saat build + CI
feat(main-web): B1 - API client terpusat ke backend PHP
feat(main-web): B2 - wire beranda (berita/pengumuman/agenda)
feat(main-web): B3 - wire profil & akademik (guru/fasilitas/galeri/jadwal)
feat(main-web): B4 - FormBK tersambung ke backend
feat(main-web): B5 - ChatbotWidget tersambung ke backend
```

### 7.3 Aturan Commit

- ❌ Jika `tsc` / `lint` / `build` gagal → **jangan commit**; perbaiki dulu.
- ✅ Setiap commit harus lolos ketiga verifikasi tersebut.

---

## 8. Checklist Verifikasi Manual

Backend & frontend aktif bersamaan. Buka `http://localhost:3000`.

| # | Uji | Harapan |
|---|---|---|
| 1 | Buka `/` dengan JavaScript mati | Konten beranda terbaca (bukan putih) |
| 2 | View-source `http://localhost:3000` | Ada `<main>`, `<h1>`, teks berita |
| 3 | Dev tools → Network → reload | Font Plus Jakarta Sans ter-load; tidak ada ligature flash |
| 4 | Klik "Berita" di Navbar | `/berita` terbuka dengan daftar berita |
| 5 | Klik satu berita | `/berita/<slug>` terbuka detail lengkap |
| 6 | Klik "Login" di Navbar | Redirect ke `http://localhost:3001` |
| 7 | Isi FormBK → submit | `POST /api/bk` sukses → status "Berhasil" (bukan alert) → cek DB `pesan_bk` ada row baru |
| 8 | Buka Chatbot → kirim pesan | Balasan dari backend (bukan template statis) |
| 9 | `/profil` → filter kategori guru | Hanya kategori dengan data yang tampil; kosong → "Tidak ada data" |
| 10 | `/kabar` → galeri | Minimal 1 item dari DB; jika kosong → empty state jelas |
| 11 | Ubah pengumuman di admin (`localhost:3001`) → `tampilBeranda=1` → reload `localhost:3000` | Muncul di PapanPengumuman |
| 12 | `npx tsc --noEmit` | exit 0 |
| 13 | `npm run lint` | Tidak ada error baru |
| 14 | `npm run build` | Sukses, log tidak lagi "Skipping validation of types" |

---

## 9. Output yang Harus Kamu Berikan

Setelah selesai, buat file **`laporan jalur-a-b.md`** di root repo (bersanding dengan dokumentasi lain).

### 9.1 Struktur Laporan

| # | Bagian | Isi |
|---|---|---|
| 1 | **Ringkasan** | 1 paragraf: apa yang dikerjakan, status |
| 2 | **Tabel perubahan berkas** | Diubah/dihapus/ditambah per item |
| 3 | **Bukti F01 selesai** | Screenshot / potongan HTML hasil prerender |
| 4 | **Hasil checklist §8** | Centang ✅/❌ dengan catatan |
| 5 | **Keputusan yang diambil** | F06 (Opsi A atau B) dan B4 (proxy vs direct) + alasan |
| 6 | **Temuan baru** | Jika ada (kontrak backend, UI rusak setelah wire, dll.) |
| 7 | **Pertanyaan terbuka** | **Spesifik**, bukan "butuh klarifikasi" |
| 8 | **Langkah berikutnya** | Rekomendasi Jalur C (Slice 4-5) |

### 9.2 Update Dokumentasi Terkait

- [ ] Update `pemindahan konteks main-web.md` §7 (urutan tindak lanjut) — tandai item yang sudah selesai.
- [ ] Update `report.md` §11 (roadmap) — tandai P0 yang sudah dibereskan.

---

## 10. Gaya Komunikasi

| Prinsip | Penjelasan |
|---|---|
| **Bahasa Indonesia** | Ringkas, langsung, tanpa basa-basi |
| **Berbasis bukti** | Setiap klaim "selesai" disertai perintah + hasil |
| **Jangan menutupi kegagalan** | Jika `tsc` gagal dan tidak bisa diperbaiki, **laporkan**, jangan matikan flag lagi |
| **Bertanya, bukan menebak** | Untuk F06 dan B4 jika ambigu: buat pilihan rasional, jelaskan asumsi, **lanjut kerja** |
| **Jangan menunggu jawaban** | Pemilik tidak selalu online; teruskan pekerjaan dengan asumsi rasional |

---

## Mulai dari §2

> **Selamat bekerja. Targetkan selesai dalam 1-2 sesi kerja terfokus.**

---

*Dokumen ini bersifat self-contained. Segala referensi ke `report.md`, `laporan inspeksi.md`, dll. adalah untuk memperdalam konteks — bukan pengganti dokumentasi utama tersebut.*

**End of prompt file.**