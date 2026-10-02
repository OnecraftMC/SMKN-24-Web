# Matriks Paritas — `penggabungan monorepo/`

Dokumen ini mencatat setiap sumber → tujuan → status pada salinan aplikasi
tergabung. Sumber: `apps/main-web`, `apps/admin`, `packages/shared`, `backend`
di repository monorepo. **Tidak ada file sumber yang diubah** — semua isi di
folder ini adalah salinan yang disesuaikan agar menjadi satu project mandiri.

Legenda status: **P** = dipertahankan utuh · **D** = dipindahkan/diubah lokasi
karena penataan ulang rute · **A** = disesuaikan (kontrak identik, isinya
disesuaikan) · **G** = gap backend (belum didukung sumber data) · **X** = sengaja
tidak disalin (dengan alasan).

---

## 1. Website publik

| Sumber | Tujuan | Komponen/data/API | Status | Cara verifikasi |
|---|---|---|---|---|
| `apps/main-web/app/page.tsx` | `app/(public)/page.tsx` | `getBerita/getPengumuman/getAgenda` → `lib/api.ts` → PHP | P | `GET /` 200, judul berita dari DB |
| `apps/main-web/app/profil/page.tsx` | `app/(public)/profil/page.tsx` | `getGuru`, `getFasilitas` | P | `GET /profil` 200 |
| `apps/main-web/app/akademik/page.tsx` | `app/(public)/akademik/page.tsx` | `getJadwal` (matriks backend), `FormBK` | P | `GET /akademik` 200 |
| `apps/main-web/app/kabar/page.tsx` | `app/(public)/kabar/page.tsx` | `getBerita`, `getGaleri`, `FormAspirasi` (mailto) | P | `GET /kabar` 200; galeri 0 → empty state |
| `apps/main-web/app/fasilitas/page.tsx` | `app/(public)/fasilitas/page.tsx` | `getFasilitas` | P | `GET /fasilitas` 200 |
| `apps/main-web/app/berita/page.tsx` | `app/(public)/berita/page.tsx` | `getBerita`, `revalidate=60` | P | `GET /berita` 200 |
| `apps/main-web/app/berita/[slug]/page.tsx` | `app/(public)/berita/[slug]/page.tsx` | `getBeritaById`, `notFound()`, `generateMetadata` | P | `GET /berita/<slug-valid>` 200, slug salah 404 |
| `apps/main-web/app/jurusan/page.tsx` | `app/(public)/jurusan/page.tsx` | `jurusanData` (5 kartu, lokal) | P | `GET /jurusan` 200 |
| `apps/main-web/app/jurusan/[key]/page.tsx` | `app/(public)/jurusan/[key]/page.tsx` | `generateStaticParams` + `notFound()` | P | 5 URL SSG; key salah 404 |
| `apps/main-web/app/login/page.tsx` (redirect) | diganti `app/(admin)/login/page.tsx` | redirect cross-origin → **UI login** | D | `GET /login` → halaman login, bukan 307 |
| `apps/main-web/app/layout.tsx` | `app/layout.tsx` + `app/(public)/layout.tsx` | font, ikon, Navbar, Footer, Chatbot, splash | D | lihat §2 |
| `globals.css` kedua app + `packages/shared/tokens.css` | `app/globals.css` + `styles/tokens.css` | token visual jadi satu sumber | A | `@theme inline` ada, `--color-*` dipakai |
| `apps/main-web/components/**` | `components/**` (tanpa `components/admin`) | seluruh komponen publik | P | lint + build |
| `apps/main-web/lib/api.ts` | `lib/api.ts` | client server-only + **`proxyPublicGet` baru** | A | `GET /api/berita` mengembalikan data PHP |
| `apps/main-web/lib/data.ts` | `lib/data.ts` | masih sumber `jurusanData`/`JADWAL_DATA` | A | halaman `/jurusan*` ter-render |
| `apps/main-web/lib/types.ts` | `lib/types.ts` | tipe presentasional publik + `Jurusan` | P | `tsc --noEmit` 0 |
| `apps/main-web/lib/hooks/useScrollReveal.ts` | `lib/hooks/useScrollReveal.ts` | reveal on scroll | P | lint |
| `apps/main-web/public/**` | `public/**` | logo, ikon, `images/kepsek.jpg` | P | `GET /images/kepsek.jpg` 200 |
| `apps/main-web/app/favicon.ico` | `app/favicon.ico` | favicon | P | `GET /favicon.ico` 200 |
| `app/api/_lib/cors.ts` | `app/api/_lib/cors.ts` | wildcard `*` **dihapus** | A | CORS hanya bila `ADMIN_ORIGIN` diisi |
| `app/api/bk/route.ts` | `app/api/bk/route.ts` | proxy POST → `api/bk/index.php` | P | invalid → 400, valid → 201 |
| `app/api/chat/route.ts` | `app/api/chat/route.ts` | proxy POST → `api/chat/index.php` | P | POST → 200 `{sessionId,reply}` |
| `app/api/berita/route.ts` | `app/api/berita/route.ts` | **`lib/data.ts` → proxy PHP nyata** | A | `GET /api/berita` berisi baris DB |
| `app/api/pengumuman/route.ts` | `app/api/pengumuman/route.ts` | sama, `?beranda=1` diteruskan | A | `GET /api/pengumuman?beranda=1` |
| `app/api/agenda/route.ts` | `app/api/agenda/route.ts` | sama | A | `GET /api/agenda` |
| `app/api/jadwal/route.ts` | `app/api/jadwal/route.ts` | sama, `?jurusan=` diteruskan | A | `GET /api/jadwal?jurusan=pplg` |
| `app/api/guru/route.ts` · `app/api/galeri/route.ts` | identik | 501 jujur (bukan `200 []`) | P | `GET /api/guru` → 501 |
| `apps/main-web/.env.example` | diganti `.env.example` gabungan | lihat `.env.example` | A | dokumentasi variabel |
| `apps/main-web/dist/*`; `components/berita/page.tsx` (0 B); `components/profil/FasilitasSekolah.tsx` (0 B) | — | file mati | X | §6 |
| `app/api/aspirasi/route.ts` | — | sudah dihapus di sumber (issue 06) | X | — |


---

## 2. Root layout dan pemisahan kerangka

| Sumber | Tujuan | Status |
|---|---|---|
| `apps/main-web/app/layout.tsx` (html/body/font/Navbar/Footer/Chatbot) | `app/layout.tsx` (html/body/font saja) + `app/(public)/layout.tsx` (Navbar/Footer/Chatbot/splash) | D |
| `apps/admin/app/layout.tsx` (html/body/`AuthProvider`) | `app/(admin)/layout.tsx` (hanya `AuthProvider` + metadata noindex) | D |

App Router hanya mengizinkan satu root layout. Route group `(public)` dan
`(admin)` tidak menambah segmen URL: `/login` tetap `/login`,
`app/(admin)/admin/*` → `/admin/*`, publik tetap di URL lama. Kerangka publik
(Navbar/Footer/Chatbot/splash) **tidak** muncul di `/login` maupun `/admin/*`.

Perubahan perilaku yang disengaja:

| Titik | Sumber | Gabungan |
|---|---|---|
| Login Navbar/MobileMenu | `http://localhost:3001` (env `NEXT_PUBLIC_ADMIN_URL`) | `/login` same-origin (env tetap didukung) |
| `router.replace` setelah login | `/` (overview admin) | `/admin` |
| Sidebar Overview / Brand | `/` | `/admin` |
| "Kembali ke situs utama" | `NEXT_PUBLIC_MAIN_WEB_URL ?? http://localhost:3000` | `NEXT_PUBLIC_MAIN_WEB_URL ?? /` |

---

## 3. Dashboard admin

| Sumber | Tujuan | Status | Cara verifikasi |
|---|---|---|---|
| `apps/admin/app/(dashboard)/page.tsx` | `app/(admin)/admin/page.tsx` | D | `GET /admin` shell overview |
| `.../berita/{page,BeritaDialog}.tsx` | `app/(admin)/admin/berita/*` | D | CRUD + filter + highlight |
| `.../pengumuman/{page,PengumumanDialog}.tsx` | `app/(admin)/admin/pengumuman/*` | D | CRUD + toggle beranda |
| `.../agenda/{page,AgendaDialog}.tsx` | `app/(admin)/admin/agenda/*` | D | CRUD + validasi rentang |
| `.../guru/{page,GuruDialog}.tsx` | `app/(admin)/admin/guru/*` | D | CRUD + urutan |
| `.../fasilitas/{page,FasilitasDialog}.tsx` | `app/(admin)/admin/fasilitas/*` | D | CRUD + upload |
| `.../galeri/{page,GaleriDialog}.tsx` | `app/(admin)/admin/galeri/*` | D | CRUD + upload |
| `.../jadwal/{page,JadwalSlotDialog}.tsx` | `app/(admin)/admin/jadwal/*` | D | tambah/hapus slot |
| `.../(dashboard)/layout.tsx` (guard + shell) | `app/(admin)/admin/layout.tsx` | D | tanpa token → redirect `/login` |
| `apps/admin/app/login/page.tsx` | `app/(admin)/login/page.tsx` | D + A | login valid → `/admin` |
| `components/shell/Sidebar.tsx` | `components/admin/shell/Sidebar.tsx` | D + A (href `/admin`) | menu Overview → `/admin` |
| `components/shell/Topbar.tsx` | `components/admin/shell/Topbar.tsx` | D | logout → `/login` |
| `components/ui/{FormBits,ImageField}.tsx` | `components/admin/ui/*` | D | dialog CRUD |
| `apps/admin/lib/api.ts` | `lib/admin/api.ts` | D + A (`API_ORIGIN` dukung path relatif same-origin) | preview upload tampil |
| `apps/admin/lib/{auth.tsx,types.ts,format.ts,upload.ts}` | `lib/admin/*` | D | `tsc` 0, tanggal Indonesia |
| `apps/admin/public/logo-smkn24.png` | `public/logo-smkn24.png` | P | logo sidebar/login |

---

## 4. Backend PHP

| Sumber | Tujuan | Status | Catatan |
|---|---|---|---|
| `backend/api/**` (14 file) | `backend/api/**` | P | kontrak identik: method, status, body |
| `backend/helpers/**`, `backend/config/**` | identik | P | `jwt.php`, `upload.php`, `cors.php`, `response.php`, `database.php`, `env.php` |
| `backend/bootstrap.php`, `.htaccess` ×5 | identik | P | akses `.env`/`.sql` ditolak, `tools/` tidak bisa dibuka browser |
| `backend/database.sql` | identik | P | tanpa seed akun admin (`database.sql:18-26`) |
| `backend/tools/*.php` | identik | P | CLI only |
| `backend/uploads/.htaccess`, `.gitkeep` | identik | P | upload tidak dieksekusi sebagai PHP (Apache) |
| `backend/uploads/84f837e9….jpg` | tidak disalin | X | file upload runtime, bukan source |
| `backend/.env` (milik sumber) | tidak disalin | X | rahasia — hanya `.env.example` |
| `backend/.env.example` | `backend/.env.example` | P | tanpa nilai secret |

---

## 5. Kontrak API/backend yang dipertahankan

| Titik | Perilaku |
|---|---|
| `POST /api/auth/login.php` | `{username,password}` → 200 `{token,user}` / 401 |
| `GET /api/auth/me.php` | Bearer → 200 profil / 401 |
| CRUD konten (berita/pengumuman/agenda/guru/fasilitas/galeri/jadwal) | tulis butuh Bearer; baca publik tanpa token |
| `POST /api/bk` · `POST /api/chat` | publik; status + body dilewatkan apa adanya (201 / 200) |
| `POST /api/upload.php` | multipart field `gambar`, butuh Bearer |
| Status/error | proxy Next mempertahankan status HTTP + body backend |
| Detail exception | hanya ke `error_log`; klien menerima pesan umum |

---

## 6. Sengaja tidak disalin

| Item | Alasan |
|---|---|
| `apps/main-web/dist/{Topbar.jsx,script.js,styles.css}` | sisa website statis lama; sumber-satunya 9 warning lint |
| `components/berita/page.tsx`, `components/profil/FasilitasSekolah.tsx` | 0 byte, tidak di-import siapa pun |
| `.next`, `node_modules`, `tsconfig.tsbuildinfo`, `next-env.d.ts` | artefak build/dev |
| `apps/main-web/.npmrc` (`dangerously-allow-all-scripts=true`) | tidak membawa konfigurasi berisiko ke target |
| `@supabase/supabase-js` | dependency mati, tidak pernah di-import |
| `backend/.env`, `backend/uploads/*.jpg` | rahasia / data runtime |
| `.git`, `laporan/`, `github-issues/`, `PLAN.md`, `template and promt/` | dokumentasi sumber, bukan bagian deliverable |

---

## 7. Gap yang dilaporkan, bukan ditutupi

1. **Foto kegiatan jurusan** belum ada (`public/images/jurusan/<key>.jpg`) — fallback token dipertahankan seperti sumber.
2. **Arsip "Unduh"** menghasilkan blob `.txt`, bukan PDF resmi — tidak dibuatkan dokumen palsu.
3. **Angka `QuickHighlights`** ("1.000+", "52 Guru", "100% Tersertifikasi", "100+ Juara") belum terverifikasi — dipertahankan apa adanya.
4. **CTA "Kirim Karya/Prestasi"** tetap `mailto:` — tidak dipetakan ke tabel manapun karena backend tidak punya resource-nya.
5. **Tidak ada `not-found.tsx`/`error.tsx`/`loading.tsx`** — sama dengan sumber.
6. **Tanpa rate limit** pada `/api/chat`, `/api/bk`, dan login — sama dengan sumber.
7. **Tidak ada CI/test** — sama dengan sumber.
8. **Modul admin yang belum ada UI** — lihat §3; tautan sidebar sengaja tetap nonaktif, tidak dibuatkan halaman palsu.
9. **`.htaccess` hanya berlaku di Apache/LiteSpeed.** Saat smoke test memakai `php -S` (PHP built-in server) file `.htaccess` diabaikan, sehingga `GET /backend/.env` dan `GET /backend/database.sql` masih bisa diunduh. Di Hostinger (Apache/LiteSpeed) aturan tersebut aktif — **tetap wajib diuji ulang setelah deploy** dengan `curl -I https://domain-anda.id/backend/.env` (harus 403) dan `curl -I .../backend/database.sql` (harus 403). Jangan menganggap lockdown sudah terbukti di lingkungan lokal.
10. **`localhost` vs `127.0.0.1` saat development di Windows.** `localhost`
    sering resolve ke `::1` (IPv6), sedangkan `php -S 127.0.0.1:8000` hanya
    listen di IPv4. Akibatnya semua proxy `/api/*` membalas **404 berisi
    halaman error PHP** (`The requested resource … was not found`) — gejalanya
    mirip route hilang, padahal route-nya ada. Karena itu gunakan
    `http://127.0.0.1:8000/backend` di `BACKEND_URL` (sudah ditulis di
    `.env.example` dan README §5). Tidak berpengaruh di produksi (https).

### Modul yang BELUM ada UI (jangan diklaim sudah ada)

| Modul | Sidebar | Backend | Status |
|---|---|---|---|
| Pusat Arsip | `ready:false`, tautan mati | tidak ada tabel/endpoint | G |
| Inbox BK | `ready:false`, tautan mati | `GET/PUT/DELETE /api/bk` siap (auth) | G (UI), backend OK |
| Aspirasi | `ready:false`, tautan mati | `GET/PUT/DELETE /api/aspirasi` siap (auth); tidak ada pemanggil publik — CTA `/kabar` memang `mailto:` | G |
| Pengajuan Prestasi | `ready:false`, tautan mati | tidak ada resource | G |
| Riwayat Chatbot | `ready:false`, tautan mati | `GET /api/chat/history.php` siap (auth) | G (UI), backend OK |
| Profil & Sesi | `ready:false`, tautan mati | tidak ada endpoint ganti password | G |

---

## 8. Hasil validasi aktual (tanggal 2 Oktober 2026)

Semua perintah dijalankan di dalam `penggabungan monorepo/` pada Windows, Node
v24.20.0, PHP 8.5.10, dengan `node_modules` hasil `npm install`.

### 8.1 Validasi build (lulus)

| Perintah | Hasil |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | **exit 0** — 0 error |
| `npm run lint` (`eslint`) | **exit 0** — 0 error, 0 warning |
| `npm run build` (`next build`, Turbopack) | **exit 0** — 32 route ter-render |

Route yang di-build: `/`, `/_not-found`, `/login`, `/profil`, `/akademik`,
`/kabar`, `/fasilitas`, `/berita`, `/berita/[slug]`, `/jurusan`,
`/jurusan/[key]` (5 SSG: perhotelan, boga, busana, pplg, pariwisata), `/admin`
+ 7 modul CRUD, serta 8 route `/api/*`.

### 8.2 Smoke test HTTP (server produksi + PHP built-in)

Lingkungan: `next start -p 3101` dengan `BACKEND_URL=http://127.0.0.1:8000/backend`,
dan `php -S 127.0.0.1:8000 -t .` dari root folder target.

| Uji | Hasil |
|---|---|
| 12 route publik + `/login` + `/admin` + 2 modul | 200 |
| `/jurusan/tkj` (key salah), `/berita/tidak-ada-xyz` | 404 |
| `/api/berita`, `/api/pengumuman`, `/api/agenda`, `/api/jadwal` | 200 + baris DB asli |
| `/api/guru`, `/api/galeri` | 501 (sengaja — lihat §1) |
| `POST /api/auth/login.php` password salah | 401 `{"error":"Username atau password salah."}` |
| `GET /api/auth/me.php` tanpa token | 401 |
| `GET /api/auth/me.php` dengan token valid | 200 profil admin |
| `POST/PUT` berita tanpa token / token palsu | 401 (keduanya ditolak) |
| `POST /api/upload.php` tanpa token | 401 |
| CRUD agenda: create → read → update → delete | 201 / 200 / 200 / 200 |
| Validasi rentang tanggal salah | 400 `Tanggal selesai tidak boleh mendahului tanggal mulai` |
| Hapus dua kali | 200 lalu 404 |
| Upload multipart field `gambar` | 200 `{"url":"/backend/uploads/<hash>.jpg"}`, aset ter-serve `image/jpeg` 200 |
| `/admin` tanpa token | hanya shell "Memeriksa sesi admin…" — tidak ada data dashboard |
| `/login` tanpa token | hanya shell "Memeriksa sesi…" |

> Catatan: satu baris agenda uji dibuat lalu dihapus kembali pada database
> Hostinger (`id=3`, judul `SMOKE TEST AGENDA`) — database kembali ke kondisi
> awal. File hasil upload uji ikut dihapus dari `backend/uploads/`.

### 8.3 Kebocoran rahasia yang ditemukan dan sudah ditutup

`backend/.env` **terdapat** di folder target berisi kredensial database
Hostinger asli (`DB_PASS` terisi) — bertentangan dengan §4 yang menyatakan
"tidak disalin". Berkas tersebut **sudah dihapus**; hanya `.env.example` yang
tersisa. `backend/README.md` memuat nama DB/user (tanpa password) — identik
dengan berkas sumber, tidak diubah.

### 8.4 Artefak yang dibersihkan dari folder target

`node_modules/`, `.next/`, `tsconfig.tsbuildinfo`, `next-env.d.ts`, `.env.local`,
`backend/.env`, `backend/uploads/*.jpg`, serta seluruh `*.log`/`*.tmp` hasil
smoke test. Folder target sekarang berisi **143 file / 1,07 MB** dan tidak
punya `.git`, `node_modules`, `.next`, atau `.env`.

### 8.5 Yang belum terverifikasi

- Deploy nyata ke Hostinger **belum** dilakukan — tidak ada klaim production.
- Proteksi `.htaccess` hanya bisa dibuktikan di Apache/LiteSpeed (lihat §7 butir 9).
- Perilaku chatbot (`/api/chat`) dan form BK (`/api/bk`) belum diuji end-to-end
  karena butuh `AI_PROVIDER` + key AI yang tidak ada di folder target.
- `@media` viewport mobile/desktop belum diperiksa — tidak ada browser
  automation di lingkungan ini.