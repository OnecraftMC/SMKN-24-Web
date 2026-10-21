# SMKN 24 Admin — APK Android

APK Android untuk membuka dashboard admin SMKN 24 Jakarta langsung dari HP.
Aplikasi ini adalah **shell native (WebView)** untuk dashboard yang sama dengan
versi web, bukan aplikasi kedua dengan database sendiri.

| Item | Nilai |
|---|---|
| Package | `id.sch.smkn24.admin` |
| Versi | `1.1` (`versionCode 2`) |
| minSdk / targetSdk | 24 / 35 |
| Server default | `https://macdeep.my.id/login` |
| Output | `~/Downloads/SMKN24-Admin-1.1.apk` |
| Artefak di repo | tidak ada (build ke `~/.cache/smkn24-admin-build`) |
| SHA-256 APK 1.1 | `9c4bba900ab85342628d6f4aa066106a37fb2b2669e43ea32d9b57de385c7116` |

## Integrasi dengan web dan database

- APK membuka halaman login/dashboard web `macdeep.my.id` di WebView.
- Login, CRUD, unggah gambar, unduh arsip, dan ekspor CSV tetap dijalankan oleh
  aplikasi web + API PHP/Laravel di server.
- Jadi setiap perubahan dari HP **langsung tersimpan di database sekolah**.
  APK tidak menyimpan kredensial MySQL dan tidak punya akses langsung ke DB.
- Token login disimpan di localStorage WebView, sehingga aplikasi langsung
  membuka dashboard selama token masih berlaku (JWT ±8 jam). Setelah kedaluwarsa,
  admin perlu login lagi.
- Alamat server bisa diganti dari menu **⋮ → Pengaturan server** (misalnya untuk
  staging atau IP lokal). Default-nya `https://macdeep.my.id/login`.

## Ketahanan saat frontend/backend di-redeploy

- APK selalu memuat situs live, jadi redeploy frontend di domain yang sama langsung
  terpakai tanpa build ulang APK.
- Backend boleh diubah/dipindah selama frontend ikut diperbarui; APK tidak memanggil
  API secara langsung.
- Redirect apex ↔ `www` tetap di dalam aplikasi, dan bila `/login` hilang (404/410)
  APK otomatis mencoba `/admin` lalu `/`.
- Error 5xx saat deploy menampilkan halaman **Coba lagi**.
- Tidak ada certificate pinning, sehingga perpanjangan SSL Hostinger aman.
- Pindah domain total atau SSO di domain lain: ganti alamat lewat **Pengaturan server**
  atau build ulang dengan `DEFAULT_SERVER` baru.

## Fitur

- Toolbar native dengan logo sekolah + indikator server.
- WebView responsif, JavaScript, DOM storage, dan cookie pihak ketiga.
- Unggah foto/berkas dari **kamera** atau **galeri/penyimpanan**.
- Unduh berkas biasa lewat DownloadManager; unduhan blob (arsip, bukti prestasi,
  ekspor CSV yang memakai `URL.createObjectURL`) disimpan bertahap ke
  `Download/SMKN 24 Admin/`.
- Tarik-ke-bawah untuk memuat ulang, menu muat ulang, buka di browser, logout,
  dan tentang aplikasi.
- Pintasan launcher (Android 7.1+): Berita, Pengumuman, Agenda, Galeri, Pesan BK.
- Deep link `smkn24admin://admin/berita` (path `/admin/...`).
- Halaman error + tombol coba lagi bila server tidak dapat dihubungi atau HTTP 5xx.
- Fallback otomatis `/login` → `/admin` → `/` bila rute login berubah.
- Tautan eksternal, `mailto:`, `tel:`, dan WhatsApp dibuka di aplikasi terkait.

## Instalasi di HP admin

1. Kirim `SMKN24-Admin-1.1.apk` ke HP (kabel, Google Drive, WhatsApp, dsb.).
2. Buka berkas APK, izinkan **Install unknown apps** untuk aplikasi pengirim.
3. Pasang, lalu buka **SMKN 24 Admin**.
4. Login memakai akun admin sekolah. Jika alamat server berbeda, ubah lewat
   menu **⋮ → Pengaturan server**.

Pembaruan APK harus ditandatangani dengan **kunci yang sama** agar bisa dipasang
menimpa versi lama. Kunci dibuat di:

```text
~/.local/share/smkn24-admin/smkn24-admin.jks
~/.local/share/smkn24-admin/smkn24-admin.jks.pass
```

**Cadangkan kedua berkas itu.** Tanpa keduanya, versi baru tidak bisa
memperbarui aplikasi yang sudah terpasang (harus uninstall dulu).

## Build ulang

Prasyarat (sudah terpasang di mesin build ini):

- JDK 17 di `~/.local/android-build/jdk`
- Android SDK 35 + build-tools 35.0.0 di `~/.local/android-build/sdk`

Bisa juga diarahkan lewat `JAVA_HOME` dan `ANDROID_SDK_ROOT`.

```bash
cd penggabungan-monorepo/android-admin
./build-apk.sh
```

Hasil:

```text
~/.cache/smkn24-admin-build/SMKN24-Admin-1.1.apk
~/Downloads/SMKN24-Admin-1.1.apk
~/Downloads/SMKN24-Admin-1.1.apk.sha256
```

Verifikasi unduhan: `cd ~/Downloads && sha256sum -c SMKN24-Admin-1.1.apk.sha256`.

Naikkan versi saat rilis berikutnya:

```bash
VERSION_CODE=3 VERSION_NAME=1.2 ./build-apk.sh
```

Versi diambil dari `VERSION_CODE`/`VERSION_NAME` saat build. Jangan menambahkan
`android:versionCode`/`android:versionName` di manifest karena akan menimpa nilai tersebut.

Ganti alamat default dengan mengubah `DEFAULT_SERVER` di
`src/id/sch/smkn24/admin/MainActivity.java` (atau cukup lewat menu di HP).

## Struktur

```text
android-admin/
├── AndroidManifest.xml
├── build-apk.sh
├── res/                     # ikon, splash, warna, tema
└── src/id/sch/smkn24/admin/
    ├── MainActivity.java    # toolbar, WebView, menu, file chooser, deep link
    ├── CacheFileProvider.java # berbagi foto kamera ke input file WebView
    └── DownloadBridge.java  # simpan unduhan blob ke folder Download
```

## Catatan keamanan

- APK memakai HTTPS secara default. `usesCleartextTraffic` diaktifkan agar
  dashboard yang masih HTTP di jaringan lokal tetap bisa diuji; gunakan HTTPS
  untuk produksi.
- Tidak ada kredensial database, API key, atau JWT di dalam APK.
- `logout` menghapus token lokal, cookie, cache, dan riwayat WebView. Token di
  server tidak dicabut dan tetap valid sampai kedaluwarsa (±8 jam).
- Sertifikat HTTPS yang tidak valid ditolak (tidak ada bypass SSL).

## Bukti validasi (emulator Android 15 / API 35, 2026-10-21, rilis 1.1)

- APK 1.1 terpasang menimpa 1.0; `aapt`/`dumpsys` menunjukkan versionCode 2, versionName 1.1.
- Saat `/login` disimulasikan 404, APK otomatis membuka `/admin` (fallback bekerja).
- Login dengan password salah menampilkan **"Username atau password salah."**
  dari API server — membuktikan APK terhubung ke web + database live.
- Dialog **Pengaturan server** menyimpan URL baru dan memuat ulang WebView.
- Unggah dari **galeri** berhasil (`Dipilih: 1000000046.png`).
- Unggah dari **kamera** berhasil (`Dipilih: camera_...jpg`).
- Unduhan blob otomatis tersimpan di `Download/SMKN 24 Admin/auto-blob.txt`
  dengan isi yang benar.
- APK lolos verifikasi tanda tangan v2 + v3 (sertifikat SHA-256
  `efd53fb8baa2bb86091832bfe5479756ae1155b7ded6f7d6921ac77d8c2f8f46`).
