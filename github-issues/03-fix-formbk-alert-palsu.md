# fix(bk): FormBK menampilkan "diterima" padahal tidak ada yang disimpan

## Masalah

`FormBK` menampilkan pesan berhasil ke pengguna, tetapi data BK **tidak pernah dikirim ke mana pun**. Ini melanggar aturan repo: jangan menyatakan submit berhasil jika data belum tersimpan.

## Bukti

- `apps/main-web/components/akademik/FormBK.tsx:21` — `alert(\`Pengajuan konsultasi BK diterima untuk ${formData.nama} ...\`)`
- `apps/main-web/lib/api.ts:142-154` — `postBK(payload)` **sudah tersedia** tapi tidak ada pemanggil
- `apps/main-web/app/api/bk/route.ts` — masih stub `501`
- `apps/main-web/lib/api.ts:167-197` — `proxyPublicPost("bk", payload)` sudah mengimplementasikan validasi + proxy, juga belum dipakai
- `backend/api/bk/index.php` — endpoint sudah ada dan menyimpan ke tabel pesan BK

## Dampak

- Siswa/orang tua mengira pengajuan terkirim, padahal hilang.
- Data BK tidak pernah masuk database, jadi fitur ini nol nilai.
- Ini temuan F04/F12 di `report.md`.

## Acceptance criteria

- [x] `alert(...)` dihapus sepenuhnya
- [x] Submit memanggil `POST /api/bk` (proxy route) → `proxyPublicPost("bk", payload)`
- [x] Status inline `aria-live="polite"`: loading / berhasil / gagal
- [x] Tombol dinonaktifkan saat mengirim (cegah submit ganda)
- [x] Error backend ditampilkan apa adanya, tidak ditelan
- [x] `app/api/bk/route.ts` memakai `proxyPublicPost` (hapus stub 501)
- [x] Verifikasi manual: submit → cek tabel `pesan_bk` bertambah 1 row

> Status 1 Okt 2026: terverifikasi end-to-end dengan PHP + MySQL produksi.
> `POST /api/bk` lewat prod server main-web → **201** + row masuk `pesan_bk`
> (dicek via PDO, lalu row uji dihapus kembali agar tidak mengotori inbox BK).
> `OPTIONS /api/bk` → 204 dengan header CORS (issue 06).

## Referensi

`report.md` F04, F12 · `laporan inspeksi.md` §3 · `template and promt/promt3.md` B4.1–B4.2
