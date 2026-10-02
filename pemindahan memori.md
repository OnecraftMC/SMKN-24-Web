# Pemindahan Memori: Dashboard Admin SMKN 24 Jakarta

## 0. Instruksi utama untuk AI-agent berikutnya

Anda adalah AI-agent lanjutan yang bekerja pada workspace yang sama. Anggap dokumen ini sebagai pemindahan konteks dari agent sebelumnya.

Jangan langsung mengubah kode hanya karena membaca dokumen ini. Baca workspace terlebih dahulu, terutama:

- `README.md`
- `apps/main-web`
- `backend`
- `packages/shared`
- `template login admin.txt`
- `template dashboard admin.txt`

Tugas besar yang sedang direncanakan adalah membangun dashboard admin terpisah untuk website SMK Negeri 24 Jakarta. Fokus awalnya adalah perencanaan dan penyelarasan kontrak, bukan setup routing. Jangan mengembangkan rich text blog lanjutan sebelum fondasi dashboard dan CRUD utama stabil.

Gunakan aturan berikut saat mulai implementasi:

1. Backend PHP di `backend` adalah sumber kontrak teknis utama.
2. `apps/main-web` adalah sumber kebutuhan UI publik, field konten, dan bahasa visual.
3. Rancangan fitur dari pemilik proyek harus dipertahankan, tetapi jangan membuat modul terpisah jika sebenarnya sudah dicakup resource backend yang sama.
4. Jangan memalsukan dukungan API yang belum ada. Tandai gap backend dan implementasikan perluasan secara eksplisit.
5. Jangan mengubah routing terlebih dahulu jika pemilik proyek belum meminta tahap implementasi routing.
6. Setiap perubahan harus mempertahankan type safety, error handling eksplisit, aksesibilitas, responsivitas, dan konsistensi visual dengan website utama.
7. Jangan menaruh secret, API key, password, JWT secret, atau `.env` ke repository.

---

## 1. Identitas workspace

Workspace ini adalah proyek ambisius website sekolah untuk **SMK Negeri 24 Jakarta**, yang ditargetkan untuk lomba tingkat nasional.

Tech stack utama:

- Next.js 16.3.4
- React 19
- TypeScript
- Tailwind CSS 4
- Motion
- Lucide React
- Material Symbols untuk sebagian ikon publik
- Backend REST API PHP tanpa framework
- PDO + MySQL/MariaDB
- JWT untuk autentikasi admin
- Struktur monorepo

Struktur aktual checkout saat ini:

```text
.
├── apps/
│   └── main-web/       # Website publik Next.js yang sudah ada
├── backend/            # REST API PHP + MySQL
├── packages/
│   └── shared/         # Tipe bersama
├── .assets/
├── README.md
├── template login admin.txt
└── template dashboard admin.txt
```

Catatan penting: dokumentasi root menyebut `apps/admin`, tetapi folder tersebut belum tersedia pada checkout yang diperiksa. Dashboard admin nantinya akan dibuat sebagai aplikasi baru di `apps/admin`.

Branch saat identifikasi awal bersih dan bernama:

```text
agents/school-website-nextjs-tailwind-monorepo
```

---

## 2. Tujuan produk dashboard admin

Dashboard admin harus menjadi pusat pengelolaan konten dan inbox operasional sekolah.

Admin harus dapat:

- login di aplikasi terpisah dari website publik;
- mengelola berita;
- menentukan berita highlight/headline;
- mengelola pengumuman dan papan informasi beranda;
- mengelola agenda kegiatan sekolah;
- mengelola direktori guru;
- mengelola fasilitas sekolah;
- mengelola galeri kegiatan;
- mengelola jadwal pembelajaran per program keahlian;
- mengelola arsip akademik yang dapat diunduh publik;
- memproses pesan BK;
- memproses aspirasi;
- memantau pengajuan prestasi siswa ketika resource tersebut ditambahkan;
- melihat riwayat percakapan chatbot;
- melihat ringkasan kondisi konten dan inbox di halaman overview.

Dashboard bukan sekadar template CRUD generik. Semua modul harus disesuaikan dengan konten dan alur nyata website SMKN 24 Jakarta.

---

## 3. Identifikasi `apps/main-web`

### 3.1 Halaman publik yang sudah ada

Route halaman yang ditemukan:

- `/`
- `/profil`
- `/akademik`
- `/kabar`
- `/fasilitas`
- `/berita`
- `/login`

Ada referensi navigasi ke `/jurusan`, tetapi route tersebut belum tampak pada checkout yang diidentifikasi. Jangan mengasumsikan semua link navigasi sudah memiliki halaman.

### 3.2 Komponen publik penting

Komponen yang harus dipahami sebelum membuat halaman admin:

- `components/layout/Navbar.tsx`
- `components/layout/MobileMenu.tsx`
- `components/beranda/BeritaTerkini.tsx`
- `components/beranda/PapanPengumuman.tsx`
- `components/beranda/AgendaKegiatan.tsx`
- `components/kabar/FeaturedNews.tsx`
- `components/kabar/GaleriVisual.tsx`
- `components/kabar/FormAspirasi.tsx`
- `components/akademik/JadwalMatriks.tsx`
- `components/akademik/KalenderUnduhan.tsx`
- `components/akademik/FormBK.tsx`
- `components/profil/DewanGuru.tsx`
- `components/profil/FasilitasKampus.tsx`
- `components/profil/FasilitasSekolah.tsx`
- `components/chatbot/ChatbotWidget.tsx`

### 3.3 Kondisi data publik saat ini

Banyak komponen masih memakai data statis dari:

- `apps/main-web/lib/data.ts`
- array lokal di dalam komponen

Route API Next.js di `apps/main-web/app/api` juga pada beberapa kasus hanya mengembalikan data lokal dari `lib/data.ts`, bukan meneruskan request ke backend PHP.

Konsekuensinya:

- membuat dashboard saja belum cukup;
- setelah CRUD admin dibuat, komponen publik harus dialihkan ke data backend agar perubahan benar-benar terlihat;
- perlu mapping field backend ke field presentasional komponen;
- perubahan integrasi publik sebaiknya dilakukan setelah kontrak admin/backend stabil.

### 3.4 Halaman/login publik

`apps/main-web/app/login/page.tsx` masih ada. Namun rancangan pemilik proyek menetapkan:

- login admin harus berada di `apps/admin`;
- tidak boleh ada form login admin di `main-web`;
- tombol Login di navbar publik harus mengarah ke origin aplikasi admin melalui environment variable;
- halaman login publik lama perlu ditinjau: dihapus, diubah menjadi redirect, atau tidak lagi ditautkan setelah aplikasi admin tersedia.

Jangan hardcode domain admin. Gunakan environment variable, misalnya:

```env
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

Nama final environment variable dapat ditentukan saat implementasi, tetapi harus konsisten di dokumentasi dan kedua aplikasi.

---

## 4. Identitas visual yang wajib dibagi

Sumber utama token visual ada di:

- `apps/main-web/app/globals.css`
- `apps/main-web/app/layout.tsx`

Branding dashboard harus sama dengan website publik:

- logo: `apps/main-web/public/logo-smkn24.png`
- font utama: Plus Jakarta Sans
- primary navy: `#00142f`
- primary container: `#0f294a`
- secondary gold/orange: `#855300` dan `#fea619`
- surface utama: `#f8f9ff`
- surface rendah: `#eff4ff`
- surface container: `#e5eeff`
- error: `#ba1a1a`
- teks utama: `#0b1c30`
- border/outline dari token yang sudah ada

Dashboard boleh lebih padat dan berorientasi data daripada website publik, tetapi hal berikut harus tetap konsisten:

- logo;
- warna;
- font;
- radius;
- spacing;
- focus state;
- hover state;
- status badge;
- bahasa Indonesia;
- gaya ilustrasi dan ikon;
- tone visual navy + gold + biru muda.

Template dashboard memakai Lucide React, sedangkan website publik memakai Material Symbols di banyak tempat. Pilih satu pola yang konsisten di dashboard. Lucide cocok untuk kontrol admin; jangan mencampur ikon tanpa alasan UX.

Sebaiknya token visual diekstrak ke package/shared atau mekanisme CSS yang dapat digunakan oleh `main-web` dan `apps/admin`, bukan disalin manual berkali-kali.

---

## 5. Backend sebagai sumber kontrak teknis

Backend berada di `backend` dan memakai PHP + PDO + MySQL/MariaDB.

Konfigurasi penting:

- `backend/config/config.php`
- `backend/config/database.php`
- `backend/helpers/jwt.php`
- `backend/helpers/upload.php`
- `backend/bootstrap.php`
- `backend/database.sql`

Backend menggunakan:

```http
Authorization: Bearer <jwt-token>
```

JWT saat ini berlaku 8 jam berdasarkan `JWT_EXPIRY`.

Endpoint publik dapat diakses tanpa token, sedangkan operasi tulis dan endpoint sensitif memerlukan autentikasi.

### 5.1 Resource database yang tersedia

Tabel yang terdapat pada `backend/database.sql`:

- `admin_users`
- `berita`
- `pengumuman`
- `agenda`
- `guru`
- `jadwal`
- `galeri`
- `fasilitas`
- `pesan_bk`
- `aspirasi`
- `chat_sessions`
- `chat_messages`

### 5.2 Endpoint yang tersedia

#### Autentikasi

- `POST /api/auth/login.php`
- `GET /api/auth/me.php`

Login memakai `username` dan `password`, bukan email.

Kredensial default pada schema adalah `admin/admin123` untuk instalasi awal. Ini wajib diganti pada deployment nyata.

#### Berita

- `GET /api/berita/index.php`
- `GET /api/berita/index.php?id=1`
- `GET /api/berita/index.php?utama=1`
- `GET /api/berita/index.php?kategori=...`
- `POST /api/berita/index.php`
- `PUT /api/berita/index.php?id=1`
- `DELETE /api/berita/index.php?id=1`

Field utama:

```text
id
judul
kategori
tanggal
gambar
ringkasan
isi
status: draft | terbit
utama: boolean
```

Tanpa token, GET hanya mengembalikan berita `terbit`. Dengan token admin yang valid, GET dapat mengembalikan draft juga.

`utama` digunakan untuk highlight/headline. Schema belum membatasi hanya satu berita utama.

#### Pengumuman

- `GET /api/pengumuman/index.php`
- `GET /api/pengumuman/index.php?beranda=1`
- `GET /api/pengumuman/index.php?id=1`
- `POST /api/pengumuman/index.php`
- `PUT /api/pengumuman/index.php?id=1`
- `DELETE /api/pengumuman/index.php?id=1`

Field:

```text
id
judul
isi
tanggal
kategori
penting
gambar
badge
status
linkLabel
linkHref
icon
actionIcon
variant
tampilBeranda
```

Resource ini sudah mencakup:

- CRUD pengumuman;
- papan informasi beranda;
- informasi penting;
- konfigurasi badge/status/link/kartu.

Jangan membuat modul terpisah “informasi terkini” jika hanya menduplikasi pengumuman. Buat satu modul yang cukup kompleks dan memiliki preview papan informasi.

#### Agenda

- `GET /api/agenda/index.php`
- `GET /api/agenda/index.php?id=1`
- `POST /api/agenda/index.php`
- `PUT /api/agenda/index.php?id=1`
- `DELETE /api/agenda/index.php?id=1`

Field schema:

```text
id
judul
tgl_mulai
tgl_selesai
waktu
lokasi
badge
deskripsi
gambar
tampil_beranda
```

Validasi penting:

- tanggal selesai tidak boleh mendahului tanggal mulai;
- agenda yang tampil di beranda harus dapat dipreview;
- rentang tanggal perlu dipetakan ke tampilan publik.

#### Guru

- `GET /api/guru/index.php`
- `GET /api/guru/index.php?id=1`
- `GET /api/guru/index.php?kategori=...`
- `POST /api/guru/index.php`
- `PUT /api/guru/index.php?id=1`
- `DELETE /api/guru/index.php?id=1`

Field:

```text
id
nama
jabatan
deskripsi
kategori
gambar
urutan
```

Komponen publik saat ini memakai field presentasional berbeda:

```text
name
title
desc
category
image
```

Jangan mengubah field backend hanya untuk mengikuti nama komponen. Buat mapper/type adapter yang jelas.

#### Jadwal

- `GET /api/jadwal/index.php`
- `GET /api/jadwal/index.php?admin=1`
- `GET /api/jadwal/index.php?jurusan=...`
- `POST /api/jadwal/index.php`
- `DELETE /api/jadwal/index.php?id=1`

Enum program keahlian:

```text
perhotelan
boga
busana
pplg
pariwisata
```

Enum sesi:

```text
pagi
siang
```

Field per slot:

```text
id
jurusan
sesi
urutan
mapel
jam
waktu
guru
```

Schema memiliki unique key:

```text
(jurusan, sesi, urutan)
```

Backend belum menyediakan PUT. Jangan membuat editor yang rawan menghapus seluruh data tanpa transaksi. Pilihan yang disarankan:

1. tambahkan endpoint PUT berdasarkan `id`; atau
2. buat endpoint bulk update transaksional.

Hindari workaround “hapus lalu insert” tanpa perlindungan karena dapat meninggalkan data setengah tersimpan.

#### Galeri

- `GET /api/galeri/index.php`
- `GET /api/galeri/index.php?id=1`
- `GET /api/galeri/index.php?kategori=...`
- `POST /api/galeri/index.php`
- `PUT /api/galeri/index.php?id=1`
- `DELETE /api/galeri/index.php?id=1`

Field:

```text
id
judul
kategori
gambar
```

Resource ini dipakai untuk galeri kegiatan/prestasi publik. Namun alur pengajuan prestasi siswa belum tersedia dan tidak boleh dipaksakan masuk ke tabel galeri.

#### Fasilitas

- `GET /api/fasilitas/index.php`
- `GET /api/fasilitas/index.php?id=1`
- `POST /api/fasilitas/index.php`
- `PUT /api/fasilitas/index.php?id=1`
- `DELETE /api/fasilitas/index.php?id=1`

Field:

```text
id
judul
deskripsi
gambar
```

#### Upload gambar

- `POST /api/upload.php`
- multipart/form-data
- field file: `gambar`
- memerlukan JWT

Validasi backend saat ini:

- MIME: JPEG, PNG, WEBP, GIF
- maksimum 5 MB
- URL hasil dikembalikan sebagai `{ "url": "..." }`

Endpoint ini cocok untuk:

- foto guru;
- gambar fasilitas;
- gambar galeri;
- gambar berita;
- gambar pengumuman;
- gambar agenda.

Endpoint ini tidak cocok untuk arsip PDF/DOC/XLS sebelum backend diperluas karena validasinya hanya gambar.

#### Pesan BK

- `POST /api/bk/index.php` publik
- `GET /api/bk/index.php` admin
- `PUT /api/bk/index.php?id=1` admin
- `DELETE /api/bk/index.php?id=1` admin

Field:

```text
id
nama
kelas
no_hp
keperluan
pesan
status: Baru | Diproses | Selesai
tanggal
```

Ini bukan CRUD konten publik, tetapi penting sebagai inbox privat dashboard.

#### Aspirasi

- `POST /api/aspirasi/index.php` publik
- `GET /api/aspirasi/index.php` admin
- `PUT /api/aspirasi/index.php?id=1` admin
- `DELETE /api/aspirasi/index.php?id=1` admin

Field:

```text
id
nama
email
kategori
pesan
status: Baru | Ditinjau | Selesai
created_at
```

Admin perlu dapat mengubah status, membuka detail, memfilter, dan menghapus dengan konfirmasi.

#### Riwayat chatbot

- `GET /api/chat/history.php`
- dapat meminta detail berdasarkan `sessionId`
- memerlukan autentikasi admin

Fitur dashboard yang sesuai:

- daftar sesi;
- waktu dibuat;
- jumlah pesan;
- detail percakapan;
- read-only pada fase awal.

---

## 6. Fitur admin yang harus direncanakan

### 6.1 Login admin terpisah

Gunakan template `template login admin.txt` sebagai inspirasi, bukan sebagai kode yang wajib dicopy mentah.

Penyesuaian wajib:

- gunakan username + password sesuai backend;
- gunakan logo SMKN 24 Jakarta;
- gunakan palette navy/gold dari `main-web`;
- gunakan pesan error Bahasa Indonesia;
- tampilkan loading dan status autentikasi;
- jangan mengandalkan dependency yang belum ada tanpa menambahkannya secara sadar;
- simpan token dengan pertimbangan keamanan yang jelas;
- tangani token kedaluwarsa;
- jangan menaruh token atau secret di server publik secara tidak aman.

Backend belum memiliki endpoint logout/revoke. Logout awal berarti menghapus sesi/token lokal. Jika keamanan production memerlukan revoke token, backend perlu diperluas.

### 6.2 Overview/dashboard beranda admin

Overview harus menampilkan data operasional nyata:

- total berita terbit;
- total berita draft;
- total pengumuman tampil di beranda;
- agenda mendatang;
- total guru;
- total fasilitas;
- total galeri;
- jumlah pesan BK `Baru`;
- jumlah aspirasi `Baru`;
- jumlah pengajuan prestasi `Baru` setelah endpoint tersebut tersedia;
- aktivitas terbaru.

Backend belum punya endpoint agregasi overview. Fase awal boleh melakukan beberapa GET terautentikasi dari client/server admin. Jika terlalu banyak request, tambahkan endpoint summary backend kemudian.

Jangan menampilkan statistik palsu atau fallback sukses ketika request gagal. Tampilkan error yang jelas.

### 6.3 Berita dan highlight

Admin dapat:

- membuat berita;
- mengedit berita;
- menghapus berita;
- menyimpan draft;
- menerbitkan berita;
- mengunggah gambar;
- mengisi judul, kategori, tanggal, ringkasan, isi;
- menentukan berita utama/highlight;
- melihat preview kartu publik;
- memfilter status/kategori;
- mencari berdasarkan judul;
- mengurutkan berdasarkan tanggal.

Rich text editor untuk header, font size, section, dan blog lanjutan sengaja ditunda.

Rekomendasi kebijakan highlight:

- satu highlight aktif untuk konsistensi tampilan publik;
- ketika berita baru dijadikan utama, berita utama sebelumnya dinonaktifkan;
- jika backend belum mendukung aturan ini, implementasikan endpoint/transaction backend atau validasi terpusat dengan error eksplisit.

### 6.4 Pengumuman dan papan informasi

Gunakan satu modul untuk seluruh kebutuhan:

- CRUD pengumuman;
- judul dan isi;
- kategori;
- tanggal;
- penting;
- badge;
- status seperti “Mendesak”;
- link label dan href;
- icon dan action icon;
- variant kartu;
- toggle tampil di beranda;
- preview menyerupai `PapanPengumuman.tsx`.

### 6.5 Agenda kegiatan

Admin dapat:

- membuat/edit/hapus agenda;
- mengatur tanggal mulai dan selesai;
- mengatur waktu/lokasi;
- mengatur badge/deskripsi/gambar;
- menentukan tampil di beranda;
- melihat preview kartu agenda;
- memfilter agenda mendatang/terlewat.

### 6.6 Direktori guru

Admin dapat:

- CRUD guru;
- upload foto;
- mengatur kategori;
- mengatur jabatan dan deskripsi;
- mengatur urutan;
- memfilter Pimpinan, Keahlian, BK, Pembimbing, TU;
- melihat preview kartu publik.

### 6.7 Fasilitas sekolah

Admin dapat:

- CRUD fasilitas;
- upload gambar;
- preview gambar;
- judul dan deskripsi;
- konfirmasi hapus;
- preview layout kartu fasilitas.

### 6.8 Jadwal pembelajaran

Admin dapat:

- memilih program keahlian;
- memilih sesi pagi/siang;
- mengedit slot mata pelajaran;
- mengatur jam/waktu/guru;
- menambah/menghapus slot;
- melihat matriks sesuai layout publik;
- mendapatkan error jelas saat terjadi konflik unique slot.

Implementasi edit sebaiknya menunggu keputusan endpoint PUT/bulk update backend.

### 6.9 Pusat arsip akademik

Saat ini belum tersedia di backend.

Komponen publik `KalenderUnduhan.tsx` masih membuat file `.txt` lokal melalui browser. Ini perlu diganti dengan data arsip server.

Perlu ditambahkan:

#### Tabel baru, misalnya `arsip`

Field yang disarankan:

```text
id
judul
deskripsi
kategori
tahun_ajaran
nama_file
url_file
mime_type
ukuran
tampil_publik
urutan
created_at
updated_at
```

#### Endpoint baru

```text
GET    /api/arsip/index.php
POST   /api/arsip/index.php
PUT    /api/arsip/index.php?id=1
DELETE /api/arsip/index.php?id=1
```

#### Upload file

Jangan memperluas upload gambar secara sembarangan. Buat validasi khusus arsip:

- allowlist MIME dan extension;
- batas ukuran;
- nama file acak;
- penyimpanan di lokasi non-eksekusi;
- header download yang benar;
- autentikasi upload;
- perlindungan path traversal;
- penghapusan file lama yang aman.

### 6.10 Galeri dan pengajuan prestasi

CRUD galeri yang sudah ada dapat langsung dibuat menggunakan `/api/galeri/index.php`.

Namun rancangan peserta didik mengajukan prestasi belum didukung backend. Jangan menyimpan pengajuan prestasi mentah langsung ke tabel `galeri`.

Buat resource terpisah, misalnya `prestasi_pengajuan`.

Field minimum yang disarankan:

```text
id
nama_siswa
kelas
program_keahlian
judul_prestasi
penyelenggara
tingkat
tanggal_prestasi
deskripsi
gambar_bukti
status: Baru | Ditinjau | Disetujui | Ditolak
catatan_admin
tampil_galeri
created_at
updated_at
```

Endpoint yang diperlukan:

```text
POST   /api/prestasi/index.php          # publik
GET    /api/prestasi/index.php          # admin
PUT    /api/prestasi/index.php?id=1    # admin
DELETE /api/prestasi/index.php?id=1    # admin
```

Alur:

1. siswa mengirim form publik;
2. admin menerima notifikasi/inbox;
3. admin meninjau data dan bukti;
4. admin menyetujui/menolak;
5. item yang disetujui dapat diterbitkan ke galeri;
6. publik hanya melihat data yang disetujui dan ditampilkan.

Modul ini boleh dikelompokkan bersama Aspirasi sebagai **Inbox & Moderasi**, tetapi endpoint, field, dan statusnya harus berbeda.

### 6.11 Inbox BK

Admin dapat:

- melihat pesan;
- membuka detail;
- mengubah status Baru/Diproses/Selesai;
- memfilter;
- menghapus dengan konfirmasi;
- melihat badge jumlah pesan baru;
- menjaga privasi nomor telepon dan isi pesan.

### 6.12 Inbox aspirasi

Admin dapat:

- melihat nama/email/kategori/pesan;
- mengubah status Baru/Ditinjau/Selesai;
- memfilter;
- membuka detail;
- menghapus dengan konfirmasi;
- melihat badge jumlah aspirasi baru.

### 6.13 Riwayat chatbot

Admin dapat:

- melihat daftar sesi;
- melihat waktu;
- melihat jumlah pesan;
- membuka detail percakapan;
- melakukan pencarian dasar jika endpoint mendukung;
- tidak mengubah isi chat pada fase awal.

---

## 7. Struktur sidebar dashboard yang disarankan

Template dashboard menggunakan mock workspace generik. Mock tersebut harus diganti dengan domain sekolah.

Struktur menu:

```text
Overview

Konten Website
├── Berita & Highlight
├── Pengumuman & Papan Informasi
├── Agenda Kegiatan
├── Galeri Kegiatan
├── Fasilitas Sekolah
└── Direktori Guru

Akademik
├── Jadwal Pembelajaran
└── Pusat Arsip

Inbox & Moderasi
├── Pesan BK
├── Aspirasi
└── Pengajuan Prestasi

Monitoring
└── Riwayat Chatbot

Pengaturan
├── Profil Admin/Sesi
└── Logout
```

Sidebar harus:

- responsif;
- bisa collapse pada desktop;
- memiliki drawer pada mobile;
- menampilkan badge jumlah item baru;
- memiliki active state;
- mendukung keyboard;
- tidak menggunakan item template yang tidak relevan seperti Finance/API Keys/Projects.

Template dashboard boleh menjadi referensi untuk:

- sidebar;
- topbar;
- command palette;
- animasi;
- search overlay;
- mobile navigation;
- collapse state.

Tetapi data, label, dan struktur harus diganti dengan kebutuhan dashboard sekolah.

---

## 8. Rencana fase implementasi

### Fase 0 — Kontrak dan fondasi

1. Baca ulang backend dan main-web.
2. Buat `apps/admin`.
3. Tentukan URL backend dan URL admin melalui environment variable.
4. Siapkan shared design token.
5. Siapkan shared type/mapper bila perlu.
6. Siapkan API client terpusat.
7. Tetapkan bentuk error response.
8. Verifikasi CORS untuk `localhost:3000` dan `localhost:3001`.
9. Putuskan kebijakan satu highlight.
10. Tambahkan endpoint PUT/bulk update jadwal.
11. Rancang schema arsip.
12. Rancang schema pengajuan prestasi.

### Fase 1 — Login dan shell

1. Login JWT.
2. Auth guard.
3. Token expiry handling.
4. Logout.
5. Dashboard layout.
6. Sidebar responsif.
7. Topbar.
8. Breadcrumb.
9. Profil admin.
10. Overview.
11. Loading/error/empty states.

### Fase 2 — Konten yang langsung terlihat di beranda

1. Pengumuman/papan informasi.
2. Berita.
3. Highlight berita.
4. Agenda.
5. Upload gambar.
6. Preview konten.
7. Integrasi awal data publik ke backend.

### Fase 3 — Profil dan akademik inti

1. Direktori guru.
2. Fasilitas.
3. Galeri.
4. Jadwal per program keahlian.
5. Mapping field API ke komponen publik.

### Fase 4 — Arsip dan inbox

1. Schema/API arsip.
2. Admin arsip.
3. Download publik.
4. Pesan BK.
5. Aspirasi.
6. Riwayat chatbot.

### Fase 5 — Pengajuan prestasi

1. Schema/API pengajuan prestasi.
2. Form publik main-web.
3. Upload bukti.
4. Inbox moderasi.
5. Persetujuan/penolakan.
6. Publikasi ke galeri.
7. Badge notifikasi.

### Fase 6 — Penyempurnaan

1. Preview publik yang konsisten.
2. Search/command palette.
3. Bulk action aman.
4. Audit log bila diperlukan.
5. Pagination.
6. Caching.
7. Optimasi gambar.
8. Aksesibilitas.
9. Observability.
10. Rich text berita sebagai proyek terpisah.

Urutan slice pertama yang direkomendasikan:

```text
apps/admin foundation
→ login JWT
→ shell/sidebar
→ overview
→ pengumuman
→ berita/highlight
→ agenda
```

Urutan ini paling cepat memvalidasi alur admin sampai beranda publik.

---

## 9. Gap yang wajib diingat

### Gap A — `apps/admin` belum ada

Dokumentasi root sudah menyebutnya, tetapi folder aktual belum tersedia. Buat aplikasi admin baru dengan pola yang konsisten dan dokumentasikan perintah instalasinya.

### Gap B — data publik masih statis

CRUD backend tidak otomatis mengubah tampilan publik. Komponen berikut perlu dialihkan secara bertahap:

- berita;
- berita utama;
- papan pengumuman;
- agenda;
- guru;
- fasilitas;
- galeri;
- jadwal;
- arsip.

### Gap C — jadwal tidak punya PUT

Tambahkan update transaksional sebelum membuat editor jadwal yang serius.

### Gap D — arsip belum memiliki tabel/API

Jangan memakai upload gambar untuk PDF/DOC/XLS.

### Gap E — pengajuan prestasi belum memiliki resource

Jangan mencampurkan data siswa ke galeri atau aspirasi tanpa schema khusus.

### Gap F — satu highlight belum ditegakkan backend

Tentukan apakah UI atau backend yang bertanggung jawab memastikan hanya satu highlight aktif.

### Gap G — login publik masih ada

Navbar publik masih menuju `/login`. Arahkan ke aplikasi admin setelah origin admin tersedia, dan tentukan nasib route login lama.

### Gap H — template memiliki dependency dan mock

Template login menggunakan konsep seperti `react-hook-form`, zod, framer-motion, dan komponen shadcn yang belum tentu tersedia pada aplikasi admin. Template dashboard juga berisi data mock generik.

Jangan menyalin template tanpa:

- mengecek dependency;
- menyesuaikan schema login username;
- mengganti mock data;
- menyesuaikan token visual;
- menambahkan error/loading state nyata.

---

## 10. Kriteria penerimaan dashboard awal

Dashboard fase awal dianggap benar jika:

- admin dapat login dari aplikasi terpisah;
- token dikirim sebagai Bearer token;
- token invalid/expired ditangani dan tidak menghasilkan UI seolah sukses;
- nama/role admin dapat ditampilkan;
- logout membersihkan sesi;
- sidebar dan layout responsif;
- overview memakai data nyata;
- CRUD berita berjalan terhadap backend;
- highlight dapat diatur dengan kebijakan yang jelas;
- CRUD pengumuman berjalan dan dapat mengatur tampil di beranda;
- CRUD agenda berjalan;
- upload gambar tervalidasi;
- guru/fasilitas/galeri dapat dikelola;
- jadwal dapat diedit tanpa merusak unique slot;
- pesan BK dan aspirasi memiliki status dan badge;
- semua operasi destruktif memiliki konfirmasi;
- error backend ditampilkan secara jelas;
- tidak ada secret di frontend/repository;
- branding admin konsisten dengan website publik;
- data yang diubah admin akhirnya muncul di main-web setelah integrasi publik selesai.

---

## 11. Prinsip implementasi teknis

- Gunakan API client terpusat, jangan menulis fetch mentah berulang di setiap komponen.
- Gunakan tipe untuk request/response.
- Buat mapper eksplisit ketika field API dan field presentasional berbeda.
- Validasi form di client untuk UX, tetapi tetap anggap backend sebagai validator final.
- Tampilkan error API secara eksplisit.
- Jangan gunakan `catch` luas yang mengubah kegagalan menjadi response sukses.
- Jangan menggunakan `as any` untuk menutupi mismatch kontrak.
- Pastikan upload memiliki preview, progress/loading, validasi ukuran, dan error.
- Pastikan tabel memiliki empty state.
- Pastikan halaman memiliki loading state.
- Pastikan tombol destructive memiliki confirmation.
- Pastikan dialog dapat ditutup dengan keyboard.
- Pastikan focus ring terlihat.
- Pastikan label form terhubung dengan input.
- Pastikan gambar memiliki alt text.
- Pertimbangkan privasi pesan BK dan data siswa.
- Jangan mengubah file yang tidak relevan.
- Jangan menghapus perubahan pengguna yang sudah ada.
- Jalankan lint/build/test yang relevan setelah implementasi.

---

## 12. File yang perlu dibaca ulang saat memulai implementasi

### Root

- `README.md`
- `.gitignore`
- `template login admin.txt`
- `template dashboard admin.txt`

### Main-web

- `apps/main-web/package.json`
- `apps/main-web/app/layout.tsx`
- `apps/main-web/app/globals.css`
- `apps/main-web/app/page.tsx`
- `apps/main-web/app/profil/page.tsx`
- `apps/main-web/app/akademik/page.tsx`
- `apps/main-web/app/kabar/page.tsx`
- `apps/main-web/app/fasilitas/page.tsx`
- `apps/main-web/app/berita/page.tsx`
- `apps/main-web/app/login/page.tsx`
- `apps/main-web/lib/data.ts`
- `apps/main-web/lib/types.ts`
- `apps/main-web/components/layout/Navbar.tsx`
- `apps/main-web/components/beranda/PapanPengumuman.tsx`
- `apps/main-web/components/beranda/AgendaKegiatan.tsx`
- `apps/main-web/components/beranda/BeritaTerkini.tsx`
- `apps/main-web/components/kabar/FeaturedNews.tsx`
- `apps/main-web/components/kabar/GaleriVisual.tsx`
- `apps/main-web/components/kabar/FormAspirasi.tsx`
- `apps/main-web/components/akademik/JadwalMatriks.tsx`
- `apps/main-web/components/akademik/KalenderUnduhan.tsx`
- `apps/main-web/components/akademik/FormBK.tsx`
- `apps/main-web/components/profil/DewanGuru.tsx`
- `apps/main-web/components/profil/FasilitasKampus.tsx`

### Backend

- `backend/README.md`
- `backend/database.sql`
- `backend/bootstrap.php`
- `backend/config/config.php`
- `backend/config/database.php`
- `backend/helpers/jwt.php`
- `backend/helpers/upload.php`
- `backend/api/auth/login.php`
- `backend/api/auth/me.php`
- `backend/api/berita/index.php`
- `backend/api/pengumuman/index.php`
- `backend/api/agenda/index.php`
- `backend/api/guru/index.php`
- `backend/api/jadwal/index.php`
- `backend/api/galeri/index.php`
- `backend/api/fasilitas/index.php`
- `backend/api/bk/index.php`
- `backend/api/aspirasi/index.php`
- `backend/api/chat/history.php`
- `backend/api/upload.php`

### Shared

- `packages/shared/types.ts`

---

## 13. Instruksi akhir

Mulai dari pembacaan ulang workspace dan status Git. Setelah itu:

1. konfirmasi struktur aktual, terutama apakah `apps/admin` masih belum ada;
2. periksa apakah ada perubahan pengguna yang harus dipertahankan;
3. susun task kecil berurutan;
4. implementasikan fondasi sebelum CRUD;
5. validasi setiap slice;
6. jangan menganggap resource arsip/prestasi sudah tersedia sebelum schema dan endpoint dibuat;
7. jangan menyatakan selesai sebelum alur admin-to-public benar-benar diverifikasi.

Pemilik proyek sangat menekankan bahwa website ini akan dilombakan di tingkat nasional. Karena itu, kualitas UX, konsistensi visual, aksesibilitas, keamanan, dan integritas data harus diperlakukan sebagai kebutuhan utama, bukan polish tambahan.
