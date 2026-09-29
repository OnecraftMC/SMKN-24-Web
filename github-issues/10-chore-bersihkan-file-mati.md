# chore(bersih): hapus file mati dan `dist/` legacy yang masih ter-track di git

## Masalah

Repositori menyimpan berkas yang tidak terpakai: dua file 0-byte dan seluruh folder `dist/` dari situs statis lama. Semuanya ikut ter-lint dan membingungkan pembaca kode.

## Bukti

| Path | Status | Verifikasi |
|---|---|---|
| `apps/main-web/components/berita/page.tsx` | 0 byte | `Get-ChildItem` → `Length -eq 0` |
| `apps/main-web/components/profil/FasilitasSekolah.tsx` | 0 byte | idem |
| `apps/main-web/dist/Topbar.jsx` | legacy | `git ls-files apps/main-web/dist` |
| `apps/main-web/dist/script.js` | legacy | idem |
| `apps/main-web/dist/styles.css` | legacy | idem |

`git check-ignore -v apps/main-web/dist/styles.css` → tidak di-ignore, jadi masih ikut ter-track.

Selain itu ada dependensi yang tidak terpakai: `apps/main-web/package.json` memuat `"@supabase/supabase-js"` yang tidak diimpor berkas mana pun di `apps/main-web`.

## Dampak

- Dua file 0-byte di `components/` terbaca sebagai "komponen yang belum diisi", padahal sudah ditinggalkan.
- `dist/` adalah situs statis lama yang **tidak dibangun** oleh Next.js — hanya menambah noise.
- Menggagalkan alur baca: pembaca mengejar `FasilitasSekolah.tsx` yang ternyata kosong.

## Acceptance criteria

- [ ] `git rm` dua file 0-byte
- [ ] `git rm -r --cached apps/main-web/dist` + tambahkan `dist/` ke `.gitignore`
- [ ] `npm uninstall @supabase/supabase-js` di `apps/main-web` (pastikan tidak ada impor tersisa — `grep -r "supabase" apps/main-web/app apps/main-web/components apps/main-web/lib`)
- [ ] `npm run build` dan `npm run lint` tetap hijau
- [ ] `git status` bersih setelah commit

## Catatan

Jangan ikut menghapus `packages/shared/tokens.css` atau `packages/shared/types.ts` — keduanya masih dipakai.

## Referensi

`report.md` F22
