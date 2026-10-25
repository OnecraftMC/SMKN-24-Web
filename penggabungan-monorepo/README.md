<p align="center">
  <img src="../.assets/frontend.svg" alt="Frontend Banner" width="100%">
</p>
# SMKN 24 Jakarta — Aplikasi Tunggal (Website Publik + Dashboard Admin)

Salinan **mandiri** dari monorepo: satu aplikasi Next.js yang melayani website
publik dan dashboard admin pada **origin yang sama**, dengan backend Laravel
sebagai target migrasi API dan PHP tetap tersedia selama cutover bertahap.
Salinan ini tidak bergantung pada struktur monorepo sumber; seluruh import
berada di dalam folder ini.

| Bagian | Isi |
|---|---|
| `app/(public)/` | Website publik (beranda, profil, akademik, kabar, fasilitas, berita, jurusan) |
| `app/(admin)/login/` | Halaman login admin — `/login` (satu origin, bukan redirect) |
| `app/(admin)/admin/` | Dashboard admin — `/admin/...` |
| `app/api/` | Route Next.js (BFF/proxy ke API untuk publik dan upload pengajuan) |
| `components/` | Komponen publik; `components/admin/` komponen shell/dialog admin |
| `lib/` | Client publik (`lib/api.ts`), `lib/admin/`, `lib/shared/` (token data gabungan) |
| `styles/tokens.css` | Design token visual — SATU sumber untuk publik & admin |
| `backend-laravel/` | REST API Laravel untuk migrasi backend bertahap |
| `backend/` | REST API PHP legacy, termasuk aset lama dan rollback |

Baca `MIGRATION_MATRIX.md` untuk daftar paritas sumber → target dan gap yang
masih terbuka.

---

## 1. Prasyarat

- Node.js 20+ dan npm
- PHP 8.x dengan ekstensi `pdo_mysql` dan `curl`
- MySQL/MariaDB (lokal: XAMPP/Laragon, atau hosting)

```bash
node --version
php --version
```

## 2. Instalasi

```bash
cd "penggabungan monorepo"
npm install
```

Berkas `package-lock.json` ikut tersimpan agar versi sama persis dengan yang
divalidasi.

## 3. Environment variable

Salin contoh, lalu isi sesuai lingkungan:

```bash
cp .env.example .env.local        # Windows: Copy-Item .env.example .env.local
```

Catatan:

| Variabel | Jenis | Siapa yang pakai |
|---|---|---|
| `LARAVEL_API_URL` | **server-only** | Server Next → Laravel; jika kosong, server memakai `BACKEND_URL` |
| `BACKEND_URL` | **server-only** | Server Next → PHP legacy/fallback dan URL aset lama |
| `NEXT_PUBLIC_API_URL` | public (ditanam saat **build**) | Browser dashboard admin → API (CRUD + upload) |
| `NEXT_PUBLIC_ASSET_URL` | public (ditanam saat **build**) | Origin website untuk aset lama `/backend/uploads/...` |
| `NEXT_PUBLIC_MAIN_WEB_URL` | public | Tautan "Kembali ke situs utama" di halaman login |
| `NEXT_PUBLIC_ADMIN_URL` | public | Opsional; default tautan Login sudah `/login` |
| `ADMIN_ORIGIN` | public | Hanya bila admin dipisah lintas-origin; **kosongkan untuk same-origin** |
| `backend/.env` | **server-only** | Backend PHP: `APP_ENV`, `JWT_SECRET`, DB, provider AI |

Backend PHP butuh PHP legacy membutuhkan `backend/.env` (salinan `backend/.env.example`). Laravel
membutuhkan `backend-laravel/.env` (salinan `backend-laravel/.env.example`).
Jangan arahkan Laravel ke database produksi atau alihkan trafik sebelum backup
teruji, staging lulus, dan rollback siap. Untuk rilis PHP, isi `APP_ENV=production`
dan `JWT_SECRET` acak — kalau tidak, `bootstrap.php` menolak semua request.

**Tidak ada secret di `.env.example`.** Jangan pernah commit `.env`, `.env.local`,
`JWT_SECRET`, kunci AI, atau kredensial database.

## 4. Setup database

**Pemasangan baru:** buat database lalu import `backend/database.sql` satu kali.

**Database yang sudah berisi data sekolah:** jangan impor ulang
`backend/database.sql`; pertahankan skema dan data yang sudah ada.

Setelah skema siap, isi `backend/.env` (DB_HOST/DB_NAME/DB_USER/DB_PASS sesuai
lingkungan). Untuk pemasangan baru, akun admin **tidak** di-seed skema
(keamanan); buat akun pertama:

```bash
cd backend
php tools/create-admin.php <username> "<password-kuat>" "Administrator Sekolah"
```

## 5. Menjalankan

Dua proses dibutuhkan saat development (PHP dan Next berjalan terpisah):

```bash
# terminal 1 — backend PHP dari ROOT folder ini supaya path /backend/... sama
# Pakai 127.0.0.1 (bukan localhost) supaya tidak jatuh ke IPv6 ::1 — lihat catatan
# di .env.example.
php -S 127.0.0.1:8000 -t .

# terminal 2 — aplikasi Next
npm run dev
```

Buka <http://localhost:3000>. Login admin: <http://localhost:3000/login>.

`.env.local` development (lihat `.env.example`):

```env
BACKEND_URL=http://127.0.0.1:8000/backend
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/backend
NEXT_PUBLIC_MAIN_WEB_URL=/
```

Dua server berbeda origin, jadi CORS backend (`ALLOWED_ORIGINS` di
`backend/config/config.php`) sudah mencakup `http://localhost:3000` dan
`http://127.0.0.1:3000`.

## 6. Rute

| URL | Isi |
|---|---|
| `/` | Beranda publik |
| `/profil` · `/akademik` · `/kabar` · `/fasilitas` · `/ekstrakurikuler` | Halaman publik |
| `/berita` · `/berita/[slug]` | Daftar & detail berita (404 untuk slug salah) |
| `/jurusan` · `/jurusan/[key]` | 5 kompetensi keahlian |
| `/akademik/pengajuan-prestasi` | Form pengajuan prestasi (tidak ditautkan di navbar) |
| `/login` | Login admin (origin sama) |
| `/admin` | Overview dashboard |
| `/admin/berita` · `pengumuman` · `agenda` · `guru` · `struktur-organisasi` · `fasilitas` · `ekstrakurikuler` · `galeri` · `jadwal` | Modul konten aktif; gambar struktur organisasi dapat diganti dari admin |
| `/admin/bk` | Inbox pesan BK (daftar/filter/status/hapus; backend `backend/api/bk`) |
| `/admin/arsip` | CRUD metadata + upload dokumen resmi; berkas privat disajikan dengan unduhan terkontrol |
| `/admin/prestasi` | Moderasi pengajuan; NISN/bukti hanya untuk admin, tanpa publikasi otomatis |
| `/api/bk`, `/api/bk/chat`, `/api/bk/history`, `/api/chat` | Proxy publik ke backend (status dipertahankan) |
| `/api/prestasi` | Proxy multipart pengajuan publik ke backend |
| `/api/berita`, `pengumuman`, `agenda`, `jadwal` | Proxy baca ke backend PHP |
| `backend/api/*.php` | REST API PHP (kontrak sumber, Bearer JWT untuk tulis) |

| Fitur | Detail |
|---|---|
| `/profil` hanya menampilkan fasilitas berflag `unggulan`; `/fasilitas` menampilkan semua | Flag dikelola di `/admin/fasilitas` (kolom `fasilitas.unggulan`, default `0`) |
| Ekstrakurikuler punya logo + info pembina/jadwal/lokasi yang bisa diubah admin | Dikelola di `/admin/ekstrakurikuler`; kartu tampil di `/ekstrakurikuler` dan blok unggulan di `/profil`. Endpoint `backend/api/ekstrakurikuler` membuat tabel + data contoh otomatis bila migrasi belum dijalankan; migrasi manual tetap tersedia di `backend/migrations/20261023_add_ekstrakurikuler.sql`. |
| Struktur organisasi sekolah ditampilkan sebagai gambar di atas Direktori Guru pada `/profil` | Gambar awal tersimpan di `public/images/struktur-organisasi.jpeg`; admin dapat menggantinya di `/admin/struktur-organisasi`. Untuk database lama, jalankan `backend/migrations/20261025_add_struktur_organisasi.sql` sebelum deploy. |
| Hotnews ringkas muncul di 5 halaman publik | Berita highlight diambil dari backend (`berita.utama`); `/kabar` tetap memakai hero |
| Widget chatbot punya tombol fullscreen | Tidak memakai Browser Fullscreen API agar tombol Escape tidak bentrok |

Modul sidebar yang masih `ready:false` (Riwayat Chatbot, Profil & Sesi)
memang belum diaktifkan. Pusat Arsip dan Pengajuan Prestasi sudah aktif.
Item Aspirasi sudah dihapus dari sidebar
(UI-nya dibuang; endpoint `backend/api/aspirasi` masih ada sebagai legacy dan
tidak dihapus dari database). Rincian di `MIGRATION_MATRIX.md` §3.

Arsip menerima PDF/DOCX/JPG/PNG (maks. 10 MB); bukti pengajuan prestasi
menerima PDF/JPG/PNG (maks. 10 MB) dan hanya dapat diunduh admin. Jalankan
`backend/migrations/20261004_add_arsip_prestasi.sql` setelah backup database
dan sebelum deploy versi ini. Isi `PRIVATE_UPLOAD_DIR` hanya jika direktori
default di luar document root tidak dapat ditulis; lokasi konfigurasi harus
tetap di luar web root.

## 7. Perintah validasi

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # build produksi
npm run start       # jalankan hasil build
```

Cek backend tanpa browser:

```bash
curl -X POST http://localhost:8000/backend/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"<user>","password":"<salah>"}'
# diharapkan 401 {"error":"Username atau password salah."}
```

## 8. Deploy ke Hostinger

Laravel cutover needs an API subdomain whose document root points directly to
`backend-laravel/public` (not the Laravel project root). Keep the PHP backend
at `public_html/backend` during rollout for static legacy uploads and rollback.
Deployment and production cutover must be performed and verified in hPanel;
changing repository files alone does not change live routing.

1. Back up the production database and verify the backup can be restored.
   Configure Laravel with the same production database as PHP so existing
   content/admin accounts remain visible. The Laravel migration is additive;
   review it with `php artisan migrate --pretend --force` before applying it.
   Do not import `backend/database.sql` into the populated production database:
   it includes example content. Never point the Laravel app at the empty
   `laraveltest` database for cutover.
   Laravel has no custom environment/remote-host guard for API writes or
   Artisan database mutations. Use the intended database credentials and
   verify the target before running commands; Laravel's built-in production
   confirmation (`--force`) still applies to migrations.
2. Deploy the Laravel project outside the public document root, install
   production Composer dependencies, and set its `public` directory as the
   API subdomain document root. Keep `.env`, `vendor`, storage, and source
   files outside the document root. Set `APP_ENV=production`,
   `APP_DEBUG=false`, `APP_URL=https://api.domain-anda.id`, production DB
   settings, and the same `JWT_SECRET` currently used by PHP. Set
   `CORS_ALLOWED_ORIGINS=https://domain-anda.id`. Reuse legacy public uploads
   (`PUBLIC_UPLOAD_DIR` and `UPLOAD_URL_BASE=/backend/uploads/`) and private
   uploads (`PRIVATE_UPLOAD_DIR`) with absolute paths outside the document
   root. Keep AI on sandbox credentials until those flows pass.
3. Before deploying the frontend build, set these hPanel variables:

   ```text
   BACKEND_URL=https://domain-anda.id/backend
   LARAVEL_API_URL=https://api.domain-anda.id
   NEXT_PUBLIC_API_URL=https://api.domain-anda.id
   NEXT_PUBLIC_ASSET_URL=https://domain-anda.id
   NEXT_PUBLIC_MAIN_WEB_URL=/
   NEXT_PUBLIC_ADMIN_URL=/login
   ADMIN_ORIGIN=
   ```

   `NEXT_PUBLIC_*` values are embedded during `npm run build`; changing them
   afterwards requires rebuilding and restarting the Next.js app. The old
   PHP `/backend/uploads` URL remains the asset origin while API requests use
   the Laravel subdomain.
4. On Laravel's deployment host, run `php artisan migrate --pretend --force`,
   verify its DB name is the production DB and the backup exists, then run
   `php artisan migrate --force`. Check `https://api.domain-anda.id/up`,
   public API reads, admin login, CRUD, BK uploads, and AI.
   Run parity checks against a staging copy before sending production traffic.
5. Deploy/build Next.js with the variables above. Keep the old PHP backend
   online as rollback. Rollback: restore `NEXT_PUBLIC_API_URL=/backend`,
   remove `LARAVEL_API_URL` (so server requests fall back to PHP
   `BACKEND_URL`), rebuild, and restart Next.js. Do not send writes to both
   backends.

Do not expose production `JWT_SECRET` on a public staging server. Use a
separate staging secret unless verifying token interoperability in a controlled
environment.

Hasil validasi lokal dan gap yang masih terbuka: `MIGRATION_MATRIX.md` §8.

## Bimbingan Konseling (counsellor AI)

Siswa membuka layanan BK lewat tombol **"Bimbingan Konseling"** di navbar,
menu seluler, dan beranda. Tombol itu membuka chat modal: AI menyapa, siswa
bercerita, lalu AI merangkum dan menyimpan laporan untuk guru BK. Modal ini
berdampingan dengan formulir BK lama di `/akademik` dan tombol "Lihat Lokasi
Sekolah" — ketiganya tetap dipertahankan.

Backend punya **dua AI dengan tujuan terpisah**, keduanya memakai pemanggil
provider yang sama (`backend/helpers/ai.php`):

| AI | Prompt | Tujuan |
|---|---|---|
| Asisten sekolah | `AI_SYSTEM_PROMPT` | Jawab pertanyaan umum (PPDB, jurusan, jadwal) |
| Counsellor AI | `AI_BK_SYSTEM_PROMPT` | Triase BK: ringkas masalah + nilai tingkat kesulitan |

Counsellor AI mengembalikan JSON berisi `ringkasan`, `kategori`,
`tingkat_kesulitan` (`Ringan`/`Sedang`/`Berat`), `butuh_perhatian`, dan
`balasan_siswa`. Di panel `/admin/bk`, daftar diurutkan berdasarkan
`butuh_perhatian` lalu tingkat kesulitan, sehingga guru BK dapat menangani yang
paling mendesak lebih dahulu.

### Riwayat percakapan siswa

Modal BK punya tab **Riwayat** yang menampilkan 20 cerita terakhir. Kunci
riwayat adalah **ID perangkat** yang dibuat browser dan disimpan di
localStorage (`smkn24-bk-device`), bukan alamat IP:

- IP handphone sering berubah (pindah WiFi ke seluler atau ganti lokasi)
  sehingga history bisa hilang sendiri;
- IP sekolah dipakai bersama banyak siswa sehingga history bisa tercampur.

Konsekuensinya, history terikat per perangkat: mengganti perangkat atau
menekan "Clear data browser" berarti history lama tidak terlihat di sana.

Endpoint `/api/bk/history` hanya mengembalikan baris milik `deviceId` tersebut
dan tidak menerima parameter lain. `deviceId` divalidasi sebagai UUID v4 di
frontend, proxy, dan backend. Nomor HP siswa tidak pernah dikembalikan ke
siswa.

**Migrasi database wajib** sebelum memakai fitur ini:

```bash
mysql -u <user> -p <nama_database> < backend/tools/migrate-bk-ai.sql
```

File tersebut aman dijalankan berulang kali (semua blok di-check lewat
`information_schema`).

> Catatan: bila AI gagal atau tidak mengembalikan JSON, cerita siswa **tetap
> tersimpan** dengan ringkasan cadangan — data tidak hilang, hanya triase
> otomatisnya yang kosong.

## 9. APK Android Dashboard Admin

APK khusus admin ada di `android-admin/`. Aplikasi ini adalah shell native
(WebView) yang membuka dashboard web yang sama, sehingga login, CRUD, unggah
foto, dan unduhan tetap diproses oleh web/API dan langsung tersimpan di
database sekolah. APK tidak menyimpan kredensial MySQL.

- Server default: `https://macdeep.my.id/login` (bisa diganti dari menu
  **⋮ → Pengaturan server**).
- Dukungan kamera/galeri untuk unggah gambar, unduhan blob ke
  `Download/SMKN 24 Admin/`, pintasan launcher modul admin, dan logout sesi.
- Tetap berjalan saat frontend/backend di-redeploy pada domain yang sama; redirect
  apex/`www` dan rute login yang berubah ditangani otomatis, error 5xx menampilkan
  tombol coba lagi. Pindah domain cukup lewat **Pengaturan server**.
- Bangun ulang: `cd android-admin && ./build-apk.sh`.
- Hasil build disalin ke `~/Downloads/SMKN24-Admin-1.1.apk` (tidak disimpan di
  repository). Detail prasyarat, kunci penandatangan, dan bukti validasi ada di
  `android-admin/README.md`.

Konfigurasi database untuk backend lokal/deploy ditulis di `backend/.env` dan
`backend-laravel/.env` (keduanya gitignored, mode 600). Jangan commit berkas
tersebut atau menyalin password ke dokumentasi.
