# Dashboard Admin SMKN 24 Jakarta

Aplikasi Next.js terpisah untuk mengelola konten dan inbox website SMKN 24 Jakarta.

Aplikasi ini berbicara **langsung ke backend PHP** (`backend/`) melalui REST API
dengan autentikasi JWT — bukan melalui route `apps/main-web/app/api/*`, karena
route tersebut masih placeholder statis dan tidak meneruskan autentikasi.

## Menjalankan (development)

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev -- -p 3001
```

Website utama memakai port **3000**, sehingga dashboard admin memakai port
**3001** (CORS backend sudah mengizinkan `http://localhost:3001`).

## Environment

| Variabel | Fungsi |
|---|---|
| `NEXT_PUBLIC_API_URL` | Origin backend PHP, mis. `http://localhost/backend` |
| `NEXT_PUBLIC_MAIN_WEB_URL` | Origin website publik, untuk tautan balik dan pratinjau konten |

Jangan commit `.env.local`, token, atau secret apa pun.

## Design token

Warna, radius, spacing, dan tipografi berasal dari `packages/shared/tokens.css`
yang diimpor di `app/globals.css` — sumber yang sama dengan website publik, agar
branding admin identik dengan situs utama. **Jangan menyalin token ke aplikasi ini.**

## Struktur

```text
apps/admin/
├── app/                  # App Router (layout + halaman)
├── lib/
│   ├── api.ts            # Klien API terpusat (Bearer token, ApiError)
│   └── types.ts          # Tipe DTO sesuai kontrak backend PHP
├── public/               # Aset (logo sekolah)
└── .env.example
```

## Perintah

```bash
npm run dev      # development
npm run lint     # pemeriksaan kode
npm run build    # build production
npm run start    # menjalankan hasil build
```

## Catatan keamanan

- Token JWT disimpan di `localStorage` (kunci `smkn24-admin-token`) dan dikirim
  sebagai header `Authorization: Bearer`. Backend belum menyediakan revoke token,
  jadi logout berarti menghapus token lokal — token tetap valid sampai kedaluwarsa
  (8 jam).
- Seluruh rahasia (API key AI, `JWT_SECRET`) hanya berada di `backend/.env`.
  Jangan pernah menaruhnya di aplikasi ini.
