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

- [ ] `app/berita/page.tsx` jadi async server component, memanggil `getBerita()`
- [ ] Pakai pola yang sama seperti 5 halaman lain: `res.data ?? (tanpaBackend ? beritaContoh() : [])`
- [ ] State loading / kosong / error ditangani (pola yang sama dengan komponen lain)
- [ ] Komponen `DaftarBerita` tidak lagi meng-import `lib/data` secara langsung
- [ ] Konsisten dengan `app/page.tsx` soal `limit` dan sumber data
- [ ] `npm run build` exit 0

## Referensi

Pola implementasi: `lib/fallback.ts` dan `app/page.tsx` (versi 27 Sep 2026)
