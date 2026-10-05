# refactor(api): sambungkan 3 proxy route yang masih stub `501`

## Masalah

Tiga route di `apps/main-web/app/api` masih mengembalikan `501` padahal backend PHP-nya siap dan helper proxy sudah ditulis lengkap di `lib/api.ts`.

## Bukti

Pola dari hasil inspeksi route:

| Route | Status sekarang | Helper tersedia | Backend |
|---|---|---|---|
| `app/api/bk/route.ts` | stub `501` | `proxyPublicPost("bk", …)` | `backend/api/bk/index.php` ada |
| `app/api/chat/route.ts` | stub `501` | `proxyPublicPost("chat", …)` | `backend/api/chat/index.php` ada |
| `app/api/aspirasi/route.ts` | stub `501` | — (belum ada) | `backend/api/aspirasi/` ada |

Helper di `apps/main-web/lib/api.ts:167-197` — `proxyPublicPost()` sudah memvalidasi payload (field wajib string non-kosong, batas 2000 karakter, tipe body) dan memetakan error ke status 503/502.

## Dampak

- Code yang sudah ditulis tidak terpakai.
- `501` membuat integrasi yang terlihat "sudah ada" padahal belum berfungsi sama sekali (temuan F27 di `report.md`).

## Acceptance criteria

- [x] `app/api/bk/route.ts` dan `app/api/chat/route.ts` memakai `proxyPublicPost`, stub `501` dihapus
- [x] `app/api/aspirasi/route.ts` entah di-proxy atau dihapus — **jangan** tinggalkan 501 yang menyesatkan
- [x] Tidak ada route yang mengembalikan `200 []` sebagai placeholder; kalau belum diimplementasikan, kembalikan `501` + `{"error": …}` yang jujur
- [x] Status upstream diteruskan apa adanya (jangan mark 200 saat backend 5xx)
- [x] `OPTIONS` preflight tetap dikembalikan agar CORS tidak rusak

> Status 1 Okt 2026:
> - `app/api/aspirasi/route.ts` **dihapus** (opsi kedua). Alasan: `FormAspirasi`
>   masih CTA `mailto:` dan keputusan B10 (aspirasi vs pengajuan prestasi) belum
>   diambil, jadi proxy tanpa pemanggil hanya menambah kode spekulatif. Saat B10
>   diputuskan, route bisa ditambahkan lagi dengan `proxyPublicPost`.
> - `api/guru` dan `api/galeri` tidak lagi menjawab `200 []`; keduanya kini `501`
>   + `{"error": …}` yang menjelaskan jalur data sebenarnya (`lib/api` server-side).
> - `bk`/`chat`: `OPTIONS` eksplisit + helper baru `withCors()` di `_api/_lib/cors.ts`
>   memasang header CORS pada respons proxy dan error route. Terverifikasi di prod
>   server: `OPTIONS /api/bk` → 204 + `Access-Control-Allow-Origin: *`,
>   `OPTIONS /api/chat` → 204, `POST /api/bk` → 201 + header CORS.
> - **Belum disentuh:** route GET statis (`api/berita`, `api/agenda`,
>   `api/pengumuman`, `api/jadwal`) masih menyajikan salinan `lib/data.ts`.
>   Tidak ada konsumen; mengganti seluruhnya adalah pekerjaan struktur data (F21),
>   di luar cakupan issue ini.

## Referensi

`report.md` F27 · `laporan inspeksi.md` §3
