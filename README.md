# SMK Negeri 24 Jakarta — Website Profil Sekolah

Website informatif, responsif, dan interaktif untuk SMK Negeri 24 Jakarta dengan integrasi AI Chatbot berbasis OpenAI API dan admin dashboard untuk pembaruan konten.

---

## Struktur Proyek

```
.
├── LICENSE                             # Apache 2.0 — kode sumber
├── NOTICE                             # Atribusi komponen Apache 2.0
├── THIRD_PARTY_LICENSES.md            # Daftar lisensi semua dependency
├── CONTENT_LICENSE.md                 # CC BY-NC 4.0 — konten website
├── PRD_SMK_Negeri_24_Jakarta.md      # Dokumen PRD lengkap
├── README.md                          # File ini
├── backend/                           # Server (Bun + ElysiaJS)
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── src/
│   │   ├── index.ts                   # Elysia server entry
│   │   ├── db/
│   │   │   ├── index.ts               # Drizzle ORM + SQLite
│   │   │   └── schema.ts              # 10 tabel (program, prestasi, fasilitas, dll)
│   │   ├── routes/
│   │   └── types/
└── frontend/                          # Client (Svelte 5 + TypeScript + Vite + Tailwind)
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── App.svelte
        ├── main.ts
        ├── app.css                    # Tailwind v4 + tema kustom
        └── components/
            ├── Navbar.svelte
            ├── Hero.svelte
            ├── Programs.svelte
            ├── Facilities.svelte
            ├── Achievements.svelte
            ├── Contact.svelte
            ├── Chatbot.svelte         # Widget AI Chatbot
            └── Footer.svelte
```

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Svelte 5, TypeScript, Vite, Tailwind CSS v4 |
| **Backend** | Bun, ElysiaJS, DrizzleORM |
| **Database** | SQLite (dev/prod) via `better-sqlite3` |
| **AI Chatbot** | OpenAI API (`gpt-3.5-turbo` / `text-embedding-3-small`) |
| **Auth** | JWT (`jose`) + bcrypt |
| **Validation** | Zod |

---

## Prerequisites

- [Bun](https://bun.sh/) (v1.1+)
- [Node.js](https://nodejs.org/) (v20+) — untuk frontend
- Git
- Akun [OpenAI](https://platform.openai.com/) dengan API Key

---

## Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/username/smk24-jakarta-website.git
cd smk24-jakarta-website
```

### 2. Setup Backend

```bash
cd backend
bun install
```

Buat file `.env`:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
PORT=3000
DATABASE_URL=./data/smk24.db
```

Generate database:

```bash
mkdir -p data
bun run drizzle-kit push:sqlite
```

Jalankan server:

```bash
bun run src/index.ts
```

Server akan berjalan di `http://localhost:3000`.

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Buat file `.env` (opsional untuk konfigurasi API endpoint):

```env
VITE_API_URL=http://localhost:3000
```

Jalankan dalam mode development:

```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`.

---

## Database Schema

Terdapat 10 tabel utama:

| Nama Tabel | Keterangan |
|---|---|
| `programs` | Program keahlian (TKJ, Otomotif, Akuntansi, Perhotelan, Multimedia, Elektro) |
| `achievements` | Prestasi sekolah |
| `facilities` | Fasilitas sekolah |
| `news` | Berita / artikel |
| `announcements` | Pengumuman |
| `schedule` | Jadwal kegiatan |
| `gallery` | Galeri foto |
| `school_profile` | Profil sekolah (nama, alamat, visi, misi) |
| `contacts` | Form kontak masuk |
| `admin_users` | Akun admin |

---

## Fitur Utama

- **Landing Page** — Hero dengan statistik, daftar program, fasilitas, prestasi, kontak, dan peta lokasi
- **Responsif** — Optimal untuk desktop dan mobile
- **AI Chatbot** — Widget interaktif berbasis OpenAI API yang menjawab pertanyaan tentang sekolah
- **Admin Dashboard** — Login JWT + CRUD konten (berita, pengumuman, program, prestasi, fasilitas, jadwal, galeri)

---

## Status Implementasi

| Komponen | Status |
|---|---|
| PRD Dokumentasi | ✅ Lengkap |
| Struktur Proyek | ✅ Lengkap |
| Database Schema | ✅ Lengkap |
| Landing Page (Frontend) | ✅ Lengkap |
| Backend Server (Elysia) | ✅ Dasar |
| Admin Dashboard (UI) | ⏳ Belum |
| Admin CRUD (Backend) | ⏳ Belum |
| OpenAI Chat Integration | ⏳ Belum (widget frontend siap) |
| Deployment & SSL | ⏳ Belum |

---

## Catatan Penting

1. **Deadline < 1 bulan** — MVP sudah tersedia: landing page + konten statis. Chatbot dan admin dashboard disarankan untuk rilis berikutnya (v1.1 / v1.2).
2. **Anggaran < 5 juta IDR** — Biaya operasional tahunan (hosting + OpenAI API) kemungkinan melebihi 5 juta. Rekomendasi: gunakan hosting murah (`Railway` / `Fly.io` / VPS lokal) dan model AI ekonomis (`gpt-3.5-turbo`).
3. **Chatbot AI** — Widget frontend (`Chatbot.svelte`) sudah terintegrasi. Endpoint backend `/api/chat` perlu diimplementasi untuk menyambungkan ke OpenAI API.
4. **Keamanan** — Implementasi SSL, sanitasi input (Zod), JWT auth, dan rate limiting sudah direncanakan dalam PRD.

---

## Roadmap

| Fase | Timeline | Deliverable |
|---|---|---|
| **MVP** | Minggu 1 | Landing page + profil sekolah |
| **v1.0** | Minggu 2 | Semua konten + media sosial |
| **v1.1** | Minggu 3 | AI Chatbot (OpenAI) |
| **v1.2** | Minggu 4 | Admin dashboard + testing + deploy |
| **v2.0** | Bulan 2+ | Analytics, PWA, optimasi |

---

## Kontribusi

Project ini dikembangkan berdasarkan PRD (`PRD_SMK_Negeri_24_Jakarta.md`). Setiap perubahan signifikan harus merujuk pada dokumen PRD untuk menjaga konsistensi scope.

---

## Lisensi

### Kode Sumber (Source Code)
Kode sumber website (frontend + backend) dilisensikan di bawah **Apache License 2.0**.
Lihat file `LICENSE` untuk teks lengkap.

### Konten Website (Content)
Semua konten asli (teks, gambar, desain, tata letak) dilisensikan di bawah **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.
Lihat file `CONTENT_LICENSE.md` untuk detail lengkap.

### Dependency Pihak Ketiga
Daftar lengkap dependency dan lisensinya tercantum di file `THIRD_PARTY_LICENSES.md`.
File `NOTICE` menyertakan atribusi untuk komponen yang menggunakan Apache 2.0.
