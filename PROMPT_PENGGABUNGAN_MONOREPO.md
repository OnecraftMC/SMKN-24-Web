# Prompt Agent: Konsolidasi Website SMKN 24 Jakarta untuk Hostinger

> Salin seluruh isi dokumen ini ke AI coding agent yang akan mengerjakan migrasi. Prompt ini meminta agent mengaudit dan mengimplementasikan salinan aplikasi di folder baru; jangan menjalankan migrasi langsung pada source monorepo.

## Peran dan tujuan

Anda adalah senior full-stack engineer yang bertanggung jawab menggabungkan website publik dan dashboard admin SMK Negeri 24 Jakarta menjadi **satu aplikasi deployable**, dengan hasil kerja hanya di folder baru bernama persis `penggabungan monorepo/` pada root repository.

Tujuan pengguna:

- Mempertahankan website publik dan dashboard admin dalam satu aplikasi Next.js, bukan dua aplikasi Next.js terpisah.
- Menggabungkan dependensi dan kode bersama yang sekarang berada di `packages/shared` ke dalam aplikasi tunggal.
- Mempertahankan seluruh halaman, desain, aset, alur, API, serta kemampuan backend yang benar-benar tersedia.
- Pengunjung menekan tombol **Login** di website publik, masuk ke halaman login admin dalam origin yang sama, memasukkan kredensial valid, lalu diarahkan ke dashboard admin.
- Menyediakan folder hasil yang hanya berisi file sumber/konfigurasi/aset yang diperlukan. Jangan sertakan `node_modules/`, `.next/`, `.git/`, cache, hasil build, atau file rahasia. Pemilik proyek akan menjalankan `npm install` sendiri nanti.
- Jangan mengubah, menghapus, memindahkan, atau memformat ulang file di aplikasi sumber. Struktur dan working tree yang ada harus tetap utuh.

Konteks: pemilik proyek tinggal sekitar empat hari menuju perlombaan. Utamakan stabilitas, paritas fitur, dan jalur deployment yang dapat dibuktikan. Hindari redesign visual, refactor spekulatif, migrasi bahasa backend besar, dan perubahan yang tidak diperlukan.

## Konteks repository yang sudah diketahui

Repository adalah monorepo; verifikasi ulang semua informasi di bawah terhadap checkout aktual sebelum mengimplementasikan. Jangan menganggap dokumen lama selalu lebih mutakhir daripada source code.

### Aplikasi yang menjadi sumber

- `apps/main-web/`: website publik Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS 4.
- `apps/admin/`: dashboard Next.js dengan versi Next/React yang saat ini sama dengan main-web.
- `packages/shared/`: token CSS, tipe, dan mapper bersama. Konsolidasi berarti pindahkan/rapikan implementasinya ke dalam aplikasi tunggal; jangan meninggalkan import yang keluar dari folder target.
- `backend/`: REST API PHP tanpa framework, PDO/MySQL, JWT, serta upload gambar. Ini adalah backend aktif dan sumber kontrak API.
- `backend/uploads/`: aset hasil upload yang mungkin digunakan oleh konten. Audit file dan referensinya; pertahankan aset website yang dibutuhkan, tetapi jangan memasukkan rahasia atau data database.

### Halaman website publik yang teridentifikasi

- `/`
- `/profil`
- `/akademik`
- `/kabar`
- `/fasilitas`
- `/berita`
- `/berita/[slug]`
- `/jurusan`
- `/jurusan/[key]`
- `/login` saat ini me-redirect ke origin admin melalui `NEXT_PUBLIC_ADMIN_URL`.

Komponen publik mencakup antara lain navbar/menu mobile, beranda (hero, sorotan, sambutan kepala sekolah, berita, pengumuman, agenda, lokasi), profil/visi-misi/guru/fasilitas, akademik (matriks jadwal, arsip unduhan, formulir BK), kabar (berita unggulan, galeri, CTA karya/prestasi), chatbot, footer, loading/reveal, dan komponen UI. Cari serta inventarisasi semua file; daftar ini bukan izin untuk melewatkan komponen lain.

### Dashboard admin yang teridentifikasi

Saat ini dashboard memiliki overview dan modul aktif CRUD:

- berita/highlight;
- pengumuman/papan beranda;
- agenda;
- guru;
- fasilitas;
- galeri;
- jadwal.

Sidebar juga mencantumkan modul belum aktif/belum dibuat: arsip, inbox BK, aspirasi, pengajuan prestasi, riwayat chatbot, dan pengaturan/profil sesi. Jangan mengarang bahwa modul-modul ini sudah memiliki UI. Audit status implementasi aktual dan bedakan dengan tegas: UI tersedia, API/backend tersedia, belum tersedia, atau belum diverifikasi.

### Backend dan resource

Tabel/API backend yang sudah teridentifikasi:

- autentikasi: `admin_users`, `POST /api/auth/login.php`, `GET /api/auth/me.php`;
- konten: berita, pengumuman, agenda, guru, jadwal, galeri, fasilitas;
- upload gambar: `/api/upload.php`;
- inbox/form publik: pesan BK, aspirasi;
- chatbot: `/api/chat/index.php` dan riwayat admin `/api/chat/history.php`.

Login backend menggunakan **username + password**, mengeluarkan JWT, dan tidak menyediakan registrasi publik atau tabel pengguna umum. Jangan mengasumsikan “user biasa” memiliki hak dashboard. Halaman Login publik hanya pintu masuk admin; hanya akun valid yang sudah ada di backend boleh mengakses dashboard. Jangan menambahkan sign-up, role, permission, atau akun contoh tanpa kontrak dan persetujuan pemilik.

Tidak ada resource arsip dokumen atau pengajuan prestasi terpisah yang diketahui di schema backend. Jika fitur publik memakai istilah “Kirim Karya/Prestasi”, jangan memetakannya secara palsu ke tabel aspirasi atau galeri. Catat gap dan pertahankan alur yang sekarang benar-benar ada.

### Environment yang teridentifikasi

Backend `backend/.env.example` memuat kategori variabel:

- `APP_ENV`, `JWT_SECRET`;
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_CHARSET`;
- pilihan AI `AI_PROVIDER`, key/model/base URL OpenAI, Gemini, Anthropic.

Aplikasi publik menggunakan:

- `BACKEND_URL` (server-side URL HTTP ke backend, bukan host/port MySQL);
- `NEXT_PUBLIC_ADMIN_URL`;
- `ADMIN_ORIGIN` pada route CORS Next.js.

Aplikasi admin menggunakan:

- `NEXT_PUBLIC_API_URL` (browser mengakses backend);
- `NEXT_PUBLIC_MAIN_WEB_URL`.

Pada satu origin, sederhanakan konfigurasi bila aman dan benar. Jangan menyalin kredensial, key, JWT secret, `.env`, `.env.local`, atau konfigurasi hosting privat ke folder hasil. Hasilkan `.env.example` baru berisi nama variabel dan nilai placeholder saja.

## Aturan keras: batas keselamatan dan file

1. Buat `penggabungan monorepo/` jika belum ada. Jangan menulis file hasil di luar folder tersebut, kecuali jika pengguna meminta secara eksplisit.
2. Jangan mengubah source `apps/main-web/`, `apps/admin/`, `backend/`, `packages/shared/`, atau dokumentasi sumber. Perlakukan perubahan yang sudah ada di working tree sebagai milik pemilik proyek.
3. Jangan menjalankan `git clean`, `git reset`, `git checkout`, atau perintah destruktif. Jangan memindahkan/menghapus file sumber.
4. Folder target tidak boleh mengandung `.git/`, `node_modules/`, `.next/`, `dist/`, cache, log build, file database runtime, atau secret. Setelah validasi, pastikan tidak ada artefak tersebut.
5. Jangan menyalin `.env*` asli. Salin hanya `.env.example` yang sudah ditinjau dan disanitasi.
6. Salin hanya aset yang diperlukan aplikasi. Pastikan lisensi/sumber aset tidak diubah atau diklaim ulang. Pertahankan logo, font/aset lokal, gambar publik, dan upload yang memang dirujuk; jangan membawa file sementara atau data privat.
7. Tidak boleh ada import relatif/alias yang keluar dari `penggabungan monorepo/`. Hasil harus menjadi project mandiri.
8. Jangan menghapus fitur agar build menjadi hijau. Jika ada fitur rusak/tidak tersedia, catat sebagai gap dan berikan perilaku error yang jujur.

## Gerbang kelayakan Hostinger: wajib sebelum implementasi besar

Sebelum memilih arsitektur, periksa dokumentasi deployment repository dan jelaskan konfigurasi hosting yang dibutuhkan:

1. Tentukan apakah paket Hostinger pemilik mendukung aplikasi Next.js/Node.js serta PHP pada domain/account yang sama, dan bagaimana routing document root/subdomain/path bekerja. Nama paket dan batasannya belum diberikan; jangan mengarang dukungan fitur Hostinger.
2. Backend saat ini adalah PHP + PDO/MySQL. Menyatukan source tree **tidak otomatis** menyatukan runtime. Jangan mengklaim PHP akan berjalan dari Next.js, atau sebaliknya.
3. Pilih arsitektur paling kecil risikonya yang tetap dapat dideploy pada paket tersebut. Pertahankan kontrak PHP apabila hosting bisa menjalankan PHP backend bersama aplikasi Node. Jika browser/admin dan website menggunakan origin yang sama, utamakan request same-origin agar CORS tidak menjadi masalah.
4. Jika paket hanya mendukung PHP dan tidak dapat menjalankan Next.js server features, atau membutuhkan rewrite seluruh backend ke Node agar satu runtime, **jangan melakukan rewrite diam-diam**. Berhenti sebelum migrasi backend besar; tulis laporan kelayakan spesifik, kebutuhan paket/domain/subdomain, alternatif, perubahan risiko, dan minta keputusan pemilik.
5. Jika route Next.js menjadi BFF/proxy ke PHP, pertahankan auth JWT, status/error body, upload multipart, timeout, cache policy, metode HTTP, dan validasi. Jangan mengekspos secret AI, `JWT_SECRET`, atau kredensial database ke browser.

## Rencana pengerjaan wajib

### Tahap 1: audit dan matriks paritas

Sebelum menyalin atau mengedit:

- Baca `AGENTS.md`, `README.md`, konfigurasi, `.env.example`, serta instruksi spesifik tiap app. Untuk Next.js, ikuti instruksi lokal `apps/main-web/AGENTS.md`: baca dokumentasi versi yang terpasang di `node_modules/next/dist/docs/` sebelum mengubah API Next.
- Inventarisasi semua route publik dan API dari filesystem aktual; baca seluruh `page.tsx`, layout, route handlers, admin pages, komponen shell, hooks, lib, shared types/mappers/tokens, backend endpoints/helpers/schema, asset paths, dan dependensi yang benar-benar di-import.
- Buat matriks paritas di dalam folder target (misalnya `MIGRATION_MATRIX.md`) berisi sumber → route tujuan → komponen/data/API → status implementasi → cara verifikasi. Tandai setiap item sebagai dipertahankan, dipindahkan, disesuaikan, gap backend, atau sengaja tidak disalin dengan alasan.
- Cocokkan desain dan alur dengan source aktual, bukan hanya dokumen inspeksi lama. Jangan menyimpulkan dari nama file bahwa fiturnya berfungsi.
- Jangan lanjut ke keputusan backend besar bila gerbang kelayakan Hostinger di atas belum dapat dipastikan.

### Tahap 2: bentuk aplikasi tunggal dan rute tanpa tabrakan

Gunakan satu root Next.js/package untuk halaman publik dan admin. Rute publik yang sudah ada harus tetap bekerja, termasuk dynamic route berita/jurusan dan 404.

Rute target yang disarankan:

- `/` tetap beranda publik;
- seluruh route publik lainnya tetap pada URL saat ini;
- `/login` menampilkan UI login admin yang sekarang berada di aplikasi admin (gaya/validasi/loading/error tetap dipertahankan), bukan redirect ke port/origin aplikasi admin lain;
- sesudah login backend berhasil, arahkan ke `/admin`;
- semua halaman dashboard dan link internal dashboard dipindahkan ke namespace `/admin/...`, misalnya `/admin/berita`, `/admin/agenda`, `/admin/pengumuman`, `/admin/guru`, `/admin/fasilitas`, `/admin/galeri`, `/admin/jadwal`;
- overview admin berada di `/admin`, bukan `/`, untuk menghindari bentrok homepage publik;
- API Next/BFF berada pada namespace yang konsisten seperti `/api/...`; hindari konflik dengan endpoint PHP. Catat URL dan routing akhir.

Gunakan route groups/layout terpisah agar Navbar/Footer/Chatbot/loading publik tidak muncul di login atau dashboard admin kecuali memang muncul pada source admin. Pertahankan tampilan kedua aplikasi: font, warna, token, spacing, focus/hover, ikon, responsivitas, shell/sidebar/topbar, dan Bahasa Indonesia. Integrasikan `packages/shared` secara lokal tanpa menggandakan definisi token/type.

### Tahap 3: integrasi auth, API, dan backend

- Implementasikan satu login flow memakai kontrak backend aktual (`username`, `password`, response token/user). Tidak boleh sukses palsu, akun default, atau akses dashboard tanpa auth.
- Pastikan status kredensial salah, loading, offline, timeout, token kedaluwarsa/401, logout, dan redirect ke halaman tujuan setelah autentikasi ditangani dengan jelas.
- Lindungi seluruh route admin di server/client sesuai pola yang didukung stack. Client-side hiding saja bukan kontrol akses.
- Pertahankan perilaku API/backend dan mapper DTO. Pastikan operasi CRUD admin tetap menggunakan semua endpoint dan metode yang tersedia; upload tetap multipart field `gambar` dan URL aset hasil upload tetap dapat dirender.
- Wire tampilan publik ke sumber data yang dimaksud tanpa mengubah desain atau field backend secara serampangan. Sediakan loading/error/empty states; jangan fallback ke data contoh seolah-olah berasal dari server.
- Pindahkan PHP backend beserta schema, helpers, endpoint, `.htaccess`, dan struktur `uploads/` yang diperlukan ke target bila arsitektur hosting menggunakannya. Sesuaikan routing dengan document root secara terbukti. Jangan meletakkan `.env` di web root yang bisa diunduh.
- Pertahankan error response umum untuk publik; detail exception hanya ke server log. Pastikan upload PHP tidak dapat mengeksekusi skrip.
- Periksa login lintas domain/origin; jika same-origin tercapai, hapus konfigurasi CORS yang tidak diperlukan hanya pada target dan buktikan request bekerja.

### Tahap 4: dependensi, konfigurasi, dan dokumentasi target

- Buat satu `package.json` untuk aplikasi gabungan. Susun union dari **dependensi yang benar-benar digunakan** kedua app; jangan membabi-buta membawa dependency mati seperti paket yang tidak dipakai. Pertahankan versi Next/React kompatibel dan script `dev`, `build`, `start`, `lint`, serta `typecheck`.
- Jangan salin `package-lock.json` salah satu app tanpa menyelesaikan konflik dependency. Buat/hasilkan lockfile target yang konsisten bila validasi instalasi dilakukan.
- Simpan seluruh file aset/source yang dibutuhkan dalam folder hasil. Berikan `README.md` mandiri berisi instalasi manual `npm install`, variabel environment, setup PHP/DB jika berlaku, URL route, perintah validasi, dan langkah deploy Hostinger yang sudah dibuktikan.
- Buat `.env.example` target tanpa secret. Sebutkan variabel mana server-only dan mana `NEXT_PUBLIC_*` yang ditanam pada saat build.
- Jangan mengubah desain visual atau menambahkan fitur baru demi demo; fokus pada paritas dan kestabilan.

## Checklist penerimaan wajib

Sebelum menyatakan selesai, verifikasi semua poin berikut atau jelaskan secara spesifik yang terhalang:

### Konten publik dan tampilan

- Setiap route publik dari matriks merender; logo/gambar/font tidak rusak; link navbar, menu mobile, footer, CTA, berita detail, jurusan, dan fasilitas punya tujuan valid.
- Tidak ada komponen halaman publik yang hilang saat dipindahkan ke layout gabungan.
- Data dinamis memakai API yang benar; tanggal, gambar, empty/error state, dan filter tampil sesuai kontrak.
- Form BK dan chatbot menampilkan hasil request yang sebenarnya. CTA aspirasi/karya dipertahankan sesuai makna sumber; jangan diklaim menjadi fitur backend jika endpoint/data model tidak mendukung.
- Arsip tidak boleh mengunduh placeholder `.txt` jika UI mengiklankan PDF/dokumen resmi. Jika file resmi belum tersedia, laporkan gap dan jangan membuat isi dokumen palsu.

### Login dan dashboard

- Klik Login dari desktop dan mobile menuju `/login` di origin yang sama.
- Kredensial salah tetap di login dengan pesan yang jelas; kredensial valid diarahkan ke `/admin`.
- Tanpa token / token invalid atau kedaluwarsa, route `/admin/*` tidak membocorkan dashboard.
- Logout membersihkan sesi lokal dan mengembalikan pengguna ke login; jangan menyebut JWT dicabut oleh server karena backend belum diketahui menyediakan revoke.
- CRUD semua modul admin aktif di matriks tetap berfungsi: create/read/update/delete, filter/pencarian, konfirmasi hapus, preview, validasi, dan upload.
- Item sidebar yang masih belum didukung backend/UI tetap ditandai belum tersedia, bukan link rusak atau fitur palsu. Catat gap untuk arsip, aspirasi, prestasi, riwayat chatbot, dan pengaturan bila belum terimplementasi.

### Struktur dan keamanan deliverable

- Hanya `penggabungan monorepo/` yang memuat hasil migrasi (plus file prompt ini di root). Source monorepo dan perubahan lokal tidak berubah.
- Pencarian source tidak menemukan import yang keluar dari folder target.
- Tidak ada `.env`/secret, `.git`, `node_modules`, `.next`, `dist`, cache, atau log build di folder target.
- Tidak ada `NEXT_PUBLIC_*` berisi secret.
- Build/typecheck/lint dijalankan bila lingkungan mengizinkan. Jika dependency belum dipasang, jangan mengklaim lulus; berikan perintah manual yang dapat dijalankan pemilik.
- Smoke-test request login (valid/invalid), endpoint public, endpoint terproteksi (tanpa token dan dengan token), CRUD, upload gambar, dan satu pemeriksaan viewport mobile/desktop bila browser tooling tersedia.

## Laporan akhir agent harus menyertakan

1. Arsitektur dan bukti kompatibilitas deployment Hostinger yang dipilih; sebutkan asumsi yang belum dapat diverifikasi.
2. Route map final publik, login, admin, dan API/backend.
3. Matriks paritas fitur, termasuk semua fitur yang belum didukung atau perlu keputusan pemilik.
4. Daftar file/folder yang dibuat **hanya di dalam `penggabungan monorepo/`**.
5. Dependensi final dan environment variables yang harus diisi di Hostinger, dengan penandaan server-only/public.
6. Perintah test/build yang dijalankan dan hasil sebenarnya.
7. Konfirmasi eksplisit bahwa source apps, backend, shared, dan perubahan lokal yang telah ada tidak diubah.
8. Jangan mengklaim website berhasil deploy ke Hostinger kecuali deploy nyata dan smoke test production benar-benar dilakukan.

Mulai dengan audit dan gerbang kelayakan. Setelah layak, implementasikan salinan mandiri di folder target secara bertahap. Jangan berhenti pada proposal semata jika arsitektur bisa diverifikasi; jangan melewati gerbang untuk melakukan rewrite backend yang tidak disetujui.