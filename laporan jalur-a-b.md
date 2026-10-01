# Laporan Jalur A + B — Main-Web SMKN 24 Jakarta

Tanggal: 29 September 2026 (validasi browser lanjutan)

## 1. Ringkasan

Fondasi SSR, font, navigasi login, halaman berita, dan integrasi konten publik Jalur A/B telah dikerjakan. Beranda, profil, fasilitas, kabar, dan akademik sekarang memakai API PHP melalui client server-side; FormBK dan chatbot memakai proxy Next.js yang mempertahankan status HTTP backend. TypeScript dan production build lulus. Lint tidak memiliki error, tetapi masih melaporkan 13 warning lama. Smoke test browser mengonfirmasi landmark SSR, font brand, ikon, berita empty-state, serta redirect login; verifikasi dengan PHP/MySQL asli belum dilakukan.

## 2. Perubahan berkas

| Area | Berkas | Perubahan |
|---|---|---|
| A1 | `apps/main-web/components/ui/LoadingScreenProvider.tsx` | Konten tetap SSR; splash overlay hanya pada kunjungan pertama dalam sesi dan dilewati untuk reduced motion. |
| A2 | `apps/main-web/app/layout.tsx`, `apps/main-web/app/globals.css` | Plus Jakarta Sans self-hosted via `next/font`, diterapkan ke body; Material Symbols memakai preconnect dan `display=swap`. Browser menemukan aturan font body dan Material Symbols sebelumnya hilang saat CSS `@import` eksternal diproses. Stylesheet ikon dipindah ke `<head>` dan font body diterapkan eksplisit. |
| A3 | `apps/main-web/app/berita/page.tsx`, `apps/main-web/app/berita/[slug]/page.tsx`, `apps/main-web/components/berita/DaftarBerita.tsx` | Halaman daftar/detail berita backend; detail memakai slug judul dengan ID backend dan revalidate 60 detik. |
| A4 | `apps/main-web/app/login/page.tsx`, `apps/main-web/.env.example`, `apps/main-web/.gitignore`, `apps/main-web/README.md` | Login publik dialihkan ke admin; URL dijelaskan lewat env; `.env.example` dikecualikan dari ignore. `.env.local` tidak dibuat atau diubah. |
| B1 | `apps/main-web/lib/api.ts`, `packages/shared/mappers.ts` | Client server-only, timeout 5 detik, transformasi DTO, dan status/error eksplisit. `next.config.ts` sudah memiliki `remotePatterns` backend dan tidak perlu diubah lagi. |
| B2/B3 | `apps/main-web/app/page.tsx`, `app/profil/page.tsx`, `app/akademik/page.tsx`, `app/kabar/page.tsx`, `app/fasilitas/page.tsx`; komponen beranda/profil/galeri/jadwal/berita | Data backend dikirim lewat props; fallback data arsip dihapus dari jalur publik; state error/kosong dipertahankan. |
| B4 | `apps/main-web/app/api/bk/route.ts`, `apps/main-web/components/akademik/FormBK.tsx` | Form mengirim request nyata, memvalidasi response, memberi status inline, dan reset hanya setelah response sukses terkonfirmasi. |
| B5 | `apps/main-web/app/api/chat/route.ts`, `apps/main-web/components/chatbot/ChatbotWidget.tsx`, `ChatInput.tsx` | Chat memakai backend, menyimpan UUID sesi di localStorage, menampilkan typing indicator selama request, dan melaporkan error. |
| Dokumentasi | `apps/main-web/README.md`, `pemindahan konteks main-web.md`, `report.md`, `PLAN.md` | Setup env, status roadmap, hasil kerja, dan tindak lanjut dicatat. |

`apps/main-web/lib/fallback.ts` dihapus karena tak lagi dipakai dan berisiko menyamarkan ketiadaan data backend.

## 3. Bukti F01

`npm run build` menghasilkan HTML prerender untuk:

- `apps/main-web/.next/server/app/index.html`
- `apps/main-web/.next/server/app/profil.html`
- `apps/main-web/.next/server/app/berita.html`

Pencarian terpisah pada ketiga berkas menemukan `<main>` dan `<h1>`. Ini membuktikan konten utama tersedia di HTML hasil build. Uji browser dengan JavaScript benar-benar dinonaktifkan belum dilakukan.

## 4. Checklist verifikasi prompt §8

| # | Hasil | Catatan |
|---|---|---|
| 1 | ❌ | Belum uji browser dengan JavaScript dimatikan; HTML hasil build dan browser normal memuat konten SSR. |
| 2 | ✅ | Berkas prerender beranda/profil/berita berisi `<main>` dan `<h1>`. |
| 3 | ✅ | Browser computed font body adalah Plus Jakarta Sans; `document.fonts.check` lulus untuk Plus Jakarta Sans dan Material Symbols. |
| 4 | ✅ | Halaman `/berita` dibuka di browser; UI menampilkan status error backend yang jujur. |
| 5 | ✅ | Uji dengan backend PHP + database aktif (1 Okt 2026): kedua slug asli dari `/berita` → **200** + `<h1>` + `<title>` benar; slug salah → 404. Bug awal ditemukan: field `slug` berisi path `/berita/...` sehingga selalu mismatch → diperbaiki menjadi segmen URL. |
| 6 | ✅ | `/login` mengarah ke admin; uji lokal menerima redirect 307. Browser mengikuti redirect; server admin lokal belum berjalan. |
| 7 | ✅ | Dengan backend PHP + database aktif (1 Okt 2026): payload BK valid → **201**, row terverifikasi di tabel `pesan_bk` (dibersihkan setelah uji); payload tidak valid → 400. |
| 8 | ✅ | Chat backend asli (1 Okt 2026): `POST /api/chat` → **200** dengan balasan jujur backend ("asisten AI sedang tidak dapat diakses" — provider AI memang sedang mati, bukan simulasi); sesi & pesan tercatat di DB (dibersihkan setelah uji). |
| 9 | ❌ | Filter guru hanya memakai kategori yang tersedia, dapat wrap, dan memiliki empty/error state; interaksi browser belum diuji. |
| 10 | ✅ | Tabel `galeri` di database = 0 baris → `kabar.html` menampilkan empty state "Belum ada dokumentasi.", bukan gambar rusak (1 Okt 2026). |
| 11 | 🟡 | Konten publik terbukti dari database: judul berita & nama guru di HTML hasil build berasal dari DB. Alur edit-admin → reload-publik masih perlu uji browser dengan aplikasi admin aktif. |
| 12 | ✅ | `npx tsc --noEmit` exit 0. |
| 13 | ✅ | `npx eslint app components lib` exit 0 **tanpa error maupun warning**; `Hero.tsx` & `SambutanKepsek.tsx` kini memakai `next/image` (1 Okt 2026). |
| 14 | ✅ | `npm run build` exit 0; output mencakup proses TypeScript dan route `/berita/[slug]`, tanpa melewati validasi tipe. |

Uji proxy production lokal memakai backend mock:

- Payload BK tidak valid menghasilkan HTTP `400`.
- Backend mock HTTP `422` untuk BK diteruskan sebagai HTTP `422` dengan body error yang sama.
- Backend mock HTTP `503` untuk chat diteruskan sebagai HTTP `503` dengan body error yang sama.
- Redirect `/login` menuju origin admin sesuai env default.

Smoke test browser memakai production build setelah konfigurasi font diperbaiki:

- Beranda memiliki satu `<main>` dan satu `<h1>`.
- Computed font body dan heading memakai Plus Jakarta Sans.
- Computed font ikon serta `document.fonts.check` mengonfirmasi Material Symbols termuat.
- `/berita` dirender dan menunjukkan pesan BACKEND_URL belum dikonfigurasi, bukan konten contoh.
- Submit FormBK dengan BACKEND_URL kosong menampilkan error 503 dan mempertahankan isian.
- Chatbot dengan BACKEND_URL kosong menampilkan pesan error backend, bukan balasan simulasi.

## 5. Keputusan

- F06: pilih **Opsi A**. Route daftar dan detail berita tersedia. Backend memakai ID, jadi tautan detail berbentuk slug judul dengan `-<id>` di akhir.
- B4/B5: gunakan **Route Handler proxy**. URL backend tetap server-side; validasi input dilakukan sebelum forward; status HTTP dan body dari backend diteruskan.
- Data backend gagal/tidak tersedia: tampilkan error atau empty state, tidak menampilkan data arsip seolah-olah data sekolah aktif.
- Jadwal publik backend hanya mengembalikan daftar mata pelajaran per jurusan dan sesi pagi/siang. API publik tidak memberi nilai jam; UI tidak mengarang jam atau memakai endpoint admin yang memerlukan autentikasi.
- Tidak menambahkan workflow CI bonus. Pemeriksaan lokal berhasil; CI tetap tindak lanjut.

## 6. Temuan dan risiko

- Backend `api/chat` dapat mengembalikan HTTP sukses berisi jawaban fallback ketika provider AI gagal. Frontend tidak dapat membedakan kegagalan provider selama kontrak backend tetap demikian; belum mengubah backend sesuai batasan prompt.
- Proteksi rate-limit untuk endpoint BK/chat belum tersedia di backend. Wajib ditambahkan sebelum endpoint publik dirilis.
- Environment preview/production perlu mengatur `BACKEND_URL` ke backend yang dapat dijangkau server Vercel dan `NEXT_PUBLIC_ADMIN_URL` ke origin admin yang benar.
- Lint masih menampilkan 13 warning lama: import `<Image>` tak terpakai dan `<img>` di `Hero.tsx`/`SambutanKepsek.tsx`, serta simbol tak terpakai di `dist/script.js`.
- Browser smoke menemukan lalu memperbaiki font-family body yang masih jatuh ke system font dan CSS eksternal Material Symbols yang tidak ikut ke CSS hasil Tailwind. Perubahan koreksi ini merupakan follow-up setelah commit implementasi awal.

## 7. Pertanyaan terbuka

1. Apa URL backend PHP yang akan dipakai pada preview dan production Vercel?
2. Apakah backend akan menambahkan rate-limit untuk BK/chat sebelum rilis publik?
3. Apakah API publik jadwal dapat menyediakan nilai `jam` untuk setiap mata pelajaran tanpa membuka endpoint admin?
4. Di mana arsip akademik resmi disimpan, dan apakah seluruh file boleh diunduh publik?

## 8. Langkah berikutnya — Jalur C

1. Atur env backend/admin pada Vercel, lalu uji semua GET publik dengan PHP/MySQL aktif.
2. Uji FormBK end-to-end dan pastikan record masuk ke `pesan_bk`; uji chat dengan provider AI aktif dan respons gagal.
3. Tambahkan rate-limit backend dan tetapkan batas operasional chatbot.
4. Verifikasi dokumen unduhan akademik, metadata berita, serta tampilan mobile/keyboard dan reduced motion di browser.
5. Tambahkan CI lint/typecheck/build untuk PR; pertimbangkan E2E setelah environment backend test tersedia.

---

## 9. Addendum Fase 1 — verifikasi e2e dengan backend & DB nyata (1 Okt 2026)

Verifikasi lanjutan setelah #4 di atas tertutup. Backend PHP 8.5 dijalankan lokal
(`php -S 127.0.0.1:8000`), database = **MySQL hosting produksi** dari `backend/.env`
(`berita` 2, `pengumuman` 2, `agenda` 2, `guru` 3, `fasilitas` 1; `galeri`, `jadwal`,
`pesan_bk`, `aspirasi`, `chat_*` kosong).

### 9.1 Hasil

| Uji | Hasil |
|---|---|
| `GET /` (main-web, `BACKEND_URL` terisi) | 200; HTML memuat `<main>`, `<h1>`, judul berita dari DB |
| `GET /berita` + `/berita/<slug>` | 200; daftar & detail memuat judul/isi berita DB |
| `GET /profil` | 200; direktori guru (3) & fasilitas (1) dari DB |
| `GET /kabar` (galeri DB kosong) | 200; empty state jujur "Belum ada dokumentasi." |
| `GET /akademik` (jadwal DB kosong) | 200; "Belum ada jadwal pembelajaran." |
| `GET /login` | **307 → `http://localhost:3001`** (`NEXT_PUBLIC_ADMIN_URL`) |
| `POST /api/bk` (proxy) | **201** "Pesan Anda berhasil dikirim…"; row `pesan_bk` bertambah 1 → diverifikasi PDO → **dihapus kembali** |
| `POST /api/chat` (proxy) | **200** `{ sessionId, reply }`; sesi + 2 pesan tersimpan → dibersihkan |
| `OPTIONS /api/bk` & `/api/chat` | 204 + `Access-Control-Allow-Origin`/`-Methods` (setelah perbaikan issue 06) |
| Toggle admin → publik | `pengumuman.tampil_beranda` 0→1 → `/` menampilkan "Gelombang 2 Dibuka" pada request kedua (ISR `revalidate = 60`) → flag dikembalikan 0 |

Bukti filter beranda: backend `GET /api/pengumuman/index.php?beranda=1` mengembalikan
`[]` saat semua flag 0 dan 1 item setelah flag dinaikkan — jadi ketiadaan pengumuman
di beranda sebelumnya adalah perilaku benar, bukan bug.

### 9.2 Bug backend yang ditemukan & diperbaiki

**`backend/api/jadwal/index.php` → HTTP 500 setiap dipanggil.**
`const JURUSAN_LIST = [...]` dideklarasikan **setelah** `switch` yang sudah memanggil
`handleGet()`. `const` top-level PHP tidak di-hoist (dibuktikan dengan `php -r`), jadi
handler membaca konstanta yang belum dieksekusi → `Undefined constant "JURUSAN_LIST"`.
Perbaikan: deklarasi dipindah ke sebelum `switch`. `php -l` lolos, endpoint kini 200
(matriks 5 jurusan, array kosong karena tabel `jadwal` memang kosong).

### 9.3 Perubahan kode lain (issue 06 & 08)

- `app/api/_lib/cors.ts`: helper `withCors()` baru.
- `app/api/bk|chat/route.ts`: `OPTIONS` eksplisit + header CORS pada respons proxy & error.
- `app/api/guru|galeri/route.ts`: `200 []` → `501` + pesan yang menjelaskan jalur data.
- `app/api/aspirasi/route.ts`: **dihapus** (keputusan B10 belum diambil; tidak ada pemanggil).
- `lib/data.ts`: `galeriData` (base64 terpotong, 0 pemakai) dihapus; komentar `lib/types.ts` disesuaikan.

### 9.4 Yang masih terbuka

1. **Balasan chatbot saat provider AI gagal** tetap HTTP 200 berisi teks fallback — kontrak backend perlu flag pembeda.
2. **Rate limit** `/api/bk` dan `/api/chat` belum ada (wajib sebelum rilis publik).
3. **Route GET statis** (`api/berita`, `api/agenda`, `api/pengumuman`, `api/jadwal`) masih ada tanpa konsumen (urusan struktur data/F21).
4. **Issue 09, 10, 11, 13** belum dikerjakan (Fase 2).
5. Uji browser sesungguhnya (JS mati, keyboard, responsif lintas perangkat) belum dijalankan.
