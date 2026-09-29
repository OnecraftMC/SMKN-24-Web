# fix(galeri): fallback galeri kosong karena asetnya data-URL base64

## Masalah

`galeriContoh()` mengembalikan array kosong, jadi section Galeri di `/kabar` menampilkan pesan status dan tidak ada satu pun foto — padahal `lib/data.ts` sebenarnya punya isi galeri.

## Bukti

- `apps/main-web/lib/fallback.ts` — `galeriContoh()` mengembalikan `[]` dengan komentar bahwa satu-satunya aset adalah data-URL base64
- `apps/main-web/lib/data.ts` — `galeriData` berisi 1 entri, `gambar` berupa `data:image/jpeg;base64,...`
- `apps/main-web/components/kabar/GaleriVisual.tsx:25` — memakai `next/image`, yang tidak melayani data-URL tanpa `unoptimized`
- Pratinjau build: `kabar.html` tidak memuat kartu galeri apa pun

## Dampak

Bagian "Dokumentasi Momen Emas Siswa" kosong di fallback. Selain itu satu-satunya foto galeri adalah base64 yang **terpotong** (lihat `laporan inspeksi.md`) sehingga sudah rusak sejak awal.

## Acceptance criteria

- [ ] either: aset galeri asli diunggah ke `backend/uploads/` atau `public/images/galeri/`, **atau** `galeriData` base64 dihapus dari `lib/data.ts` supaya tidak menyesatkan
- [ ] `galeriContoh()` mengembalikan entri dengan `image` berupa path/URL yang bisa dilayani `next/image`
- [ ] Kalau galeri sengaja kosong, pertahankan pesan status yang jujur (sudah ada) — jangan menambahkan foto placeholder palsu
- [ ] `next.config.ts` `images.remotePatterns` mengizinkan hostname backend (sudah otomatis bila `BACKEND_URL` terisi)

## Catatan

Jangan memakai foto stok sebagai "dokumentasi sekolah" — hal itu bisa menyesatkan. Gunakan foto kegiatan asli, atau biarkan kosong dengan pesan yang jujur.

## Referensi

`laporan inspeksi.md` A9 · `report.md` F10
