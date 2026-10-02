# SMKN 24 Jakarta — Aplikasi Tunggal (Website Publik + Dashboard Admin)

Salinan **mandiri** dari monorepo: satu aplikasi Next.js yang melayani website
publik dan dashboard admin pada **origin yang sama**, plus backend PHP sebagai
REST API. Salinan ini tidak bergantung pada struktur monorepo sumber; seluruh
import berada di dalam folder ini.

| Bagian | Isi |
|---|---|
| `app/(public)/` | Website publik (beranda, profil, akademik, kabar, fasilitas, berita, jurusan) |
| `app/(admin)/login/` | Halaman login admin — `/login` (satu origin, bukan redirect) |
| `app/(admin)/admin/` | Dashboard admin — `/admin/...` |
| `app/api/` | Route Next.js (BFF/proxy ke backend PHP untuk chat & BK, proxy baca) |
| `components/` | Komponen publik; `components/admin/` komponen shell/dialog admin |
| `lib/` | Client publik (`lib/api.ts`), `lib/admin/`, `lib/shared/` (token data gabungan) |
| `styles/tokens.css` | Design token visual — SATU sumber untuk publik & admin |
| `backend/` | REST API PHP + PDO/MySQL + JWT + upload |

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
| `BACKEND_URL` | **server-only** | Server Next → backend PHP (render + proxy `/api/*`) |
| `NEXT_PUBLIC_API_URL` | public (ditanam saat **build**) | Browser dashboard admin (CRUD + upload) |
| `NEXT_PUBLIC_MAIN_WEB_URL` | public | Tautan "Kembali ke situs utama" di halaman login |
| `NEXT_PUBLIC_ADMIN_URL` | public | Opsional; default tautan Login sudah `/login` |
| `ADMIN_ORIGIN` | public | Hanya bila admin dipisah lintas-origin; **kosongkan untuk same-origin** |
| `backend/.env` | **server-only** | Backend PHP: `APP_ENV`, `JWT_SECRET`, DB, provider AI |

Backend PHP butuh `backend/.env` (salinan `backend/.env.example`). Isi
`APP_ENV=production` **dan** `JWT_SECRET` acak sebelum rilis — kalau tidak,
`bootstrap.php` menolak semua request.

**Tidak ada secret di `.env.example`.** Jangan pernah commit `.env`, `.env.local`,
`JWT_SECRET`, kunci AI, atau kredensial database.

## 4. Setup database

1. Buat database lalu import: `mysql -u root -p <db> < backend/database.sql`
2. Akun admin **tidak** di-seed skema (keamanan). Buat satu akun:

```bash
cd backend
php tools/create-admin.php <username> "<password-kuat>" "Administrator Sekolah"
```

3. Isi `backend/.env` (DB_HOST/DB_NAME/DB_USER/DB_PASS sesuai lingkungan).

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
| `/profil` · `/akademik` · `/kabar` · `/fasilitas` | Halaman publik |
| `/berita` · `/berita/[slug]` | Daftar & detail berita (404 untuk slug salah) |
| `/jurusan` · `/jurusan/[key]` | 5 kompetensi keahlian |
| `/login` | Login admin (origin sama) |
| `/admin` | Overview dashboard |
| `/admin/berita` · `pengumuman` · `agenda` · `guru` · `fasilitas` · `galeri` · `jadwal` | Modul CRUD aktif |
| `/api/bk`, `/api/chat` | Proxy publik ke backend (status dipertahankan) |
| `/api/berita`, `pengumuman`, `agenda`, `jadwal` | Proxy baca ke backend PHP |
| `backend/api/*.php` | REST API PHP (kontrak sumber, Bearer JWT untuk tulis) |

Modul sidebar yang masih `ready:false` (Pusat Arsip, Pesan BK, Aspirasi,
Pengajuan Prestasi, Riwayat Chatbot, Profil & Sesi) **memang belum ada
UI-nya** — jangan ditautkan seolah sudah jadi. Rincian di `MIGRATION_MATRIX.md` §3.

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

## 8. Deploy ke Hostinger (belum diuji — lakukan manual)

Deployment **belum pernah dijalankan** oleh agen; langkah di bawah adalah
rencana yang harus dieksekusi dan diverifikasi sendiri.

1. **Node di hPanel.** aktifkan "Node.js" (versi 20/22), lalu `npm install` dan
   `npm run build` **di server** (Hostinger menjalankan Next.js lewat Passenger/
   "Setup Node.js App"). Isi environment variable di hPanel, bukan di file:
   `BACKEND_URL=https://domain-anda.id/backend`,
   `NEXT_PUBLIC_API_URL=/backend`, `NEXT_PUBLIC_MAIN_WEB_URL=/`,
   `NEXT_PUBLIC_ADMIN_URL=/login`, `ADMIN_ORIGIN=` (kosong).
   `NEXT_PUBLIC_*` di-compile saat build — isi **sebelum** `npm run build`.
2. **Backend PHP.** upload folder `backend/` ke `public_html/backend/`. Salin
   `backend/.env.example` menjadi `backend/.env`, isi `APP_ENV=production` dan
   `JWT_SECRET` acak. **Jangan** pernah menaruh `.env` di path yang bisa diunduh.
3. **Document root.** pastikan `public_html/backend/` berada di dalam
   document root agar `.htaccess` ikut diproses.
4. **Database.** import `backend/database.sql` lewat phpMyAdmin (hapus
   `CREATE DATABASE`/`USE` bila shared hosting), lalu buat akun admin:
   `php tools/create-admin.php <username> "<password>" "<nama>"`.
5. **Verifikasi pasca-deploy (wajib):**

```bash
curl -I https://domain-anda.id/backend/.env          # harus 403
curl -I https://domain-anda.id/backend/database.sql  # harus 403
curl -I https://domain-anda.id/backend/uploads/      # harus 403/tidak ada
curl -X POST https://domain-anda.id/backend/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"<user>","password":"<salah>"}'      # harus 401
```

Lalu buka `https://domain-anda.id/login`, masuk dengan akun admin, pastikan
mengarah ke `/admin`, dan coba CRUD satu modul.

Hasil validasi lokal dan gap yang masih terbuka: `MIGRATION_MATRIX.md` §8.
