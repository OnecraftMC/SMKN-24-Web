# Backend PHP + MySQL — Website SMKN 24 Jakarta

Backend REST API murni PHP (tanpa framework, cukup PHP + PDO) untuk melayani
frontend Next.js yang sudah ada (`apps/main-web` & `apps/admin`).

## 1. Kebutuhan Server

- PHP 8.0+ dengan ekstensi: `pdo_mysql`, `curl`, `fileinfo`, `json`
- MySQL / MariaDB
- Apache (dengan `mod_rewrite` untuk `.htaccess`) atau Nginx

## 2. Instalasi

1. Salin folder `backend/` ini ke server (contoh: `htdocs/backend` di XAMPP/Laragon,
   atau `public_html/backend` di hosting).
  Untuk development tanpa Apache, jalankan dari folder `apps/admin`:
  ```bash
  npm run dev:backend
  ```
  Perintah ini menyajikan backend di `http://localhost:8000`; sesuaikan
  `NEXT_PUBLIC_API_URL` pada `apps/admin/.env.local` bila memakai URL lain.
2. Buat database, lalu import skema:
   - Lokal (XAMPP/Laragon):
     ```bash
     mysql -u root -p -e "CREATE DATABASE smkn24 CHARACTER SET utf8mb4"
     mysql -u root -p smkn24 < database.sql
     ```
   - Shared hosting (mis. Hostinger): buat database dari hPanel, lalu import
     `database.sql` lewat phpMyAdmin dengan database tersebut terpilih.
     Sebelum import, **hapus dua baris pembuka** pada `database.sql`
     (`CREATE DATABASE ...` dan `USE ...`) — shared hosting menolak perintah
     pembuatan database dari user biasa. Pastikan collation database
     `utf8mb4_unicode_ci`.
   Schema baru sudah membuat kolom `fasilitas.unggulan` dengan nilai default `0`.
   Untuk database yang sudah ada, **backup dahulu**, periksa `SHOW COLUMNS FROM
   fasilitas LIKE 'unggulan';`, lalu jika belum ada jalankan sekali:

   ```sql
   ALTER TABLE fasilitas
     ADD COLUMN unggulan TINYINT(1) NOT NULL DEFAULT 0 AFTER gambar;
   ```

   SQL upgrade yang sama tersedia di `backend/migrations/20261004_add_fasilitas_unggulan.sql`.
   Jalankan upgrade schema sebelum deploy versi aplikasi yang membaca kolom ini.
   Baris lama otomatis bernilai `0` (bukan fasilitas unggulan). Jangan jalankan
   migration ini pada database baru yang sudah dibuat dari `database.sql`.
   Untuk pusat arsip dan pengajuan prestasi, backup dahulu lalu jalankan
   `backend/migrations/20261004_add_arsip_prestasi.sql` satu kali sebelum deploy.
   Migration ini hanya menambah tabel `arsip` dan `prestasi`; data lama tidak
   diubah. Jangan jalankan migration production dari aplikasi atau dari test.
   Untuk kategori reusable admin, backup dahulu lalu jalankan
   `backend/migrations/20261004_add_admin_categories.sql` satu kali pada schema
   existing sebelum deploy. Migration ini membuat tabel kategori, menyalin
   kategori lama, dan menambah kolom pada modul yang sebelumnya belum memiliki
   kategori. Statement `ALTER TABLE` tidak idempoten: jangan jalankan ulang,
   dan jangan jalankan pada database fresh-install yang sudah dibuat dari
   `database.sql` versi ini.
   Untuk pilihan berita `Prestasi & Akademik`, jalankan
   `backend/migrations/20261005_add_prestasi_akademik_news_category.sql` satu
   kali setelah migration kategori admin di atas.
3. Salin `.env.example` menjadi `.env`, lalu isi:
   ```bash
   cp .env.example .env
   ```
   - **`OPENAI_API_KEY`** (atau `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`) — inilah
     tempat menaruh API Key untuk fitur AI Chatbot.
   - Set `AI_PROVIDER` sesuai provider yang dipakai: `openai`, `gemini`, atau `anthropic`.
   - Ganti `JWT_SECRET` dengan string acak & rahasia.
   - Set `APP_ENV=production` di server publik. Bila `APP_ENV=production` dan
     `JWT_SECRET` masih kosong/default, seluruh endpoint menolak melayani request
     (fail-fast) agar token tidak bisa dipalsukan.
   - Isi bagian **`DB_*`** sesuai tempat database berada (komentar lengkap ada di
     `.env.example`):
     - Lokal: `DB_HOST=localhost`, `DB_NAME=smkn24`, `DB_USER=root`,
       `DB_PASS=` kosong (default XAMPP).
     - Hostinger, PHP di hosting yang sama: `DB_HOST=localhost`,
       `DB_NAME=u104889167_admin_dash_24`, `DB_USER=u104889167_admin24`,
       `DB_PASS=` password database dari hPanel.
      - Hostinger, remote dari komputer lain: aktifkan **Remote MySQL** di hPanel
        (Websites → Dashboard → sidebar "Remote MySQL"), whitelist IP publik
        komputer Anda, pilih database, lalu pakai `DB_HOST` = hostname MySQL yang
        tampil di halaman itu (format `srv*.hstgr.io`, bukan URL phpMyAdmin) dan
        `DB_PORT=3306`. Ingat: IP ISP bisa berubah sehingga whitelist perlu
        diperbarui.
4. Kredensial database dibaca dari `.env` (langkah 3) — `config/database.php`
   tidak perlu diubah lagi.
5. Pastikan folder `uploads/` bisa ditulis oleh web server:
   ```bash
   chmod -R 755 uploads
   ```
   Arsip dan bukti prestasi tidak disimpan di folder publik tersebut. Backend
   membuat `.smkn24-private-uploads` satu tingkat di atas document root. Jika
   lokasi itu tidak dapat ditulis pada hosting, atur `PRIVATE_UPLOAD_DIR` di
   `backend/.env` ke direktori writable yang benar-benar berada di luar document
   root. Batas aplikasi adalah 10 MB per file; PHP `upload_max_filesize` dan
   `post_max_size` harus disetel setidaknya 11 MB untuk menerima multipart form.
   Arsip menerima PDF/DOCX/JPG/PNG; bukti prestasi menerima PDF/JPG/PNG. Bukti
   prestasi hanya dapat diunduh oleh admin terautentikasi.
   Metadata hapus dan file arsip dihapus bersama; bila pembersihan file gagal,
   endpoint mengembalikan error dan mencatat kejadian generik di log. Kegagalan
   proses antara penyimpanan file dan insert DB melakukan pembersihan best-effort.
   Jangan menghapus file yatim secara otomatis: setelah backup, cocokkan storage
   key file dengan kedua tabel sebelum pembersihan manual.
   Rollback rilis dilakukan dengan mengembalikan kode aplikasi sebelumnya sambil
   mempertahankan tabel dan file baru. Jangan DROP tabel atau menghapus folder
   storage untuk rollback setelah ada pengajuan/dokumen; pulihkan hanya dari
   backup yang telah diverifikasi dan dengan persetujuan pemilik data.
6. Buka `config/config.php` bagian `ALLOWED_ORIGINS` dan tambahkan domain
   frontend Next.js Anda (misalnya `http://localhost:3000` untuk development,
   atau domain produksi).
7. Uji koneksi database (lokal maupun remote):
   ```bash
   php tools/check-db.php
   ```
   Sukses menampilkan versi MySQL; gagal menampilkan penyebabnya (host/port
   salah, whitelist Remote MySQL belum memuat IP Anda, user/password salah).
   Port 3306 juga bisa diuji terpisah dari Windows:
   `Test-NetConnection <host> -Port 3306`.

## 3. Membuat Akun Admin Pertama

`database.sql` **tidak lagi** menyisipkan akun admin default. Kredensial default
yang mudah ditebak (dan hash lama yang tidak dapat diverifikasi) sudah dihapus,
sehingga tidak ada akun yang salah dipakai tanpa sengaja.

Setelah import database, jalankan dari folder `backend`:

```bash
php tools/create-admin.php admin "PasswordKuatAnda" "Administrator Sekolah"
```

Perintah tersebut membuat akun baru atau memperbarui password akun yang sudah ada
(hash dibuat dengan `password_hash()`, jadi pasti terverifikasi oleh login).
Password minimal 8 karakter.

Jika hanya butuh hash untuk `UPDATE` manual pada tabel `admin_users`:

```bash
php tools/hash-password.php "PasswordKuatAnda"
```

Kedua skrip hanya dapat dijalankan dari command line (`tools/.htaccess` menolak
akses lewat browser). Jangan pernah menyimpan password asli di dalam repository.

## 4. Struktur Folder

```
backend/
├── .env                  <- API key & secret (JANGAN commit ke git)
├── .env.example
├── database.sql          <- skema + data awal
├── bootstrap.php         <- entry point umum (CORS, error handler, dsb)
├── config/
│   ├── config.php        <- AI provider, API key, JWT, CORS
│   ├── database.php      <- koneksi PDO
│   └── env.php           <- loader file .env
├── helpers/
│   ├── response.php       <- helper JSON response
│   ├── cors.php           <- middleware CORS
│   ├── jwt.php            <- JWT auth admin
│   ├── upload.php         <- upload gambar publik
│   └── private_upload.php <- dokumen privat di luar web root
├── uploads/               <- file gambar ter-upload (publik, tanpa eksekusi PHP)
├── tools/                 <- skrip CLI (create-admin.php, hash-password.php)
└── api/
    ├── auth/
    │   ├── login.php       POST   -> login admin, dapat JWT token
    │   └── me.php          GET    -> data admin yang sedang login
    ├── berita/index.php    GET/POST/PUT/DELETE
    ├── pengumuman/index.php GET/POST/PUT/DELETE
    ├── agenda/index.php    GET/POST/PUT/DELETE
    ├── guru/index.php      GET/POST/PUT/DELETE
    ├── jadwal/index.php    GET/POST/DELETE (matriks per jurusan & sesi)
    ├── galeri/index.php    GET/POST/PUT/DELETE
    ├── fasilitas/index.php GET/POST/PUT/DELETE
    ├── arsip/index.php     CRUD metadata + unduhan arsip publik terkontrol
    ├── prestasi/index.php  POST publik; GET/status + bukti admin-only
    ├── bk/index.php        POST (publik) / GET,PUT,DELETE (admin)
    ├── aspirasi/index.php  POST (publik) / GET,PUT,DELETE (admin)
    ├── chat/
    │   ├── index.php       POST -> chatbot AI (publik)
    │   └── history.php     GET  -> riwayat chat (admin)
    └── upload.php          POST -> upload gambar (admin)
```

## 5. Autentikasi Admin

Semua endpoint tulis (POST/PUT/DELETE) untuk data konten, dan semua endpoint
`GET` yang sensitif (daftar pesan BK, prestasi, aspirasi, riwayat chat), membutuhkan
header:

```
Authorization: Bearer <token>
```

Token didapat dari `POST /api/auth/login.php`:

```bash
curl -X POST https://domainanda.com/backend/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 6. Menghubungkan ke Frontend Next.js

Di `apps/main-web`, ganti isi setiap `app/api/*/route.ts` agar melakukan
`fetch` ke backend PHP ini (atau langsung arahkan komponen frontend untuk
fetch langsung ke URL backend). Contoh (`app/api/berita/route.ts`):

```ts
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost/backend';

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/api/berita/index.php`, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}
```

Untuk chatbot (`components/chatbot/ChatbotWidget.tsx`), ganti fungsi
`sendMessage` agar memanggil:

```ts
const res = await fetch(`${BACKEND_URL}/api/chat/index.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text, sessionId }),
});
const data = await res.json();
// data.reply -> teks balasan bot
// data.sessionId -> simpan di state/localStorage untuk continuity percakapan
```

## 7. Contoh Pemanggilan Endpoint AI Chat

```bash
curl -X POST https://domainanda.com/backend/api/chat/index.php \
  -H "Content-Type: application/json" \
  -d '{"message":"Bagaimana cara daftar SPMB di SMKN 24?"}'
```

Response:

```json
{
  "sessionId": "a1b2c3...",
  "reply": "Untuk mendaftar SPMB SMKN 24 Jakarta, ..."
}
```

## 7b. Draf Berita & Agenda dengan AI (khusus admin)

`POST /api/ai/index.php` dipakai dashboard admin untuk menyusun **draf** berita
dan agenda. Endpoint ini memakai provider AI yang sama dengan chat, tapi memakai
system prompt terpisah (`AI_CONTENT_SYSTEM_PROMPT`) dan WAJIB memakai token admin
(`requireAuth()`). Tanpa token selalu dibalas 401.

```bash
curl -X POST https://domainanda.com/backend/api/ai/index.php \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{"modul":"berita","catatan":"Pameran karya siswa kelas XII TKU di aula sekolah."}'
```

Response sukses:

```json
{
  "draf": {
    "judul": "Pameran Karya Siswa Kelas XII TKU SMKN 24 Jakarta",
    "ringkasan": "Siswa kelas XII TKU memamerkan karya mereka di aula sekolah.",
    "isi": "Paragraf pertama...\n\nParagraf kedua..."
  },
  "aiAvailable": true,
  "reason": null
}
```

`modul` berisi salah satu dari `berita`, `pengumuman`, `agenda`, `fasilitas`,
`guru`, atau `galeri`. Field draf per modul:

| Modul         | Field hasil draf                          |
| ------------- | ----------------------------------------- |
| `berita`      | `judul`, `ringkasan`, `isi`               |
| `pengumuman`  | `judul`, `isi`, `badge`, `status`         |
| `agenda`      | `judul`, `badge`, `lokasi`, `deskripsi`   |
| `fasilitas`   | `judul`, `deskripsi`                      |
| `guru`        | `jabatan`, `deskripsi`                    |
| `galeri`      | `judul`                                   |

Hal yang perlu diketahui sebelum memakai fitur ini:

- **Tidak ada yang disimpan otomatis.** Endpoint ini tidak pernah menulis ke
  database. Hasil draf hanya mengisi field form admin; admin tetap menekan
  tombol **Simpan** sendiri setelah membaca dan memperbaiki isinya.
- **Field tanggal tidak dihasilkan AI.** `tanggal` (berita & pengumuman) serta
  `tglMulai`/`tglSelesai`/`waktu` (agenda) tetap diisi admin. Tanggal adalah
  data faktual yang paling rawan dikarang model.
- **Nama orang tidak dihasilkan AI.** Pada modul `guru`, draf hanya berisi
  jabatan dan deskripsi; nama, foto, dan urutan tampil tetap diisi admin.
- **Modul berikut sengaja tidak didukung** karena isinya data faktual/terstruktur
  yang tidak boleh dikarang: `jadwal` (jam pelajaran, mapel, guru pengampu),
  `arsip` (metadata berkas), `bk` dan `prestasi` (data siswa). Menambah salah
  satu ke `AI_CONTENT_MODULES` di `api/ai/index.php` akan terlihat jelas di diff.
- **Perlu `AI_PROVIDER` + API key yang terisi** di `.env` server. Tanpa itu
  endpoint membalas HTTP 503 dengan `aiAvailable: false` dan
  `reason: "not_configured"` — bukan draf palsu.
- Status lain yang perlu ditangani: `provider_error` (502, layanan AI gagal) dan
  `invalid_response` (502, jawaban model tidak terbaca sebagai JSON). Keduanya
  juga **tidak** berisi draf.

## 8. Keamanan

- File `.env`, `database.sql`, folder `config/` dan `helpers/` sudah diblokir
  aksesnya lewat `.htaccess` (khusus Apache). Jika pakai Nginx, tambahkan
  aturan setara di konfigurasi server.
- Folder `uploads/` diizinkan diakses publik (untuk menampilkan gambar) tapi
  file `.php` di dalamnya tidak akan dieksekusi.
- Selalu gunakan HTTPS di produksi agar token JWT tidak bisa disadap.
- Untuk keamanan tambahan, pertimbangkan rate-limiting pada endpoint
  `/api/chat` dan `/api/auth/login.php` agar tidak disalahgunakan.
