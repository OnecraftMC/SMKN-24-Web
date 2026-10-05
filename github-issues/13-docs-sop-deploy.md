# docs(deploy): catat konvensi env dan SOP deploy di README/AGENTS

## Masalah

Deploy ke Vercel berhasil, tetapi **konten situs diam-diam memakai data contoh** karena `BACKEND_URL` belum diisi. Tidak ada satu pun dokumen yang menyatakan env mana yang wajib, kapan dibaca, atau bagaimana cara memverifikasinya.

## Bukti

- `apps/main-web` tidak punya `.env.example` (lihat issue 04)
- `apps/main-web/next.config.ts:4` membaca `process.env.BACKEND_URL` **saat build**, jadi perubahan env baru berlaku setelah redeploy
- `apps/main-web/lib/api.ts:33` membaca env yang sama saat runtime
- Deployment 27 Sep 2026 berjalan sukses exit 0 — dan itu sendiri menutupi bahwa data sekolah belum pernah masuk
- `apps/main-web/AGENTS.md` berisi aturan Next.js dan Ponytail, tetapi tidak ada bagian deploy

## Dampak

Kontributor berikutnya bisa menghabiskan waktu mendiagnosis "mengapa situsnya masih data lama?" tanpa petunjuk bahwa penyebabnya env, bukan kode.

## Acceptance criteria

- [ ] Bagian baru di `apps/main-web/AGENTS.md` (atau README) berisi:
  - Daftar env: `BACKEND_URL`, `NEXT_PUBLIC_ADMIN_URL`
  - Kapan masing-masing dibaca (build-time vs runtime)
  - `BACKEND_URL` harus berawalan `http://` atau `https://` dan **bukan** port MySQL (pola kesalahan yang sama sudah menimpa admin — lihat `perbaikan error dan bug.md` E.1)
  - Langkah set env di Vercel: Project → Settings → Environment Variables, lalu redeploy
  - Cara verifikasi: cek judul berita di `.next/server/app/berita.html` atau bandingkan dengan dashboard admin
- [ ] Menjelaskan perilaku fallback: tanpa `BACKEND_URL`, situs tetap jalan memakai data arsip 2024 (bukan error) — penting agar tidak disalahartikan sebagai "sudah live dengan data asli"
- [ ] Ditentukan siapa yang bertanggung jawab menyimpan kredensial, dan ditegaskan bahwa env tidak boleh masuk git

## Referensi

`perbaikan error dan bug.md` E.1, E.2 · issue 04
