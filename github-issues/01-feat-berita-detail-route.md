# feat(berita): buat route detail `/berita/[slug]` — kartu berita kini 404

## Masalah

`BeritaTerkini` dan `FeaturedNews` menautkan ke `item.slug`, tetapi route yang dituju tidak pernah ada. Setiap klik "Baca Selengkapnya" / "Baca Lengkap" berakhir di halaman 404.

## Bukti

- `apps/main-web/components/beranda/BeritaTerkini.tsx:75` — `<Link href={item.slug}>`
- `apps/main-web/components/kabar/FeaturedNews.tsx:59` — `<Link href={berita.slug}>`
- `packages/shared/mappers.ts:147-149` — `beritaHref()` menghasilkan `/berita/${slugify(judul)}-${id}`
- Tabel route hasil `next build` (27 Sep 2026) memuat `/berita` tetapi **tidak** memuat `/berita/[slug]`

## Dampak

- Dua CTA berita paling menonjol di beranda dan `/kabar` selalu gagal.
- Sumber: temuan F06/F09 di `report.md`.

## Acceptance criteria

- [x] `apps/main-web/app/berita/[slug]/page.tsx` ada, menerima `params.slug`
- [x] Halaman memanggil `getBeritaById(id)` dengan `id` hasil parse dari slug
- [x] `generateMetadata()` mengembalikan judul berita
- [x] State loading / error / tidak-ditemukan ditangani jujur (bukan `alert`, bukan 404 kosong)
- [x] `notFound()` dipakai untuk slug yang tidak ada
- [x] Gambar dari backend dilayani `next/image` (butuh `BACKEND_URL` terisi — lihat issue dokumentasi env)
- [x] `npm run build` di `apps/main-web` tetap exit 0

> Status 29 Sep 2026: seluruh AC terpenuhi. Parse slug + `generateMetadata` kini berbagi
> satu helper `ambilBerita()` sehingga aturan 404 tidak diduplikasi. Terverifikasi:
> `tsc --noEmit` exit 0, `eslint` exit 0, `next build` exit 0.

## Catatan

Jangan membuat tautan mati sebagai solusi sementara (mis. arahkan ke `/kabar`) — dari sisi pengguna tautannya tetap salah. Fix yang benar adalah membuat halaman detailnya.

## Referensi

`report.md` F06, F09 · `pemindahan konteks main-web.md` §7 butir 4
