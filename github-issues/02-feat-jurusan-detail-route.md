# feat(jurusan): buat route detail `/jurusan/[key]` — 5 kartu jurusan 404

## Masalah

Grid bento di `/jurusan` menautkan tiap kartu ke `/jurusan/<key>`, tetapi route tersebut belum ada. Kelima kartu menghasilkan 404.

## Bukti

- `apps/main-web/components/jurusan/DaftarJurusan.tsx:81` — `<Link href={`/jurusan/${item.key}`}>`
- `apps/main-web/lib/types.ts:141` — `JurusanKey = 'perhotelan' | 'boga' | 'busana' | 'pplg' | 'pariwisata'`
- Tabel route `next build`: ada `/jurusan`, tidak ada `/jurusan/[key]`
- `implementasi.md` §1 butir 1 mencatat pemilik akan memasang berkas routing-nya sendiri

## Dampak

Seluruh tujuan utama halaman `/jurusan` mati. Ini juga membuat fetcher (`Foto kegiatan per jurusan`) tidak punya tempat.

## Acceptance criteria

- [x] `apps/main-web/app/jurusan/[key]/page.tsx` ada; `key` divalidasi terhadap `JurusanKey`
- [x] `generateStaticParams()` mengulang 5 `JurusanKey` supaya halaman ter-prerender
- [x] Halaman memuat profil jurusan: deskripsi, mata pelajaran praktik (`JADWAL_DATA[key]`), dan slot galeri kegiatan
- [x] Slot foto mengikuti `Jurusan.gambar` (lihat `lib/types.ts:240`) — `public/images/jurusan/<key>.jpg`
- [x] Jurusan tanpa foto menampilkan fallback yang sama dengan `DaftarJurusan` (bukan kotak rusak)
- [x] `notFound()` untuk `key` yang tidak dikenal
- [x] `npm run build` exit 0 dan tabel route memuat `/jurusan/[key]`

> Status 29 Sep 2026: seluruh AC terpenuhi. Fallback memakai ulang `LatarKartu`
> (di-export dari `DaftarJurusan`) sehingga identik dengan kartu daftar; halaman juga
> punya `generateMetadata`. Terverifikasi: build exit 0 dengan 5 path SSG
> (`/jurusan/{perhotelan,boga,busana,pplg,pariwisata}`), smoke test prod server —
> `/jurusan/pplg` 200 dengan `<h1>`, `/jurusan/tidak-ada` 404.

## Referensi

`implementasi.md` §7 butir 1 · `report.md` F06
