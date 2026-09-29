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
| 5 | ❌ | Route `/berita/[slug]` tersedia; fetch detail dengan data PHP aktif belum diuji. |
| 6 | ✅ | `/login` mengarah ke admin; uji lokal menerima redirect 307. Browser mengikuti redirect; server admin lokal belum berjalan. |
| 7 | ❌ | DB PHP tidak aktif untuk sesi ini. Request BK tervalidasi `400`; uji backend mock membuktikan HTTP `422` diteruskan, tetapi simpan row belum diverifikasi. |
| 8 | ❌ | Chatbot meneruskan HTTP `503` mock secara utuh; jawaban AI dari backend asli belum diuji. |
| 9 | ❌ | Filter guru hanya memakai kategori yang tersedia, dapat wrap, dan memiliki empty/error state; interaksi browser belum diuji. |
| 10 | ❌ | Galeri memakai data API dan placeholder ikon untuk gambar yang kosong; data galeri langsung dari DB belum diverifikasi. |
| 11 | ❌ | Perubahan dari dashboard admin ke konten publik perlu backend hidup dan belum diuji. |
| 12 | ✅ | `npx tsc --noEmit` exit 0. |
| 13 | ✅ | `npm run lint` exit 0; 13 warning yang tersisa berasal dari `Hero.tsx`, `SambutanKepsek.tsx`, dan `dist/script.js`. Tidak ada error lint. |
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
