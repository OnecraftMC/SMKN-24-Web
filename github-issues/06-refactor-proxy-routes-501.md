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

- [ ] `app/api/bk/route.ts` dan `app/api/chat/route.ts` memakai `proxyPublicPost`, stub `501` dihapus
- [ ] `app/api/aspirasi/route.ts` entah di-proxy atau dihapus — **jangan** tinggalkan 501 yang menyesatkan
- [ ] Tidak ada route yang mengembalikan `200 []` sebagai placeholder; kalau belum diimplementasikan, kembalikan `501` + `{"error": …}` yang jujur
- [ ] Status upstream diteruskan apa adanya (jangan mark 200 saat backend 5xx)
- [ ] `OPTIONS` preflight tetap dikembalikan agar CORS tidak rusak

## Referensi

`report.md` F27 · `laporan inspeksi.md` §3
