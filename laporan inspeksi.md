# Laporan Inspeksi Ulang — Integrasi Publik & Fondasi Dashboard Admin SMKN 24 Jakarta

> Dokumen ini adalah hasil inspeksi ulang yang independen terhadap isi workspace.
> Ia **melengkapi** — bukan menimpa — dokumen handoff `pemindahan memori.md`.
> Klaim handoff yang keliru atau kurang presisi dikoreksi di Bagian B.

| Item | Nilai |
|---|---|
| Tanggal inspeksi | 21 September 2026 |
| Basis kode | HEAD `8060802` (`80608023f16ba39fd83b58591632e85f45135325`) |
| Branch | `agents/school-website-nextjs-tailwind-monorepo` |
| Status working tree | Bersih (hanya `pemindahan memori.md` untracked) |
| Metode | Pemeriksaan silang: endpoint backend ↔ komponen main-web ↔ route API main-web ↔ histori git (`git log/show/ls-files/ls-tree`) |
| Cakupan baca | 100% file `backend/api/*`, seluruh `apps/main-web/app/api/*`, komponen-komponen kunci, konfigurasi, `.htaccess`, `.gitignore`, `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, dua template, README |

---

## BAGIAN A — TEMUAN BARU

Temuan yang tidak ada di handoff, atau berbeda secara material dari handoff.
Legenda tingkat keparahan: 🔴 Kritis · 🟠 Tinggi · 🟡 Sedang.

### A1. 🔴 KRITIS — Website publik dan backend adalah dua pulau yang tidak tersambung sama sekali

Pencarian `fetch(` di seluruh source menghasilkan **nol hasil** — satu-satunya kemunculan string tersebut ada di contoh dokumentasi `backend/README.md`. Konsekuensi per komponen:

- `ChatbotWidget.tsx` (baris 16–27): simulasi lokal — `setTimeout` 1 detik lalu menjawab *"Baik, pertanyaan anda sedang di proses."* Tidak pernah memanggil `/api/chat`.
- `FormBK.tsx` (baris 19–24): submit hanya `alert("Pengajuan konsultasi BK diterima ...")`. Tidak ada penyimpanan ke mana pun.
- `FormAspirasi.tsx`: **bukan form** — hanya tombol `mailto:humassmkn24jakarta@gmail.com` (baris 13).

Dengan demikian tabel `pesan_bk`, `aspirasi`, `chat_sessions`, `chat_messages` **pasti kosong selamanya** sampai komponen publik diintegrasikan ke backend.

**Implikasi domino:** fitur dashboard "Inbox BK", "Aspirasi", dan "Riwayat Chatbot" hanya akan berisi data jika komponen publik terlebih dahulu disambungkan ke backend. Urutan fase di handoff perlu dikonsekuensikan: minimal integrasi publik untuk chatbot + dua form inbox harus dikerjakan lebih awal agar modul inbox dashboard punya data uji nyata.

### A2. 🔴 KRITIS — Ke-9 route API main-web adalah placeholder, dan tidak ada satu pun konsumen

Handoff menyatakan "beberapa kasus hanya mengembalikan data lokal". Kenyataannya bisa diklasifikasi lebih tegas:

| Route main-web | Isi aktual | Dipakai siapa |
|---|---|---|
| `api/berita`, `api/pengumuman`, `api/agenda`, `api/jadwal` | Data statis dari `lib/data.ts` | **Tidak ada** — komponen meng-import `lib/data` langsung |
| `api/guru`, `api/galeri` | `NextResponse.json([])` — selalu kosong | Tidak ada |
| `api/chat`, `api/bk`, `api/aspirasi` | Selalu **501** "belum terhubung" | Tidak ada |

Header CORS di `app/api/_lib/cors.ts` (`ADMIN_ORIGIN`) disiapkan untuk klien admin hipotetis, tetapi satu-satunya klien yang pernah ada (`apps/admin/lib/api.ts`) sudah dihapus — lihat A3.

### A3. 🔴 KRITIS — `apps/admin` PERNAH ADA, lalu DIHAPUS di commit `13e365e "membuat halaman dashboard baru"`

Bukti forensik: `git show 13e365e --stat` dan `git ls-tree 13e365e^` menunjukkan commit tersebut **menghapus** scaffold admin sebanyak 11 file — commit message-nya menyesatkan; yang "dibuat" sebenarnya adalah mock halaman `/login` di dalam main-web.

Isi scaffold lama (dipulihkan via `git show 13e365e^:<path>`):

- `lib/api.ts`: CRUD berita/pengumuman/agenda — tetapi **menunjuk ke route statis main-web** (`NEXT_PUBLIC_MAIN_WEB_URL`), **tanpa JWT sama sekali**, dan main-web sendiri tidak punya handler POST yang berfungsi.
- `package.json`: `next 16.3.4` + `react 19.2.8` — versi identik dengan main-web.
- `globals.css`: font **DM Sans + Space Grotesk**, warna `--ink:#14213d`, `--blue:#1d4ed8` — **bukan** identitas navy/gold SMKN 24.
- `README.md` lama: *"Admin tidak mengakses Supabase langsung"* — bukti arsitektur lama berbasis Supabase.

**Implikasi:**
1. Ada prior art yang bisa dilihat di histori, tetapi **tidak layak dipakai mentah** — sumber data salah, tanpa auth, off-brand.
2. Garis waktu arsitektur proyek: Supabase → API main-web → PHP backend. Commit penghapusan ini adalah titik perubahan strategi oleh pemilik proyek.
3. Fondasi admin harus dibangun ulang dan **mengarah langsung ke backend PHP**, bukan ke route main-web.

---

### A4. 🟠 TINGGI — Hash password seed `admin` kemungkinan besar BUKAN `admin123`

`backend/database.sql` baris 23–26: hash

```
$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
```

dengan komentar *"hash di atas adalah bcrypt untuk 'admin123'"*. Hash ini **identik dengan konstanta `bcrypt("password")`** yang sangat dikenal (dipakai sebagai default UserFactory di Laravel versi lama). PHP tidak terpasang pada mesin kerja saat ini sehingga verifikasi runtime belum dilakukan, tetapi keyakinan tinggi: **instalasi baru kemungkinan tidak bisa login dengan `admin/admin123`** seperti yang didokumentasikan pada `backend/README.md` §3.

**Cara verifikasi (mesin dengan PHP/XAMPP):**

```bash
php -r "var_dump(password_verify('admin123', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'));"
php -r "var_dump(password_verify('password', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'));"
```

Jika terbukti, perbaiki seed dengan `password_hash('admin123', PASSWORD_BCRYPT)` yang benar.

### A5. 🟠 TINGGI — Kebocoran informasi internal ke klien publik (3 titik)

1. `bootstrap.php` baris 18–22 — handler exception global mengirim `'detail' => $e->getMessage()` pada **setiap** error 500.
2. `config/database.php` baris 27–35 — kegagalan koneksi PDO mengirim `$e->getMessage()` (dapat memuat host/nama DB/driver).
3. `backend/api/chat/index.php` baris 36–39 — fallback gagal AI **menyisipkan detail teknis ke balasan yang dibaca pengunjung publik**: `"(Detail teknis: " . $e->getMessage() . ")"`.

Semuanya terekspos ke pengunjung publik, bukan hanya admin. Untuk lomba: catat ke log internal, tampilkan pesan publik generik.

### A6. 🟠 TINGGI — Kekerasan kontrak API: field penting hilang dari response GET

- `GET /api/pengumuman` — `formatRow` **tidak menyertakan `tampilBeranda`**, padahal POST/PUT menerimanya. Tanpa perbaikan ini, toggle "tampil di beranda" tidak bisa ditampilkan/diedit admin dari data GET.
- `GET /api/guru` — `formatRow` **tidak menyertakan `urutan`**, padahal POST/PUT menerimanya. Admin tidak bisa melihat/mengelola urutan direktori guru.
- `GET /api/berita` — `formatRow` mengonversi `tanggal` menjadi string tampil `date('d F Y')`: (a) bulan berbahasa Inggris ("28 October 2024"), (b) **tanggal mentah hilang** sehingga form edit admin tidak bisa mengisi `<input type="date">`.
- `GET /api/agenda` — masalah sama: `month` = `date('M')` → "DEC", padahal komponen publik menampilkan "NOV/DES" gaya Indonesia; `tglMulai`/`tglSelesai` ISO tersedia (bagus) tetapi `tanggal` tampil tetap EN.
- `GET /api/auth/me.php` — **tidak mengembalikan `nama`** (hanya `id`, `username`, `role`), padahal response login memilikinya. Nama admin di topbar harus di-cache dari login atau endpoint diperluas.
- Kontras: `GET /api/aspirasi` bahkan **tanpa mapper sama sekali** (`fetchAll()` mentah, `created_at` mentah) — inkonsisten dengan `bk` yang memetakan `no_hp → noHp`.

### A7. 🟠 TINGGI — Validasi backend yang diisyaratkan handoff ternyata TIDAK ADA

- **Agenda tidak memvalidasi `tgl_selesai >= tgl_mulai`** — `validate()` di `api/agenda/index.php` hanya memeriksa `judul` dan `tglMulai`. Rentang tanggal terbalik akan tersimpan.
- **Tidak ada rate limiting di mana pun**: `/api/auth/login.php` (brute-force), `/api/chat` (biaya API key AI + abuse), `POST /api/bk` & `/api/aspirasi` (spam — aspirasi bahkan menerima `nama`/`email` null).
- `JWT_SECRET` memiliki **fallback default** di `config/config.php` — jika `.env` tidak dibuat, token dapat dipalsukan tanpa kegagalan yang terlihat. Sebaiknya gagal keras di production.

---

### A8. 🟡 SEDANG — Konsep "Aspirasi" backend ≠ UX publik yang nyata

Backend `aspirasi` (nama/email/kategori/pesan) dirancang sebagai penerima "FormAspirasi". Kenyataan publik: `FormAspirasi.tsx` adalah CTA **"Kirim Karya & Prestasi Ananda"** via email (`mailto:humassmkn24jakarta@gmail.com?subject=Kirim%20Karya%20%2F%20Prestasi%20Siswa`).

Koneksi silang: konsep "kirim karya/prestasi" ini **identik dengan fitur "pengajuan prestasi"** yang direncanakan untuk resource `prestasi_pengajuan` (Fase 5 handoff). Artinya ada dua pilihan desain yang harus diputuskan pemilik proyek sebelum Fase 4/5:

1. `aspirasi` dijadikan inbox pesan/aspirasi umum — perlu form publik baru dibuat;
2. alur "kirim karya/prestasi" dipetakan ke resource `prestasi` yang belum ada (schema + endpoint baru).

Jangan memaksanya ke `aspirasi` maupun langsung ke `galeri`.

### A9. 🟡 SEDANG — Chatbot backend sudah matang dan MEMBACA data konten — aset tersembunyi

`backend/api/chat/index.php` bukan stub:

- 3 provider (OpenAI / Gemini / Anthropic) dipilih via `AI_PROVIDER` di `.env`;
- kontinuitas percakapan: 10 pesan terakhir dikirim ulang ke model;
- **`buildSchoolContext()` menyuntikkan 3 pengumuman + 3 agenda terbaru dari DB ke system prompt**.

Artinya: begitu admin mengelola pengumuman/agenda, jawaban chatbot ikut membaik — ini alur admin→publik yang nyata tanpa kode tambahan. Integrasi frontend tinggal mengganti `sendMessage` simulasi dengan POST ke endpoint ini (polanya sudah ditulis di `backend/README.md` §6–7). Prasyarat: API key diisi di `backend/.env`, dan idealnya rate limit (lihat A7) agar kuota AI tidak terkuras.

### A10. 🟡 SEDANG — Ekosistem file mati di repository

- **`@supabase/supabase-js`** terpasang di `apps/main-web/package.json` tetapi **tidak pernah di-import** di source mana pun (bekas era Supabase — lihat A3).
- **`apps/main-web/dist/`** (`Topbar.jsx`, `script.js`, `styles.css`) — sisa situs statis lama, dan **ter-track di git**.
- **`components/profil/FasilitasSekolah.tsx`** — **yatuama**: tidak di-import oleh halaman/komponen mana pun. Halaman `/profil` dan `/fasilitas` keduanya memakai `FasilitasKampus`. Handoff menampilkannya sebagai komponen wajib dibaca — klaim tersebut keliru.
- **`components/berita/page.tsx`** — file kosong (0 baris).
- **Template login & dashboard ter-track git** meski sudah masuk `.gitignore` (aturan ignore ditambahkan setelah file ter-commit; `git rm --cached` tidak pernah dijalankan, sehingga file tetap muncul di diff).
- **`main-web/.npmrc`** berisi `dangerously-allow-all-scripts=true` (dipasangkan dengan field non-standar `"allowScripts"` di `package.json`) — kompromi supply-chain yang perlu disadari; jangan ditiru di aplikasi admin.
- **`komponen navbar.md`** di-ignore tetapi filenya tidak ada; `apps/main-web/"template and promt"` sama — aturan ignore untuk file yang tidak pernah ada.

### A11. 🟡 SEDANG — Peta sumber data statis per komponen (lebih presisi dari handoff)

| Komponen | Sumber data | Catatan mapping / masalah |
|---|---|---|
| `BeritaTerkini` | `lib/data.ts` → `beritaData` (client) | `alt={item.kategori}` — **alt text salah isi** (aksesibilitas) |
| `PapanPengumuman` | `pengumumanBerandaData` | icon Material Symbols ("attach_file", "schedule"), variant "secondary"/"default", status "Mendesak" — persis kolom DB `pengumuman` |
| `AgendaKegiatan` | `agendaBerandaData` | `day`+`month` dihitung frontend; backend mengirim bulan EN ("DEC") |
| `FeaturedNews` | Array lokal `beritaUtama` di dalam komponen (bukan `data.ts`) | Statistik palsu hardcoded **"1.420 Pembaca"**; tombol "Baca Lengkap" tanpa tujuan — **tidak ada halaman detail berita sama sekali** |
| `GaleriVisual` | Array lokal di dalam komponen | Field EN (`title`/`category`) ≠ DB (`judul`/`kategori`); gambar base64 **terpotong → rusak** |
| `DewanGuru` | Array lokal di dalam komponen | Field EN (`name`/`title`/`desc`/`category`); kategori lowercase `pimpinan/keahlian/bk` vs DB `Pimpinan/Keahlian/BK`; **filter "Pembimbing"/"TU" tidak punya data** |
| `FasilitasKampus` | Array lokal (dipakai di 2 halaman: `/profil` & `/fasilitas`) | Field EN (`title`/`desc`) ≠ DB (`judul`/`deskripsi`); memakai `<img>` biasa |
| `JadwalMatriks` | Array lokal di dalam komponen | Header jam **hardcoded** "07.30–08.30" dst., padahal DB punya kolom `jam`/`waktu`/`guru` yang tidak pernah tampil di publik |
| `KalenderUnduhan` | Array lokal di dalam komponen | "Unduh" = generate `.txt` via Blob berisi alamat sekolah — bukan dokumen asli |
| `SambutanKepsek`, `Hero`, `QuickHighlights`, dll. | Hardcoded di komponen | Di luar cakupan resource backend saat ini |

Kesimpulan peta: field presentasional berbahasa Inggris (`name/title/desc/category/title/desc`) vs field backend berbahasa Indonesia (`nama/jabatan/deskripsi/kategori/judul`) menegaskan kebutuhan **mapper eksplisit** — bukan mengubah nama field di salah satu sisi.

### A12. 🟡 SEDANG — Kualitas build & hygiene

- `main-web/next.config.ts` → `typescript.ignoreBuildErrors: true` — type safety dilumpuhkan saat build; **jangan ditiru** di aplikasi admin.
- `README.md` root → bagian admin menyebut `cd ../admin` dan env `NEXT_PUBLIC_MAIN_WEB_URL` untuk admin — **dokumen sudah usang** terhadap arsitektur PHP backend (lihat A3); perlu direvisi saat admin dibangun. Frasa "dari folder root proyek" untuk `cd ../admin` juga menyesatkan.
- `packages/shared` bukan package npm (tanpa `package.json`); `apps/main-web/lib/types.ts` adalah duplikat identik dari `packages/shared/types.ts`; keduanya berkomentar merujuk `components/admin/pages/*` yang **tidak pernah ada** — komentar types ditulis untuk admin yang direncanakan, bukan untuk yang ada.
- `.htaccess` backend sudah tepat (blokir `.env/.sql/.md`, tolak `config/`, larang eksekusi `.php` di `uploads/`) — **hanya berlaku Apache**; Nginx perlu padanan manual (README sudah mengingatkan).
- `UPLOAD_URL_BASE` di-hardcode `/backend/uploads/` — asumsi path deployment perlu dijadikan env atau didokumentasikan.
- **A19 🟡 SEDANG (BARU, ditemukan saat Slice 3) — `GET /api/jadwal?admin=1` mengembalikan baris PDO mentah tanpa formatter.** Endpoint admin jadwal membalas `$stmt->fetchAll()` apa adanya, sehingga `id` dan `urutan` tiba di klien sebagai **string** — tidak konsisten dengan `JadwalRowDTO` (integer) dan dengan semua endpoint lain yang melewati `formatRow`. Dampak: pengurutan/perbandingan numerik di klien rawan salah (mis. `"10" < "9"`). **Sudah diperbaiki pada implementasi Slice 3** dengan `formatAdminRow()` (cast `id`/`urutan` ke int) — lihat Bagian H. Jalur publik (matriks `?jurusan=`) tidak terpengaruh karena hanya memuat nama mapel.

---

## BAGIAN B — KOREKSI KLAIM HANDOFF (`pemindahan memori.md`)

| # | Klaim handoff | Status | Koreksi |
|---|---|---|---|
| 1 | "`apps/admin` belum tersedia" | ⚠️ Setengah benar | Benar di working tree, tetapi **pernah ada dan dihapus** di `13e365e` (lihat A3) |
| 2 | "Komponen publik memakai data statis; beberapa route API hanya data lokal" | ⚠️ Terlalu lembut | **Semua 9 route** placeholder (4 statis, 2 kosong, 3 selalu-501) dan **tidak dikonsumsi siapa pun**; nol `fetch()` di source (A1–A2) |
| 3 | "Jadwal belum punya PUT; hindari hapus-lalu-insert" | ⚠️ Perlu revisi | `POST /api/jadwal` = **upsert** `ON DUPLICATE KEY UPDATE` — edit slot tunggal sudah aman hari ini; kebutuhan nyata hanya **reorder/bulk transaksional** |
| 4 | "Validasi penting: tanggal selesai tidak boleh mendahului" (agenda) | ❌ Salah | Tidak ada validasi tersebut di backend (A7) |
| 5 | "Agenda yang tampil di beranda harus dapat dipreview" | ✅ + celah | Endpoint `?beranda=1` ada; tetapi response pengumuman tidak punya `tampilBeranda` (A6) |
| 6 | Endpoint berita/pengumuman/agenda/guru/galeri/bk/aspirasi/chat dsb. | ✅ Benar | Sesuai hasil inspeksi |
| 7 | "Komponen `FasilitasSekolah` penting dibaca" | ❌ Salah | Yatuama — tidak di-import (A10) |
| 8 | `FormAspirasi` dianggap form pengirim aspirasi | ❌ Salah | Mailto CTA "Kirim Karya" — semantik berbeda dari tabel `aspirasi` (A8) |
| 9 | "Verifikasi CORS localhost:3000/3001" | ✅ Sudah beres | `ALLOWED_ORIGINS` di `config/config.php` sudah memuat keduanya |
| 10 | "Login memakai username+password" | ✅ Benar | Sesuai backend; tambahan: halaman login publik justru memakai label *email* dan tidak memanggil API |
| 11 | Gap arsip & prestasi belum ada | ✅ Benar | Tidak ada tabel/endpoint; ditambah konteks A8 (prestasi ≈ "kirim karya") |

---

## BAGIAN C — TEMUAN HANDOFF YANG TETAP SAH

- **Gap D (arsip)** — benar: `KalenderUnduhan` hanya generate `.txt` via Blob (A11); tidak ada tabel/endpoint arsip; jangan menyalahgunakan endpoint upload gambar.
- **Gap F (satu highlight)** — benar: schema `berita.utama` tidak unik dan endpoint tidak menegakkan satu-highlight.
- **Gap G (login publik)** — benar: `/login` main-web adalah mock (label email, tanpa panggilan API, redirect ke `/admin` yang tidak ada); navbar link `/jurusan` dan `/berita` adalah **dead link** (route tidak ada); `components/berita/page.tsx` kosong.
- **Gap H (template)** — benar: template login butuh shadcn/react-hook-form/zod/framer-motion yang tidak ada; template dashboard hanya butuh `lucide-react` (sudah ada) + kelas token `bg-card`/`text-muted-foreground` yang harus didefinisikan di theme admin.
- Kriteria akuntabilitas §11 (type safety, error eksplisit, konfirmasi destruktif, aksesibilitas, dll.) — sah dan dipakai sebagai standar.

---

## BAGIAN D — IMPLIKASI KE RENCANA (pemutakhiran daftar task backend)

Daftar mikro-fix backend diperbarui dan diurutkan ulang berdasarkan temuan Bagian A:

| ID | Fix | File | Kapan |
|---|---|---|---|
| B1 | `me.php` kembalikan `nama` | `api/auth/me.php` | Slice 1 (login) |
| B2 | `formatRow` berita/pengumuman/agenda → kembalikan tanggal ISO mentah; bulan Indonesia diformat di frontend | 3 endpoint | Slice 2 |
| B3 | `formatRow` pengumuman + `tampilBeranda` | `api/pengumuman/index.php` | Slice 2 |
| B4 | `formatRow` guru + `urutan` | `api/guru/index.php` | Slice 3 |
| B5 | Validasi backend `tgl_selesai >= tgl_mulai` | `api/agenda/index.php` | Slice 2 |
| B6 | Satu-highlight transaksional saat set `utama=1` | `api/berita/index.php` | Slice 2 |
| B7 | **Baru** — bersihkan kebocoran `detail` (bootstrap, database.php, fallback chat) | 3 file | Slice 0/1 |
| B8 | **Baru** — verifikasi/perbaiki hash seed admin; wajib ganti `JWT_SECRET`; gagal keras jika secret masih default | `database.sql`, `config/config.php` | Slice 0 |
| B9 | **Baru** — rate-limit dasar login/chat/form publik | backend | Slice 1 (login), Slice 2 (chat) |
| B10 | **Baru** — keputusan arah `aspirasi` vs resource `prestasi` (A8) | keputusan desain | Sebelum Fase 4/5 |
| B11 | (ditunda) endpoint bulk/transaksional jadwal untuk reorder | `api/jadwal/` | Slice 3 |

Prioritas integrasi publik minimum agar inbox dashboard punya data nyata:
**chatbot + FormBK + form aspirasi/karya** harus hidup lebih awal (A1/A9).

Keputusan arsitektur yang harus dikunci lebih dulu:
**Admin memanggil PHP backend langsung** (`NEXT_PUBLIC_API_URL`), bukan route API main-web —
route main-web statis/tanpa auth, dan scaffold admin lama justru melangkahi backend (A2/A3).

---

## BAGIAN E — KESIMPULAN

Proyek ini saat ini adalah **backend yang hampir lengkap dan cukup rapi** berhadapan dengan **frontend publik yang 100% teater** — semua interaksi simulasi, sebagian gambar rusak (base64 terpotong), ada statistik palsu — dan **admin yang pernah dibangun lalu dibongkar** dengan arah yang salah (data statis, tanpa auth, off-brand).

Handoff tetap menjadi acuan fitur yang baik, tetapi 11 koreksinya (Bagian B) harus diikuti — terutama:

1. jadwal sudah bisa diedit per-slot tanpa endpoint baru;
2. validasi agenda tidak ada di backend;
3. `FormAspirasi` bukan form, dan konsep "kirim karya" lebih dekat ke fitur prestasi;
4. yang paling menentukan: **admin harus mengarah langsung ke PHP backend**, karena scaffold lama melangkahi backend dan route main-web tidak layak jadi sumber data.

Langkah pertama yang disarankan saat masuk mode implementasi: **Slice 0 yang diperluas** — scaffold `apps/admin` baru + API client ke backend + perbaikan backend paling awal (B7 keamanan, B8 kredensial), karena sumber data dan keamanan adalah dua fondasi yang tidak boleh menunggu.

---

## BAGIAN F — LOG IMPLEMENTASI SLICE 0 (DIPERLUAS)

> Bagian ini ditulis setelah pekerjaan kode dimulai: catatan kemajuan, temuan baru yang
> hanya muncul saat implementasi, dan bukti verifikasi.

### F.1 Yang dikerjakan

1. **Perbaikan keamanan backend (B7)** — detail exception tidak lagi dikirim ke klien:
   `bootstrap.php`, `config/database.php`, dan fallback `api/chat/index.php` kini mencatat
   detail ke `error_log` server dan mengirim pesan umum ke pengguna.
2. **Perbaikan kredensial (B8)**:
   - `database.sql` tidak lagi menyisipkan akun admin dengan hash yang tidak terverifikasi;
   - tool CLI baru: `backend/tools/create-admin.php` (buat/perbarui akun admin) dan
     `backend/tools/hash-password.php` (generator hash), dilindungi `tools/.htaccess`;
   - `APP_ENV` baru di `config/config.php` + `.env.example`; ketika `production` dan
     `JWT_SECRET` masih kosong/default, server **menolak melayani request** (fail-fast);
   - `backend/README.md` §3 diganti menjadi panduan "Membuat Akun Admin Pertama".
3. **Ekstraksi design token** — `packages/shared/tokens.css` menjadi satu-satunya sumber
   token visual; `apps/main-web/app/globals.css` mengimpornya dan blok `@theme inline`
   duplikat dihapus.
4. **Scaffold `apps/admin`** (Slice 0): `package.json`, `tsconfig.json`, `next.config.ts`,
   `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore`, `.env.example`, `README.md`,
   `app/globals.css`, `app/layout.tsx`, `app/page.tsx` (halaman uji koneksi backend),
   `lib/api.ts` (klien API terpusat), `lib/types.ts` (DTO sesuai kontrak backend), dan
   `public/logo-smkn24.png`.
5. **Konfigurasi Turbopack** di kedua aplikasi agar impor token dari `packages/shared` diizinkan.

### F.2 Berkas yang berubah / ditambah

| Status | Berkas |
|---|---|
| Diubah | `backend/bootstrap.php`, `backend/config/config.php`, `backend/config/database.php`, `backend/api/chat/index.php`, `backend/database.sql`, `backend/.env.example`, `backend/README.md` |
| Diubah | `apps/main-web/app/globals.css`, `apps/main-web/next.config.ts` |
| Baru | `packages/shared/tokens.css` |
| Baru | `apps/admin/**` (14 berkas, termasuk `package-lock.json`) |
| Baru | `backend/tools/hash-password.php`, `backend/tools/create-admin.php`, `backend/tools/.htaccess` |

### F.3 Temuan baru saat implementasi

- **A13 🟠 TINGGI — Turbopack menolak impor CSS di luar project root.** Build admin gagal dengan
  `FileSystemPath("").join("../../packages/shared/tokens.css") leaves the filesystem root`.
  Jadi rencana "impor token via path relatif ke `packages/shared`" **tidak cukup** pada
  Next 16 + Turbopack. Solusi terpakai: `turbopack: { root: <root monorepo> }` pada
  `next.config.ts` **kedua** aplikasi. Siapa pun yang menambah impor lintas-paket harus tahu
  setelan ini.
- **A14 🟡 SEDANG — Perilaku `@theme inline` Tailwind 4.** Dari CSS hasil build terbukti
  Tailwind mengemit definisi variabel **hanya untuk token yang direferensikan** melalui
  `var(--color-*)` — yang terdefinisi: `--color-surface`, `--color-on-surface`,
  `--color-secondary` (tepat tiga yang dipakai), sedangkan `--color-primary` tidak ada karena
  hanya dipakai lewat utilitas. Kesimpulan: `var(--color-x)` aman dipakai, tetapi tema bukan
  "kamus variabel" runtime — jangan mengandalkan variabel yang tidak pernah direferensikan.
- **A15 🟡 SEDANG — `npm install` gagal `ENOTEMPTY` (errno -4051) di Windows** pada paket besar
  (`lucide-react`, `@typescript-eslint/scope-manager`). Yang menyelesaikan: hapus
  `node_modules` + `npm cache clean --force`, lalu ulangi instalasi. Layak dicatat di README
  kontributor.
- **A16 🟡 SEDANG — Jebakan `*/` di dalam komentar JSDoc.** Menulis `backend/api/*/index.php`
  di dalam blok `/** ... */` menutup komentar lebih awal sehingga gagal tipe (`TS1443`).
  Hindari pola `*/` di komentar; tulis `backend/api/<nama-resource>/index.php`.
- **A17 🟠 TINGGI (BARU) — Website publik tidak pernah memuat font Plus Jakarta Sans.**
  `apps/main-web/app/layout.tsx` hanya memuat Material Symbols, sedangkan `globals.css`
  memaksa `body { font-family: Arial, Helvetica, sans-serif; }` — sementara seluruh token
  `--font-*` menyebut "Plus Jakarta Sans". Jadi situs publik tampil dengan font fallback,
  bukan font brand. Admin sudah dimuat dengan benar (Google Fonts link di root layout).
  **Rekomendasi:** muat font di `main-web` (link yang sama, atau `next/font`) lalu hapus
  `font-family: Arial`; perlu pemeriksaan visual karena metrik font berubah.
- **A18 🟡 SEDANG — `.gitignore` aplikasi dapat menelan `.env.example`.** Aturan `.env*`
  di `apps/admin/.gitignore` membuat template contoh ikut terabaikan (aturan negasi
  `!.env.example` hanya ada di `.gitignore` root). Sudah diperbaiki dengan menambahkan negasi
  eksplisit di `apps/admin/.gitignore`. Pola yang sama perlu diperiksa di aplikasi berikutnya.

### F.4 Verifikasi yang sudah dijalankan

| Verifikasi | Hasil |
|---|---|
| `npm install` di `apps/admin` | Berhasil (setelah bersihkan `node_modules` + cache npm) |
| `npm run lint` di `apps/admin` | **0 masalah** — error `react-hooks/set-state-in-effect` dan warning `@next/next/no-page-custom-font` sudah diperbaiki |
| `npm run build` di `apps/admin` | **Berhasil** — TypeScript lolos, rute `/` dan `/_not-found` ter-prerender |
| `npm ci` + `npm run build` di `apps/main-web` | **Berhasil** — seluruh rute publik tetap terbentuk (beranda, profil, akademik, kabar, fasilitas, login, API) |
| Token di CSS hasil build | Terverifikasi di kedua aplikasi: nilai `#00142f`, utilitas `.bg-surface` / `.text-primary`, variabel `--color-*` yang direferensikan, dan `Plus Jakarta Sans` ada di bundle CSS |
| `git check-ignore` | `node_modules`, `.next`, `.env.local` terabaikan; `.env.example` ikut ter-commit |

### F.5 Belum dapat diverifikasi di lingkungan ini (wajib dicek pemilik proyek)

1. **PHP tidak terpasang** di mesin agen, sehingga `php -l` untuk berkas PHP yang diubah belum
   dijalankan. Seluruh perubahan PHP sudah ditinjau manual; jalankan pemeriksaan sintaks di XAMPP.
2. **Koneksi admin → backend belum diuji end-to-end** karena MySQL/backend belum menyala.
   Setelah `php tools/create-admin.php` dijalankan dan backend aktif, buka
   `http://localhost:3001` — halaman fondasi akan menampilkan "Terhubung" atau pesan error
   eksplisit (tidak pernah sukses palsu).
3. **Pemeriksaan visual** (font, warna, spacing, responsivitas) main-web & admin belum bisa
   dilakukan agen.

### F.6 Langkah berikutnya — Slice 1

1. Login JWT (`POST /api/auth/login.php`) + penyimpanan token + penanganan 401/kedaluwarsa.
2. Auth guard dan redirect; tampilkan profil admin dari response login (B1 menyusul).
3. Shell dashboard: sidebar bergrup (Overview / Konten Website / Akademik / Inbox & Moderasi /
   Monitoring / Pengaturan) dengan collapse desktop + drawer mobile, topbar, breadcrumb.
4. Overview dari data nyata, tiap kartu punya loading/error/empty state sendiri.

---

### F.7 Pembaruan lanjutan — koneksi database via `.env`

- `backend/config/database.php` kini membaca `DB_HOST`, `DB_PORT`, `DB_NAME`,
  `DB_USER`, `DB_PASS`, `DB_CHARSET` dari `.env` (default tetap cocok untuk XAMPP:
  localhost/root/smkn24, port 3306 ditambahkan ke DSN).
- `.env.example` mendapat blok `DB_*` dengan contoh lokal dan Hostinger
  (hostname dari hPanel → Remote MySQL, bukan URL phpMyAdmin; nama DB/user
  berawalan akun, contoh `u104889167_admin_dash_24`).
- `backend/README.md` §2 diperbarui: cara import skema di shared hosting (hapus
  `CREATE DATABASE`/`USE` sebelum import), dan tiga preset koneksi
  (lokal / Hostinger co-located / Hostinger remote) — remote butuh whitelist IP
  yang berubah-ubah bila IP ISP dinamis.
- Alasan: pemilik proyek memakai DB Hostinger untuk development/pengujian, dan
  berpindah lokal ↔ hosting tidak boleh lagi menyentuh kode.

---

## BAGIAN G — LOG IMPLEMENTASI SLICE 2 (KONTEN BERANDA)

> Slice 2 fokus pada konten yang langsung terlihat di beranda: berita + highlight,
> pengumuman + papan informasi, agenda, dan upload gambar.

### G.1 Yang dikerjakan

**Backend (memenuhi B2, B3, B5, B6):**

1. **B2 — tanggal ISO disertakan berdampingan.** `formatRow` berita dan pengumuman kini
   mengirim `tanggalIso` (`YYYY-MM-DD`) di samping `tanggal` yang tetap berformat
   tampil. Agenda memang sudah mengirim `tglMulai`/`tglSelesai` ISO. Pendekatan
   berdampingan dipilih agar pemakaian lama (yang membaca `tanggal`) tidak pecah.
2. **B3 — `tampilBeranda` akhirnya dikirim GET.** Ditambahkan pada `formatRow`
   pengumuman **dan** agenda (agenda juga belum mengirimnya).
3. **B5 — validasi rentang agenda.** `validate()` agenda kini menolak `tglSelesai`
   yang mendahului `tglMulai` dengan pesan 400 eksplisit:
   `"Tanggal selesai tidak boleh mendahului tanggal mulai"`.
4. **B6 — kebijakan satu highlight ditegakkan backend.** `handleCreate`/`handleUpdate`
   berita dibungkus transaksi: bila `utama=1`, baris `utama=1` lain dinolkan dalam
   transaksi yang sama (rollback bila gagal). Update juga memeriksa keberadaan id
   lebih dulu sehingga pesan 404 tidak lagi kabur ("tidak ditemukan atau tidak ada
   perubahan").
5. **Validasi format tanggal & status.** `tanggal`/`tglMulai` harus `YYYY-MM-DD`;
   status berita harus `draft`/`terbit`.

**Admin (3 modul + komponen bersama):**

6. `lib/api.ts` — tambah `API_ORIGIN`, `assetUrl()` (path `/backend/uploads/...`
   ditempel ke origin backend), dan `apiUpload()` untuk multipart (FormData tidak
   memakai `Content-Type: application/json` manual).
7. `lib/upload.ts` — `validateImageFile()` + `uploadImage()` (allowlist MIME,
   maksimum 5 MB, field `gambar`) dengan pesan Bahasa Indonesia.
8. `lib/format.ts` — `todayIso()`, `formatDateId()`, `formatDateRangeId()`,
   `agendaTiming()` sehingga bulan tidak lagi muncul berbahasa Inggris di admin.
9. `components/ui/FormBits.tsx` — kelas field/tombol bersama, `Field`, `Modal`
   (overlay + Escape), `ConfirmDialog`, `ListState` (memuat/galat + tombol ulang/kosong).
10. `components/ui/ImageField.tsx` — pilih/unggah/ganti/hapus gambar + pratinjau,
    status unggah, dan galat eksplisit.
11. `app/(dashboard)/berita/` — daftar + cari + filter status, urut tanggal,
    tombol **Utamakan/Batalkan** per baris, dialog tambah/edit (judul, kategori,
    tanggal, status, highlight, gambar, ringkasan, isi), hapus dengan konfirmasi.
12. `app/(dashboard)/pengumuman/` — daftar + cari + filter tampil beranda, toggle
    **Tampil/Tidak tampil** di baris, **pratinjau kartu beranda** menyerupai
    `PapanPengumuman.tsx`, dialog lengkap (badge, status, ikon, action icon, varian,
    link label/href, penting, gambar).
13. `app/(dashboard)/agenda/` — daftar kartu tanggal Indonesia, badge
    **Mendatang/Hari ini/Terlewat**, toggle tampil beranda, filter waktu, dialog
    dengan validasi rentang tanggal di klien yang mencerminkan aturan backend.
14. Sidebar: `/berita`, `/pengumuman`, `/agenda` diaktifkan (`ready: true`).

### G.2 Berkas yang berubah / ditambah

| Status | Berkas |
|---|---|
| Diubah | `backend/api/berita/index.php`, `backend/api/pengumuman/index.php`, `backend/api/agenda/index.php` |
| Diubah | `apps/admin/lib/api.ts`, `apps/admin/lib/types.ts`, `apps/admin/components/shell/Sidebar.tsx` |
| Baru | `apps/admin/lib/upload.ts`, `apps/admin/lib/format.ts` |
| Baru | `apps/admin/components/ui/FormBits.tsx`, `apps/admin/components/ui/ImageField.tsx` |
| Baru | `apps/admin/app/(dashboard)/berita/{page,BeritaDialog}.tsx`, `apps/admin/app/(dashboard)/pengumuman/{page,PengumumanDialog}.tsx`, `apps/admin/app/(dashboard)/agenda/{page,AgendaDialog}.tsx` |

### G.3 Keputusan teknis yang perlu diketahui

- **ISO berdampingan, bukan mengganti `tanggal`.** Menghindari pemecahan konsumen
  lama; admin memakai field ISO untuk `input type="date"`.
- **Highlight tunggal adalah tanggung jawab backend**, bukan UI. PUT berita bersifat
  mengganti seluruh kolom, jadi baris lain harus punya `utama=0` di server.
- **`apiUpload` terpisah dari `apiRequest`.** Keduanya berbagi pembacaan galat `{ error }`.
- **Validasi ganda.** Klien memvalidasi untuk umpan balik cepat; backend tetap
  validator final (termasuk MIME/ukuran file).
- **Gambar backend memakai path relatif** (`/backend/uploads/...`), sehingga semua
  tampilan admin memakai `assetUrl()` — penting saat origin backend ≠ origin admin.

### G.4 Verifikasi

Sesuai permintaan pemilik proyek, **lint/build tidak dijalankan oleh agen pada Slice 2**
(pemilik memeriksa manual). Yang dilakukan agen hanya review kode statis internal.

Perintah yang disarankan untuk pemilik:

```powershell
cd apps\admin
npm run lint
npm run build
```

Di mesin dengan PHP (XAMPP):

```powershell
php -l backend\api\berita\index.php
php -l backend\api\pengumuman\index.php
php -l backend\api\agenda\index.php
php backend\tools\check-db.php
```

Checklist uji manual end-to-end:

1. Login → **Berita**: tambah draft, terbitkan, klik **Utamakan** pada dua berita
   berbeda → hanya satu yang bertanda Utama (dicek juga lewat `GET /api/berita`).
2. **Pengumuman**: toggle **Tampil** pada satu baris → pratinjau kartu beranda ikut
   berubah; `GET /api/pengumuman?beranda=1` memuat item tersebut (bukti B3 terpasang).
3. **Agenda**: isi tanggal selesai lebih awal → ditolak dengan pesan 400 dari backend
   (dan sudah dicegat di klien lebih dulu) — bukti B5.
4. **Upload gambar**: unggah `.txt` → ditolak di klien; gambar > 5 MB → ditolak;
   JPG valid → pratinjau muncul dan tersimpan setelah simpan.
5. Hapus satu item per modul → dialog konfirmasi muncul, dapat ditutup Escape.

### G.5 Catatan & risiko yang belum ditutup

- **File gambar yatim.** Mengganti/menghapus gambar tidak menghapus berkas lama di
  `backend/uploads/` — belum ada endpoint hapus file. Kemungkinan masuk Slice 6
  (sapu berkas tak terpakai) — perlu keputusan pemilik.
- **Kategori masih teks bebas** (berita/pengumuman/guru). Integrasi publik nanti
  perlu pemetaan kategori agar filter situs publik konsisten.
- **`month` agenda masih singkatan Inggris dari backend**; admin sudah memformat
  tanggal sendiri, tetapi komponen publik nanti wajib memakai peta bulan Indonesia.
- **Belum tersentuh:** riwayat chatbot, inbox, arsip, prestasi, kalender akademik
  (Slice 4–5), dan keputusan B9/B10 (`ready` vs rute, mock/galeri/statis) yang masih
  menunggu pemilik.

---

## BAGIAN H — LOG IMPLEMENTASI SLICE 3 (PROFIL & AKADEMIK INTI)

> Slice 3 mencakup direktori guru, fasilitas, galeri, dan jadwal per program keahlian —
> **admin + backend saja** (wiring komponen publik ditunda sesuai keputusan pemilik proyek).

### H.1 Yang dikerjakan

**Backend (memenuhi B4 + perbaikan terkait):**

1. **B4 — `formatRow` guru kini mengirim `urutan`** (integer). Sebelumnya kolom hanya
   diterima POST/PUT tetapi tidak pernah dikembalikan GET, sehingga admin tidak bisa
   menampilkan/mengedit urutan tampil.
2. **Existence-check pada lima endpoint update** — `guru`, `galeri`, `fasilitas`, plus
   `pengumuman` dan `agenda` yang terlewat saat Slice 2. `rowCount() === 0` tidak lagi
   dianggap "tidak ditemukan": SELECT id dulu, 404 hanya bila id benar-benar absen.
   Sebelumnya, simpan/toggle tanpa perubahan nilai melempar 404 palsu ke UI.
3. **A19 — `GET jadwal?admin=1` dipetakan lewat `formatAdminRow()`**: `id` dan `urutan`
   di-cast ke integer (sebelumnya string dari baris PDO mentah).
4. **Validasi `urutan` jadwal 0–4 (integer)** di `handleUpsert`, dan `urutan` guru
   bilangan bulat ≥ 0 di `validate()` — backend tetap validator final.

**Admin (empat modul baru):**

5. **Guru** — `app/(dashboard)/guru/`: tabel foto-bulat (`assetUrl`)/nama/jabatan/
   kategori/urutan, cari nama+jabatan, filter kategori turunan dari data, dialog CRUD
   dengan `ImageField` foto + `urutan` + datalist saran (Pimpinan/Keahlian/BK/
   Pembimbing/TU), dan **pratinjau kartu publik** meniru `DewanGuru.tsx`.
6. **Fasilitas** — `app/(dashboard)/fasilitas/`: grid kartu meniru `FasilitasKampus.tsx`
   (gambar h-52 + judul + deskripsi; kartu daftar = pratinjau layout sekaligus), cari
   judul/deskripsi, dialog judul+deskripsi+gambar, hapus berkonfirmasi.
7. **Galeri** — `app/(dashboard)/galeri/`: grid `aspect-square`, cari + filter kategori
   turunan, dialog judul/kategori/**gambar wajib** (mencerminkan `validate()` backend),
   hapus berkonfirmasi, dan penanda "dokumentasi, bukan pengajuan prestasi" (peringatan
   handoff §5).
8. **Jadwal** — `app/(dashboard)/jadwal/`: tab 5 program keahlian × toggle sesi
   pagi/siang; tabel slot (urutan/jam/mapel/waktu/guru) dengan tambah/edit/hapus per
   baris; pilihan urutan sudah terisi dinonaktifkan (guard klien terhadap timpa-slot);
   **pindah urutan** = POST slot baru lalu DELETE slot lama, dengan penanganan galat
   parsial (dialog tetap terbuka + daftar di-refresh, tidak pernah sukses palsu); dan
   **pratinjau matriks** meniru `JadwalMatriks.tsx` tetapi header kolom memakai `jam`
   nyata dari database.
9. **Sidebar** — `/guru`, `/fasilitas`, `/galeri`, `/jadwal` → `ready: true`. Overview
   tidak diubah: kartu guru/fasilitas/galeri memang sudah data-driven sejak Slice 1.

### H.2 Berkas yang berubah / ditambah

| Status | Berkas |
|---|---|
| Diubah | `backend/api/guru/index.php`, `backend/api/galeri/index.php`, `backend/api/fasilitas/index.php`, `backend/api/pengumuman/index.php`, `backend/api/agenda/index.php`, `backend/api/jadwal/index.php` |
| Diubah | `apps/admin/components/shell/Sidebar.tsx` |
| Baru | `apps/admin/app/(dashboard)/guru/{page,GuruDialog}.tsx` |
| Baru | `apps/admin/app/(dashboard)/fasilitas/{page,FasilitasDialog}.tsx` |
| Baru | `apps/admin/app/(dashboard)/galeri/{page,GaleriDialog}.tsx` |
| Baru | `apps/admin/app/(dashboard)/jadwal/{page,JadwalSlotDialog}.tsx` |
| Diubah | `perbaikan error dan bug.md` — entri E.4; duplikat `E.2` yang terpotong di ekor file disingkirkan (lihat H.4) |

### H.3 Keputusan teknis yang perlu diketahui

- **B11 tetap ditunda.** Upsert per-slot (`ON DUPLICATE KEY UPDATE`) sudah atomik per
  baris dan tidak memakai hapus-lalu-insert; reorder dilayani pindah urutan dua langkah
  (POST + DELETE). Bulk transaksional baru bila pemilik menghendaki keamanan lebih.
- **Urutan jadwal dikunci 0–4 di backend** — mengunci desain matriks 5 kolom; hanya
  dilonggarkan jika desain slot variabel disetujui kemudian.
- **Kategori guru/galeri = teks bebas + datalist saran** (kolom `VARCHAR`) — lanjutan
  keputusan G.5; standardisasi kategori menunggu integrasi publik.
- **Guard klien + opsi nonaktif** mencegah upsert menimpa slot lain; backend tetap
  mengikuti semantik upsert apa adanya.
- **Pindah urutan tidak transaksional**: bila DELETE tahap kedua gagal, pesan langkah
  manual ditampilkan dan daftar di-refresh — kasus ini dicatat, bukan ditutupi.
- **Header matriks admin memakai jam DB**, berbeda dari komponen publik yang hardcoded
  (A11) — kontras ini ditampilkan di UI; wiring publik di luar cakupan Slice 3.

### H.4 Verifikasi

| Verifikasi | Hasil |
|---|---|
| `php -l` untuk 6 endpoint yang diubah (guru, galeri, fasilitas, pengumuman, agenda, jadwal) | **Lolos** — "No syntax errors detected" (PHP CLI tersedia di mesin agen; catatan F.5 tidak berlaku lagi di sini) |
| `npm run lint` di `apps/admin` | **Exit 0 — 0 masalah** |
| `npm run build` di `apps/admin` | **Exit 0** — TypeScript lolos; rute `/guru`, `/fasilitas`, `/galeri`, `/jadwal` ikut ter-prerender (11 halaman statis) |
| Koneksi admin → backend end-to-end | **Belum** — backend/MySQL tidak menyala saat build; uji manual di bawah wajib dijalankan pemilik |

Checklist uji manual end-to-end:

1. **Guru**: tambah guru + foto → muncul di tabel dan pratinjau kartu; **simpan lagi tanpa
   perubahan** → sukses (bukti 404-palsu hilang); filter kategori mengurangi daftar.
2. **Fasilitas**: tambah + gambar → kartu grid terbentuk; hapus → konfirmasi, Escape membatalkan.
3. **Galeri**: simpan tanpa gambar → ditolak klien; `POST` langsung tanpa `gambar` → 400 backend.
4. **Jadwal**: isi 5 slot (urutan 0–4) → tombol Tambah nonaktif + pesan; edit pindah ke
   urutan kosong → slot berpindah dan slot lama terhapus; `POST urutan=9` via API → 400;
   `GET ?admin=1` → `id`/`urutan` bertipe number (bukti A19).
5. **Pengumuman/Agenda**: toggle & simpan dengan nilai sama → tidak ada 404 palsu.
6. Periksa `perbaikan error dan bug.md` E.4 untuk detail akar masalah perbaikan di atas.

### H.5 Catatan & risiko yang belum ditutup

- **Komponen publik belum diwire**: `DewanGuru`, `FasilitasKampus`, `GaleriVisual`,
  `JadwalMatriks` masih statis — termasuk bug A11 (filter kategori mati, header jam
  hardcoded, foto galeri base64 rusak) yang tetap menunggu keputusan integrasi publik.
- **Pindah urutan jadwal tidak transaksional** (B11 masih ditunda, lihat H.3).
- Lanjutan G.5 tetap terbuka: file gambar yatim di `uploads/`, kategori teks bebas,
  `month` agenda bahasa Inggris untuk publik.
- **Belum tersentuh (Slice 4–5)**: inbox BK/aspirasi, riwayat chatbot, pusat arsip,
  pengajuan prestasi — plus keputusan pemilik B9 (rate limit) dan B10 (arah `aspirasi`).

---

*Riwayat: Bagian A–E dibuat 21 September 2026 (inspeksi awal). Bagian F = Slice 0
(scaffold + keamanan backend); F.7 koneksi database via `.env`. Bagian G = Slice 2
(konten beranda: berita/pengumuman/agenda + upload gambar), ditambahkan 23 September 2026.
Bagian H = Slice 3 (guru/fasilitas/galeri/jadwal + perbaikan B4/A19/404-palsu),
ditambahkan 23 September 2026. Perbarui Bagian D setiap kali keputusan desain
(mis. B10) diambil pemilik proyek.*








