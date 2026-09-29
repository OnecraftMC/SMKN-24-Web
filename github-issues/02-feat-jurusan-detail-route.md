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

- [ ] `apps/main-web/app/jurusan/[key]/page.tsx` ada; `key` divalidasi terhadap `JurusanKey`
- [ ] `generateStaticParams()` mengulang 5 `JurusanKey` supaya halaman ter-prerender
- [ ] Halaman memuat profil jurusan: deskripsi, mata pelajaran praktik (`JADWAL_DATA[key]`), dan slot galeri kegiatan
- [ ] Slot foto mengikuti `Jurusan.gambar` (lihat `lib/types.ts:240`) — `public/images/jurusan/<key>.jpg`
- [ ] Jurusan tanpa foto menampilkan fallback yang sama dengan `DaftarJurusan` (bukan kotak rusak)
- [ ] `notFound()` untuk `key` yang tidak dikenal
- [ ] `npm run build` exit 0 dan tabel route memuat `/jurusan/[key]`

## Referensi

`implementasi.md` §7 butir 1 · `report.md` F06
