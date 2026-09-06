# Admin Panel — SMK Negeri 24 Jakarta

Sistem backend (Node.js + Express + SQLite) dan panel admin untuk mengelola:

- **Jadwal Pelajaran** — per jurusan, hari, sesi, jam, mata pelajaran, ruang
- **Galeri Foto** — upload foto + judul + **keterangan/caption** + kategori
- **Berita / Kabar** — berita & prestasi, termasuk headline utama
- **Teks & Konten Website** — kalimat-kalimat di beranda, profil, kontak, dll (bisa tambah field baru sendiri)
- **Data Guru** — profil guru (foto, jabatan, mapel, keterangan)

Semua data disimpan di database sungguhan (SQLite, file `smkn24.db`) lewat REST API — bukan sekadar tampilan, ini backend yang benar-benar berjalan dan menyimpan data secara permanen.

## Struktur folder

```
smkn24-admin/
└── backend/            <- SATU folder aplikasi (server + panel admin + database)
    ├── server.js
    ├── db.js
    ├── routes/
    ├── admin/           <- panel admin (HTML/JS), dilayani otomatis oleh server.js
    ├── uploads/          <- foto yang diupload tersimpan di sini
    ├── package.json
    └── .env.example
```

Semua sudah digabung jadi **satu folder aplikasi** (`backend/`) supaya mudah di-deploy ke layanan hosting Node.js (termasuk Hostinger) — cukup upload folder ini, tidak perlu server terpisah untuk panel admin.

## Cara menjalankan

Butuh **Node.js versi 18 ke atas** terpasang di komputer/server Anda.

```bash
cd backend
cp .env.example .env      # lalu buka .env dan ganti JWT_SECRET dengan string acak
npm install
npm start
```

Setelah server berjalan, buka di browser:

- Panel admin: **http://localhost:4000/admin**
- API: **http://localhost:4000/api**

Login pertama kali:

- Username: `admin`
- Password: `admin123`

**Segera ganti password ini** lewat menu **Pengaturan Akun** di panel admin setelah login pertama — jangan biarkan password default aktif di server yang bisa diakses publik.

## Cara kerja singkat

- Panel admin (`/admin`) adalah aplikasi frontend murni (HTML/JS tanpa build tool) yang memanggil API backend lewat `fetch()`.
- Login menghasilkan token (JWT) yang disimpan di browser dan dikirim di setiap permintaan mengubah data (tambah/edit/hapus). Endpoint untuk **membaca** data (GET) sengaja dibuat publik agar bisa langsung dipakai oleh website utama tanpa login.
- Upload foto disimpan sebagai file di `backend/uploads/` dan dapat diakses lewat `http://localhost:4000/uploads/<nama-file>`.
- Database SQLite tersimpan di `backend/data/smkn24.db` — cukup di-backup dengan menyalin file ini.

## Daftar endpoint API

| Metode | Endpoint | Keterangan | Login? |
|---|---|---|---|
| POST | `/api/auth/login` | Login admin | - |
| GET | `/api/auth/me` | Cek sesi & data admin | ✔ |
| POST | `/api/auth/change-password` | Ganti password | ✔ |
| GET | `/api/jadwal?jurusan=rpl` | Daftar jadwal (bisa difilter jurusan) | - |
| POST/PUT/DELETE | `/api/jadwal[/:id]` | Kelola jadwal | ✔ |
| GET | `/api/galeri?kategori=ekskul` | Daftar foto galeri yang tampil | - |
| POST/PUT/DELETE | `/api/galeri[/:id]` | Kelola foto (multipart, field file: `foto`) | ✔ |
| GET | `/api/berita` | Daftar berita yang tampil | - |
| POST/PUT/DELETE | `/api/berita[/:id]` | Kelola berita (multipart, field file: `foto`) | ✔ |
| GET | `/api/konten` atau `/api/konten/:key` | Ambil teks/konten | - |
| POST/PUT/DELETE | `/api/konten[/:key]` | Kelola teks/konten | ✔ |
| GET | `/api/guru` | Daftar guru yang tampil | - |
| POST/PUT/DELETE | `/api/guru[/:id]` | Kelola data guru (multipart, field file: `foto`) | ✔ |

## Menghubungkan ke website utama (`smkn24-jakarta.html`)

Saat ini website utama Anda berisi data statis langsung di HTML (jadwal, galeri, dsb ditulis manual di kode). Agar perubahan lewat admin panel benar-benar tampil di website, bagian JavaScript website perlu diubah supaya **mengambil data dari API** ini, bukan dari teks yang ditulis manual. Contoh polanya:

```html
<script>
  const API = 'http://localhost:4000/api'; // ganti sesuai alamat server saat online

  // Contoh: render galeri foto dari backend
  async function muatGaleri() {
    const res = await fetch(`${API}/galeri`);
    const data = await res.json();
    const grid = document.getElementById('galeri-grid');
    grid.innerHTML = data.map(item => `
      <div class="galeri-card group relative rounded-2xl overflow-hidden aspect-square border border-surface-container shadow-sm cursor-pointer" data-cat="${item.kategori}">
        <img class="w-full h-full object-cover" src="${item.foto.startsWith('http') ? item.foto : API.replace('/api','') + '/uploads/' + item.foto}" alt="${item.judul}" />
        <div class="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-surface">
          <p class="font-bold text-xs">${item.judul}</p>
          <p class="text-[11px] text-primary-fixed">${item.keterangan ?? ''}</p>
        </div>
      </div>`).join('');
  }
  muatGaleri();
</script>
```

Pola yang sama berlaku untuk `renderJadwal()` (ambil dari `/api/jadwal?jurusan=...`) dan teks-teks di halaman (ambil dari `/api/konten/hero_headline`, dsb). Ini tahap terpisah dari admin panel & backend itu sendiri — beri tahu saya bila Anda ingin saya langsung mengubah file `smkn24-jakarta.html` supaya tersambung otomatis ke API ini.

## Deploy ke Hostinger

Hostinger mendukung hosting Node.js lewat fitur **Node.js Web App** di hPanel — tersedia di paket **Business Web Hosting** ke atas, atau **Cloud Startup/Professional/Enterprise**, atau VPS. Paket shared hosting biasa (tanpa fitur Node.js) **tidak bisa** menjalankan backend ini.

### File apa saja yang perlu diupload

Cukup **isi folder `backend/`** (karena panel admin sudah ada di dalamnya, di `backend/admin/`). Yang **TIDAK** perlu diupload:
- `node_modules/` — akan dipasang otomatis oleh Hostinger saat build
- `data/` — database akan dibuat otomatis saat aplikasi pertama kali jalan (folder ini muncul sendiri, jangan diupload isi lama dari komputer Anda)
- `.env` — jangan diupload; isi environment variable-nya lewat pengaturan di hPanel (lihat di bawah)
- File di dalam `uploads/` (folder-nya sendiri boleh ikut, tapi kosongkan isinya)

Cara menyiapkan file upload:
1. Buka folder `backend/`
2. Kompres (zip) **seluruh isi folder `backend/`** — pastikan `package.json` dan `server.js` berada tepat di dalam root file zip (bukan di dalam sub-folder tambahan)
3. Saat mengompres, kecualikan `node_modules` dan `data` seperti di atas

### Langkah di hPanel

1. Login ke **hPanel** → menu **Websites** → **Add Website**
2. Pilih **Node.js Web App** (atau **Deploy Web App**)
3. Pilih **Upload your website files**, lalu unggah file `.zip` yang sudah disiapkan
4. Hostinger akan mendeteksi `package.json` dan menyarankan pengaturan build. Pastikan:
   - **Startup file**: `server.js`
   - **Node version**: 18, 20, 22, atau 24 (semua kompatibel)
   - **Install command**: `npm install` (biasanya otomatis)
5. Di bagian **Environment Variables**, tambahkan variabel yang sama seperti isi `.env.example`:
   - `JWT_SECRET` → isi dengan string acak yang panjang & rahasia (WAJIB diganti, jangan pakai contoh)
   - `SEED_ADMIN_USERNAME` → username admin awal (opsional, default `admin`)
   - `SEED_ADMIN_PASSWORD` → password admin awal (opsional, default `admin123` — tapi sebaiknya diisi sendiri yang lebih kuat)
   - `PORT` → biasanya Hostinger sudah mengatur otomatis lewat variabel `PORT`, biarkan sesuai default mereka jika ada
6. Klik **Deploy**. Setelah selesai, Hostinger memberi Anda alamat/domain untuk aplikasi ini.
7. Buka `https://<domain-anda>/admin` untuk masuk ke panel admin, dan `https://<domain-anda>/api` untuk cek API-nya hidup.

### Setelah online

- Ganti password admin default lewat menu **Pengaturan Akun** — jangan tunda, karena aplikasi ini sekarang bisa diakses siapa saja dari internet.
- Simpan file `.db` di folder `data/` secara berkala sebagai backup (lewat File Manager Hostinger atau FTP), karena itu tempat semua data (jadwal, foto, teks) tersimpan.
- Jika nanti website utama (`smkn24-jakarta.html`) juga dihosting di domain yang sama, gunakan alamat relatif `/api/...` di kodenya. Jika dihosting di domain terpisah, gunakan alamat lengkap `https://<domain-admin-anda>/api/...`.



## Deploy ke Rumahweb (cPanel — Node.js Selector)

Rumahweb (dan hosting cPanel lain yang berbasis CloudLinux) memakai fitur **"Setup Node.js App"** di dalam cPanel, bukan alur upload-zip seperti Hostinger. Pastikan paket hosting Anda mendukung Node.js (biasanya paket Business/Cloud Hosting Rumahweb — paket Personal murah umumnya tidak menyediakan fitur ini).

### 1. Siapkan file yang diupload
Sama seperti Hostinger: upload **isi folder `backend/`**, TAPI **jangan** upload `node_modules/`, `data/`, dan `.env` (nanti dibuat/diisi langsung di server). Boleh diupload sebagai `.zip` untuk diekstrak lewat File Manager, atau file satu-satu lewat FTP.

### 2. Buat aplikasi Node.js di cPanel
1. Login ke cPanel Rumahweb Anda.
2. Cari menu **Setup Node.js App** (di bagian Software).
3. Klik **Create Application**, lalu isi:
   - **Node.js version**: pilih versi terbaru yang tersedia (18 ke atas)
   - **Application mode**: `Production`
   - **Application root**: folder tujuan, misalnya `admin-smkn24` (folder ini nanti tempat semua file backend diletakkan)
   - **Application URL**: domain atau subdomain yang dipakai, misal `admin.smkn24jakarta.sch.id`
   - **Application startup file**: `server.js`
4. Klik **Create**.

### 3. Upload file aplikasi
Setelah aplikasi dibuat, cPanel akan membuatkan foldernya (sesuai *Application root* di atas). Lewat **File Manager** (atau FTP), masuk ke folder tersebut dan upload semua isi `backend/` ke situ (kecuali `node_modules`, `data`, `.env` seperti disebut di atas).

### 4. Install dependency lewat Terminal
1. Di halaman **Setup Node.js App**, pada aplikasi yang baru dibuat, klik tombol yang menampilkan perintah **"Enter to the virtual environment"** — salin perintahnya.
2. Buka menu **Terminal** di cPanel, tempel & jalankan perintah tadi (ini mengaktifkan environment Node.js khusus aplikasi Anda).
3. Jalankan: `npm install`
4. Tunggu sampai selesai (tanda sudah beres: folder `node_modules` muncul di File Manager).

### 5. Atur environment variable
Di halaman **Setup Node.js App**, edit aplikasi Anda dan cari bagian **Environment Variables** (Rumahweb menyediakan kolom untuk menambah variabel key-value). Tambahkan:
- `JWT_SECRET` → string acak rahasia (wajib diganti dari contoh)
- `SEED_ADMIN_USERNAME` dan `SEED_ADMIN_PASSWORD` → opsional, boleh dikosongkan (default `admin` / `admin123`, ganti lewat panel setelah login pertama)

Jika cPanel Anda tidak menyediakan kolom environment variable, alternatifnya: upload file `.env` (isinya sama seperti `.env.example`, cukup ganti nilainya) langsung ke folder aplikasi lewat File Manager.

### 6. Jalankan aplikasi
1. Kembali ke **Setup Node.js App**, klik **Restart** (atau **Start**) pada aplikasi Anda.
2. Buka domain/subdomain yang tadi diisi di *Application URL* — tambahkan `/admin` di belakangnya untuk membuka panel admin, misal `https://admin.smkn24jakarta.sch.id/admin`.
3. Kalau muncul error, cek **log** aplikasi lewat halaman Setup Node.js App (ada tombol untuk lihat error log), atau lihat isi *Passenger log file* yang diatur di sana.

**Catatan:** setiap kali Anda mengganti file di server (misalnya update kode), aplikasi perlu di-**Restart** lagi lewat halaman Setup Node.js App agar perubahan terbaca.

## Keamanan yang sudah diterapkan

- Password admin disimpan ter-enkripsi (hash bcrypt), bukan teks biasa.
- Semua aksi ubah data (tambah/edit/hapus) wajib token login yang valid dan kedaluwarsa otomatis setelah 12 jam.
- Upload foto dibatasi tipe file gambar dan ukuran maksimal 5MB.
