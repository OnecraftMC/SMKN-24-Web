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
2. Buat database dan import skema:
   ```bash
   mysql -u root -p -e "CREATE DATABASE smkn24 CHARACTER SET utf8mb4"
   mysql -u root -p smkn24 < database.sql
   ```
3. Salin `.env.example` menjadi `.env`, lalu isi:
   ```bash
   cp .env.example .env
   ```
   - **`OPENAI_API_KEY`** (atau `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`) — inilah
     tempat menaruh API Key untuk fitur AI Chatbot.
   - Set `AI_PROVIDER` sesuai provider yang dipakai: `openai`, `gemini`, atau `anthropic`.
   - Ganti `JWT_SECRET` dengan string acak & rahasia.
4. Buka `config/database.php` dan sesuaikan `DB_HOST`, `DB_USER`, `DB_PASS` jika
   berbeda dari default XAMPP (`root` / password kosong).
5. Pastikan folder `uploads/` bisa ditulis oleh web server:
   ```bash
   chmod -R 755 uploads
   ```
6. Buka `config/config.php` bagian `ALLOWED_ORIGINS` dan tambahkan domain
   frontend Next.js Anda (misalnya `http://localhost:3000` untuk development,
   atau domain produksi).

## 3. Login Admin Default

- Username: `admin`
- Password: `admin123`

**Segera ganti password ini setelah instalasi** (update langsung di tabel
`admin_users` dengan hash baru dari `password_hash()`, atau buat endpoint
ganti password sendiri).

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
│   └── upload.php         <- upload gambar
├── uploads/               <- file gambar ter-upload (publik, tanpa eksekusi PHP)
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
    ├── bk/index.php        POST (publik) / GET,PUT,DELETE (admin)
    ├── aspirasi/index.php  POST (publik) / GET,PUT,DELETE (admin)
    ├── chat/
    │   ├── index.php       POST -> chatbot AI (publik)
    │   └── history.php     GET  -> riwayat chat (admin)
    └── upload.php          POST -> upload gambar (admin)
```

## 5. Autentikasi Admin

Semua endpoint tulis (POST/PUT/DELETE) untuk data konten, dan semua endpoint
`GET` yang sensitif (daftar pesan BK, aspirasi, riwayat chat), membutuhkan
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

## 8. Keamanan

- File `.env`, `database.sql`, folder `config/` dan `helpers/` sudah diblokir
  aksesnya lewat `.htaccess` (khusus Apache). Jika pakai Nginx, tambahkan
  aturan setara di konfigurasi server.
- Folder `uploads/` diizinkan diakses publik (untuk menampilkan gambar) tapi
  file `.php` di dalamnya tidak akan dieksekusi.
- Selalu gunakan HTTPS di produksi agar token JWT tidak bisa disadap.
- Untuk keamanan tambahan, pertimbangkan rate-limiting pada endpoint
  `/api/chat` dan `/api/auth/login.php` agar tidak disalahgunakan.
