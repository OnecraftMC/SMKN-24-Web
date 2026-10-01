This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Konfigurasi Environment

Salin `.env.example` menjadi `.env.local` di folder `apps/main-web`, lalu sesuaikan URL:

- `BACKEND_URL` adalah origin backend PHP dan hanya digunakan di server.
- `NEXT_PUBLIC_ADMIN_URL` adalah URL dashboard admin untuk tombol login; default lokal `http://localhost:3001`.
- `ADMIN_ORIGIN` mendokumentasikan origin admin untuk konfigurasi monorepo.

Jangan commit `.env.local` atau nilai rahasia. Konten publik diambil dari backend; jika backend belum tersedia, halaman menampilkan status kosong/error, bukan mengklaim data contoh sebagai data sekolah.

Backend lokal dapat dijalankan dari root repository dengan `php -S localhost:8000 -t backend`; pastikan database PHP dikonfigurasi dan berjalan.

### Set env di Vercel (wajib sebelum deploy)

`next.config.ts` membaca `BACKEND_URL` saat **build**, jadi env harus diset sebelum deploy:

1. Buka Vercel → pilih project → **Settings → Environment Variables**.
2. Tambah `BACKEND_URL` (origin backend PHP yang bisa dijangkau server Vercel, mis. `https://domain.sekolah.id/backend`) dan `NEXT_PUBLIC_ADMIN_URL` (origin dashboard admin).
3. Redeploy agar nilai baru terbaca. Tanpa `BACKEND_URL`, situs tetap jalan tetapi semua konten menampilkan status "backend belum dikonfigurasi" — bukan data contoh.

`BACKEND_URL` dengan port database (3306/5432) ditolak oleh `lib/api.ts` dengan pesan error yang jelas.

## Instalasi shadcn/ui

Setelah masuk ke folder `apps/main-web` dan menjalankan `npm install`, jalankan inisialisasi satu kali:

```bash
npm run shadcn:init
```

Script tersebut menjalankan `npx shadcn@latest init`. Ikuti prompt interaktif sampai selesai agar konfigurasi dan dependensi dibuat untuk website utama. Jangan menjalankan perintah ini dari root repository atau dari folder `apps/admin`.

## Instalasi Dependensi UI

Khusus untuk website utama, jalankan dari folder `apps/main-web`:

```bash
npm run ui:install
```

Script tersebut menjalankan:

```bash
npm i clsx lucide-react motion tailwind-merge
```

Perintah ini tidak perlu dijalankan dari folder `apps/admin`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to self-host the brand font Plus Jakarta Sans.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
