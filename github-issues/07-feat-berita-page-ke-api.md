# feat(berita): `/berita` masih membaca data statis, tidak lewat `lib/api`

## Masalah

Lima halaman sudah membaca dari backend, tapi `/berita` masih memakai array lokal. Akibatnya `/berita` menampilkan isi berbeda dari beranda dan `/kabar` saat backend berisi data nyata.

## Bukti

- `apps/main-web/app/berita/page.tsx` — `import { beritaData, beritaUtama } from "@/lib/data"`
- Bandingkan halaman yang sudah di-wire: `app/page.tsx`, `app/profil/page.tsx`, `app/fasilitas/page.tsx`, `app/kabar/page.tsx`, `app/akademik/page.tsx` — semuanya async + `await getX()` + fallback `lib/fallback.ts`
- `apps/main-web/lib/api.ts:77-90` — `getBerita()` / `getBeritaById()` sudah tersedia

## Dampak

Dua sumber kebenaran untuk konten berita. Kontributor yang mengedit lewat dashboard admin tidak akan melihat perubahannya di `/berita`.

## Acceptance criteria

- [x] `app/berita/page.tsx` jadi async server component, memanggil `getBerita()`
- [x] Pakai pola yang sama seperti 5 halaman lain: `res.data ?? (tanpaBackend ? beritaContoh() : [])`
- [x] State loading / kosong / error ditangani (pola yang sama dengan komponen lain)
- [x] Komponen `DaftarBerita` tidak lagi meng-import `lib/data` secara langsung
- [x] Konsisten dengan `app/page.tsx` soal `limit` dan sumber data
- [x] `npm run build` exit 0

> Status 1 Okt 2026: seluruh AC terpenuhi, dengan **satu revisi keputusan**:
> `lib/fallback.ts` + `beritaContoh()` sudah dihapus pada ronde Jalur B karena
> menampilkan data contoh sebagai seolah data sekolah. Pola yang berlaku sekarang
> adalah `res.data ?? []` + status error/kosong jujur — bukan fallback arsip.
> Terverifikasi dengan backend produksi hidup: `/berita` memuat judul berita dari
> DB (2 berita), kartu detail `/berita/<slug>` 200 dan memuat `<h1>`.

## Referensi

Pola implementasi: `lib/fallback.ts` dan `app/page.tsx` (versi 27 Sep 2026)
