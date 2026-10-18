---
name: SMKN 24 Jakarta
description: Sistem visual resmi sekolah — satu sumber token untuk website publik dan dashboard admin.
colors:
  navy-tanggal-panjang: "#00142f"
  navy-container: "#0f294a"
  navy-fixed-dim: "#b0c8f1"
  navy-fixed: "#d5e3ff"
  kuning-arsip: "#fea619"
  kuning-tua: "#855300"
  kuning-fixed: "#ffddb8"
  biru-terang: "#002367"
  biru-terang-tua: "#00113b"
  permukaan: "#f8f9ff"
  permukaan-kontainer: "#e5eeff"
  permukaan-kontainer-rendah: "#eff4ff"
  permukaan-kontainer-tinggi: "#dce9ff"
  permukaan-kontainer-tertinggi: "#d3e4fe"
  permukaan-putih: "#ffffff"
  tinta: "#0b1c30"
  tinta-sekunder: "#44474e"
  garis: "#c4c6cf"
  garis-tegas: "#74777f"
  merah: "#ba1a1a"
  merah-muda: "#ffdad6"
  merah-tua: "#93000a"
  seri-diagram: "#2563eb"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 800
    lineHeight: "4.25rem"
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: "3rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.625rem"
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.625rem"
    letterSpacing: "0.005em"
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: "1rem"
    letterSpacing: "0.04em"
rounded:
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
  pill: "9999px"
spacing:
  "2xs": "0.25rem"
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  "2xl": "3rem"
components:
  button-primary:
    backgroundColor: "{colors.navy-tanggal-panjang}"
    textColor: "{colors.permukaan-putih}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.navy-container}"
  button-ghost:
    backgroundColor: "{colors.permukaan-putih}"
    textColor: "{colors.navy-tanggal-panjang}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-danger:
    backgroundColor: "{colors.merah}"
    textColor: "{colors.permukaan-putih}"
    rounded: "{rounded.md}"
  input-field:
    backgroundColor: "{colors.permukaan-putih}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "0.625rem 0.75rem"
  card-panel:
    backgroundColor: "{colors.permukaan-putih}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
---

# Design System: SMKN 24 Jakarta

## Overview

**Creative North Star: "Panel Bongkar Tata"**

Sistem ini dibangun seperti panel bongkar tata di ruang staff sekolah: alat untuk melihat apa yang sedang berjalan, lalu bertindak. Bukan panggung, bukan brosur. Website publik memakai bahasa yang sama dengan ruang lebih lapang; dashboard admin memakai bahasa yang sama dengan ruang lebih rapat. Yang tidak berubah di antara keduanya adalah warna, tipografi, dan bentuk komponennya. Itulah yang membuat satu aplikasi bisa melayani dua audiens tanpa terlihat seperti dua produk yang dipaksa menyatu.

Nadanya padat dan cepat. Halaman admin bukan tempat yang dibaca pelan-pelan. Strip angka dan baris tabel harus bisa dipindai sekali lihat. Kepadatan dicapai dengan memperkecil ukuran, bukan dengan menghilangkan jarak antarbagian. Ruang kosong tetap ada, tugasnya memisahkan kelompok informasi.

Karakter komponennya tenang dan restrained. Tombol tidak memamerkan dirinya sendiri; ia menyatakan aksi. Input tidak bergaya; ia menunggu isian. Kartu tidak tampil sebagai hiasan; ia menampung keadaan. Yang membawa penekanan di sistem ini bukan bentuk komponen, melainkan warna. Dan warna itu sangat jarang dipakai.

**Key Characteristics:**

- Satu keluarga komponen untuk website publik dan dashboard admin, menarik dari satu file token.
- Navy sebagai warna shell dan tinta; kuning arsip sebagai satu-satunya warna aksi dan penanda.
- Permukaan biru sangat muda di atas kartu putih, bukan abu-abu netral.
- Padat dan cepat di admin; lapang di situs publik.
- Seluruh label, pesan, dan keadaan dalam Bahasa Indonesia.
- Ikon dari satu pustaka, satu ketebalan garis.

## Colors

Palet ini seperti dokumen sekolah yang dijitip di atas meja kerja: tinta navy untuk membingkai, kuning arsip untuk yang harus ditandai tangan, dan kertas putih di atas meja biru muda.

### Primary

- **Navy Tanggal Panjang** (`#00142f`): warna shell dan tinta. Dipakai untuk sidebar, header hari, tombol utama, angka besar, dan setiap teks yang harus dibaca lebih dulu. Warna ini mendominasi sebagai bidang, bukan sebagai penanda.
- **Navy Container** (`#0f294a`): lapisan dalam navy. Dipakai untuk poros waktu, header tabel, dan hover tombol utama. Satu langkah lebih terang supaya lapisan terbaca tanpa perlu garis.
- **Navy Fixed Dim** (`#b0c8f1`): teks sekunder di atas navy. **Navy Fixed** (`#d5e3ff`): biru muda di atas permukaan terang.

### Secondary

- **Kuning Arsip** (`#fea619`): satu-satunya warna aksi dan penanda. Tombol aktif di rail, garis "sekarang" pada poros waktu, badge perhatian, penanda status. Muncul sedikit, dan terlihat justru karena sedikit.
- **Kuning Tua** (`#855300`): versi teks dari kuning arsip, dipakai saat kuning muncul sebagai warna teks di atas permukaan terang.
- **Kuning Fixed** (`#ffddb8`): latar badge pada tema terang di situs publik.

### Tertiary

- **Biru Terang** (`#002367`) dan **Biru Terang Tua** (`#00113b`): status netral yang perlu dibedakan dari kosong, dan lapisan info di situs publik. Bukan warna status utama.

### Neutral

- **Permukaan** (`#f8f9ff`): latar seluruh aplikasi. Biru sangat muda, bukan putih, supaya kartu putih di atasnya punya batas tanpa perlu bayangan.
- **Permukaan Kontainer** (`#e5eeff`): garis tipis dan border kartu.
- **Permukaan Kontainer Rendah** (`#eff4ff`) sampai **Permukaan Kontainer Tertinggi** (`#d3e4fe`): lima tingkat kebiruan untuk jarak kedalaman horizontal. Dipakai untuk baris tabel, header, dan state hover.
- **Permukaan Putih** (`#ffffff`): kartu, dialog, panel. Satu-satunya bidang yang benar-benar putih.
- **Tinta** (`#0b1c30`): teks utama. **Tinta Sekunder** (`#44474e`): label, keterangan, teks bantu.
- **Garis** (`#c4c6cf`) dan **Garis Tegas** (`#74777f`): border form dan komponen. Garis Tegas untuk placeholder ikon dan divider yang butuh lebih tegas.

### Named Rules

**The One Voice Rule.** Kuning Arsip hanya boleh muncul pada tiga hal: aksi utama yang sedang aktif, penanda waktu atau status yang sedang berlangsung, dan keadaan yang menuntut perhatian. Di luar tiga itu kuning tidak dipakai, bukan sebagai latar dekoratif dan bukan sebagai sorotan pada angka.

**The Red Means Stop Rule.** Merah hanya untuk keadaan yang benar-benar kritikal: data gagal dimuat, tindakan destruktif, kasus konseling yang ditandai perlu perhatian. Kartu yang tidak bermasalah tidak pernah memakai warna ini sebagai hiasan.

## Typography

**Display Font:** Plus Jakarta Sans (self-hosted lewat `next/font`, fallback `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Plus Jakarta Sans
**Label/Mono Font:** Plus Jakarta Sans, sama seperti body. Sistem ini tidak memakai monospace kecuali untuk kode atau data yang memang harus dibaca kolom per kolom.

**Character:** satu keluarga huruf untuk semua peran, dari display hero sampai label 12px. Plus Jakarta Sans memberi bentuk tegas tanpa tepi bergerigi, dan tinggi hurufnya membuat label kecil tetap terbaca ketika seluruh sistem dirender pada skala 0,75. Keputusannya disengaja: tidak ada huruf display yang berbeda dari huruf label, sehingga hierarki tidak pernah datang dari pilihan font. Semuanya datang dari ukuran dan bobot.

### Hierarchy

- **Display** (800, 3.5rem / 4.25rem, tracking -0.03em): hanya judul hero di situs publik. Tidak dipakai di admin.
- **Headline Large** (700, 2.5rem / 3rem, tracking -0.025em): judul bagian besar di situs publik; angka utama pada strip konteks di admin.
- **Headline Medium** (700, 1.75rem / 2.25rem, tracking -0.02em): judul bagian sedang.
- **Headline Small** (600, 1.25rem / 1.75rem, tracking -0.01em): judul dalam panel, nama item.
- **Title** (600, 1.125rem / 1.625rem): judul panel dan kartu. Peran paling sering dipakai di admin.
- **Body Large dan Medium** (400, 1.125rem dan 1rem / 1.625rem): paragraf. Panjang baris nyaman 65 sampai 75ch.
- **Body Small** (400, 0.875rem / 1.375rem, tracking 0.005em): teks yang paling sering muncul di admin. Keterangan, isi tabel, pesan error.
- **Label** (600 sampai 700, 0.875rem dan 0.75rem, tracking 0.01 sampai 0.04em): label form dan header kolom. Label kecil sering uppercase.

### Named Rules

**The Weight Carries Meaning Rule.** Karena hanya ada satu keluarga huruf, hierarki harus datang dari bobot dan ukuran. Menebalkan kata berarti memperjelas, bukan månce. Kalau sebuah judul tidak bisa dibedakan dari paragrafnya hanya lewat ukuran dan bobot, hierarkinya salah.

**The Small Label Rule.** Label 12px hanya untuk metadata: nama kolom, status, keterangan di bawah angka. Tidak pernah untuk hal yang harus dibaca pertama.

## Layout

Sistem ini memakai dua skala margin dalam satu token yang sama: `margin-mobile` 1.25rem, `margin-tablet` 2rem, `margin-desktop` 3rem. Konten maksimum 80rem. Ritme vertikal memakai skala `space-*` dari 0.25rem sampai 4.5rem. Jarak antarbagian halaman besar memakai `space-lg` ke atas, sedangkan jarak antarfield dalam satu form berhenti di `space-sm`.

Admin memakai shell dua lapis: rail tetap di kiri (16rem, atau 4.5rem saat dipipihkan) dan konten di kanan dengan padding kiri yang bertransisi mengikuti keadaan rail. Halaman admin memakai grid 12 kolom. Pada layar lebar, area kerja Overview menjadi dua kolom: poros utama dan kolom konteks selebar 340px. Di bawah 1280px keduanya runtuh ke satu kolom. Di ponsel, rail menjadi drawer, poros vertikal menjadi daftar harian, dan strip konteks menjadi dua baris dua kolom, bukan empat kartu bertumpuk.

**The Zoom Rule.** Pada lebar minimal 768px dan tinggi minimal 600px, seluruh dokumen dirender pada `body { zoom: 0.75 }`. Ini keputusan produksi yang sudah berjalan dan tidak boleh disentuh. Konsekuensinya mengikat: semua ukuran, spacing, dan tipografi area admin ditulis dalam CSS pada skala penuh dan menjadi 75 persen saat tampil di layar. Untuk tinggi 56px yang terlihat di layar, tulis 72px di CSS. Merancang seolah-olah 100 persen akan membuat semuanya terlalu kecil.

Website publik tidak memakai zoom. Ia punya ritme sendiri dengan jarak bagian 3rem sampai 6rem.

## Elevation & Depth

Sistem ini memakai kedalaman hibrida. Lapisan kontainer tonal sudah memberi kedalaman bahkan tanpa bayangan, dan bayangan ambient tipis dipakai untuk hal yang benar-benar naik dari bidang. Kartu pada permukaan putih memakai `shadow-sm`. Dialog dan drawer memakai `shadow-xl`. Setiap bayangan punya offset; bayangan berwarna tanpa offset itu hiasan, bukan kedalaman.

### Shadow Vocabulary

- **Ambient-low** (`0 1px 3px rgba(0, 20, 47, 0.08)`): kartu dan panel yang diam.
- **Ambient-raised** (`0 20px 25px -5px rgba(0, 20, 47, 0.15)`): dialog, drawer, dan menu melayang. Sama dengan `shadow-xl` milik Tailwind.

### Named Rules

**The Ambient Rule.** Bayangan menandai keadaan, bukan gaya. Permukaan diam memakai ambient-low. Dialog yang butuh perhatian penuh memakai ambient-raised. Tidak ada bayangan dekoratif pada elemen datar.

**The Flat-By-Default Rule.** Permukaan rata saat diam. Perubahan warna border atau latar pada hover dan fokus menggantikan bayangan sebagai tanda interaksi.

## Shapes

Bahasa bentuknya sederhana dan konsisten: radius kecil, border tipis 1px dalam warna garis, tanpa clipping imagery. Ada empat tingkat radius: `sm` 0.25rem untuk kontrol kecil dan tombol ikon, `md` 0.5rem untuk tombol, input, dan badge, `lg` 0.75rem untuk kartu, panel, dan dialog, serta `pill` penuh untuk badge dan batang proporsi.

Kartu dan panel memakai radius 1rem melalui kelas `rounded-2xl` Tailwind. Ini satu tingkat di atas token `lg`, dan tetap dipakai karena sudah melekat di kedua aplikasi.

Tepi kiri berwarna 1 sampai 3px pada kartu dan baris daftar adalah satu-satunya bentuk corak yang diizinkan. Ia menandai keadaan, bukan kategori. Garis 1px dalam warna permukaan-kontainer memisahkan baris tabel tanpa perlu garis yang lebih tebal.

## Components

### Buttons

- **Shape:** radius 0.5rem, padding vertikal 0.625rem dan horizontal 1rem, ikon 16px di dalam teks.
- **Primary:** latar navy, teks putih, label `label-md` bold.
- **Hover:** latar bergeser ke navy container. Tombol secara global punya `buttonHoverMicro`: `scale(1.04)` dengan `cubic-bezier(0.2, 0.8, 0.2, 1)` selama 180ms, mati total saat `prefers-reduced-motion`.
- **Ghost:** border garis 1px, teks navy, latar putih. Hover ke permukaan-kontainer.
- **Danger:** latar merah, teks putih, hover ke merah tua. Hanya untuk hapus dan tindakan yang tidak dapat dibatalkan.
- **Disabled:** `opacity: 0.6` dan `cursor: not-allowed`. Tidak pernah dihilangkan, selalu diburamkan.

### Inputs / Fields

- **Style:** latar putih, border garis 1px, radius 0.5rem, `body-sm`, padding 0.625rem 0.75rem. Placeholder memakai tinta sekunder pada 60 persen.
- **Focus:** border berpindah ke navy, ditambah `ring-2 ring-primary/30`. Outline global 2px warna kuning arsip dengan offset 2px berlaku untuk elemen yang tidak punya ring sendiri.
- **Label:** selalu ada, di atas field, `label-sm` uppercase bold.
- **Error:** pesan tampil di bawah field dalam merah tua dengan ikon peringatan. Field tidak mengubah warnanya sendiri kecuali memang ditandai.

### Cards / Containers

- **Corner Style:** radius 1rem.
- **Background:** putih di atas permukaan; permukaan-kontainer-rendah untuk baris di dalam daftar.
- **Border:** 1px permukaan-kontainer.
- **Internal Padding:** 1.5rem untuk panel utama, 1rem untuk kartu, 0.5rem untuk baris padat.

### Navigation

- **Rail:** lebar 16rem, atau 4.5rem saat dipipihkan. Latar navy. Tetap di kiri di desktop dan menjadi drawer di ponsel.
- **Item:** ikon 20px ditambah label `label-md`, radius 0.5rem, padding 0.5rem 0.75rem.
- **Active:** latar kuning arsip, teks `on-secondary-fixed` bold. Satu-satunya warna aksi di rail.
- **Hover:** latar navy container, teks putih.
- **Lencana jumlah:** angka tabular di kanan item memakai `label-sm`. Sumber yang gagal memuat menampilkan tanda pisah, bukan angka nol.
- **Tidak aktif:** `aria-disabled`, opacity rendah, tanpa tautan.

### Chips

- **Style:** pill penuh, `label-sm` bold, dua baris teks: nilai dan keterangan.
- **Triage konseling:** netral memakai permukaan-kontainer di atas tinta sekunder; perhatian memakai kuning arsip di atas `on-secondary-fixed`; mendesak memakai merah muda di atas `on-error-container`.
- **Status:** dipilih, bukan dekorasi. Badge yang tidak membawa keadaan dihapus.

### Charts

Grafik digambar sebagai SVG murni, tanpa pustaka grafik.

- **Seri:** seri diagram `#2563eb`, lewat token, bukan hex hardcode.
- **Garis tren:** 2.5px dengan `stroke-linejoin: round`. Area di bawahnya memakai opacity 0.12.
- **Grid:** `currentColor` pada opacity 0.12 sampai 0.14, tiga garis horizontal.
- **Onset:** garis vertikal putus-putus ditambah panah naik atau turun di titik perubahan volume dua kali lipat dari sehari sebelumnya.
- **Label sumbu dan legenda wajib Bahasa Indonesia**, dan setiap seri punya `aria-label` yang menyebut angkanya.

## Do's and Don'ts

### Do:

- **Do** ambil warna dari `styles/tokens.css`. Itu satu-satunya sumber, dan tidak ada hex kedua di komponen.
- **Do** tulis ukuran area admin dalam CSS penuh dan biarkan `zoom: 0.75` yang mengecilkannya.
- **Do** beri setiap panel keadaan lengkap: memuat dengan pengumuman untuk pembaca layar, kosong dengan aksi, gagal dengan pesan Bahasa Indonesia, dan akses ditolak saat sesi kedaluwarsa.
- **Do** nyatakan kegagalan sebagian secara eksplisit. Angka yang gagal dimuat ditandai gagal, tidak pernah berubah menjadi nol.
- **Do** pakai `tabular-nums` untuk setiap angka yang dibandingkan dengan angka lain atau yang bisa berubah saat dibaca.
- **Do** hormati `prefers-reduced-motion`. Transisi hilang saat dimatikan.

### Don't:

- **Don't** pakai kuning arsip sebagai latar kartu, warna judul, atau hiasan. Ia hanya untuk aksi, penanda, dan perhatian.
- **Don't** pakai merah pada kartu yang tidak bermasalah. Merah berarti berhenti atau gagal.
- **Don't** membuat gradien teks, glass dan blur sebagai hiasan, atau bayangan tanpa offset.
- **Don't** memakai baris kartu ikon-dan-judul sebagai struktur halaman. Kartu adalah wadah, bukan tata letak.
- **Don't** memakai ukuran atau bobot di luar skala tipografi, dan jangan menambah keluarga huruf baru.
- **Don't** menyalin isi `tokens.css` ke `globals.css`. Ubah di sumbernya agar publik dan admin tetap identik.
- **Don't** memakai emoji atau glyph Unicode sebagai pengganti ikon. Ikon digambar dari satu pustaka dengan satu ketebalan garis.
- **Don't** menampilkan identitas siswa di permukaan yang tidak diperbolehkan untuk memuatnya.

<!-- impeccable:design-schema 1 -->
