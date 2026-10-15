# Panduan konfigurasi pembayaran kantin dengan Midtrans

## Status integrasi

Website membuat transaksi menggunakan Midtrans Snap dari backend PHP. Request sudah membatasi pilihan pembayaran ke GoPay dan QRIS. Backend menerima notifikasi pembayaran di `api/kantin/payment-notification.php`, memeriksa signature dan jumlah transaksi, lalu mengirim pesanan berstatus lunas ke daftar pesanan APK penjual. URL kembali setelah pembayaran menggunakan `CANTEEN_PUBLIC_URL`.

Kode sudah siap menerima konfigurasi, tetapi integrasi belum dapat dinyatakan aktif hanya dari repository. Di checkout lokal saat ini hanya tersedia `backend/.env.example`; nilai rahasia tidak disimpan di Git. Status akun, kunci, dan URL notifikasi di Hostinger perlu dikonfirmasi di dashboard terkait.

## Informasi yang diperlukan

Untuk menyiapkan nilai konfigurasi yang tepat, pemilik cukup mengonfirmasi:

1. URL publik website dan URL dasar API yang benar-benar dipakai APK. Default APK pada repository saat ini adalah `https://macdeep.my.id/backend`.
2. Apakah akun merchant Midtrans sudah aktif dan kanal GoPay serta QRIS sudah diaktifkan.
3. Mode yang akan dipakai. Mulai dari **Sandbox** untuk uji alur; beralih ke **Production** hanya setelah akun merchant disetujui dan uji sandbox berhasil.

Jangan kirim **Server Key**, password Midtrans, atau nomor rekening lewat chat. Server Key dimasukkan langsung ke `backend/.env` di server Hostinger. Informasi rekening pencairan diatur pemilik akun pada dashboard Midtrans.

## 1. Aktifkan metode pembayaran di Midtrans

1. Masuk ke dashboard Midtrans dan pilih lingkungan **Sandbox**.
2. Pastikan akun merchant dan metode **GoPay** serta **QRIS** sudah aktif. Integrasi website sudah mengirim `enabled_payments: ["gopay", "qris"]`; kanal yang belum diaktifkan di akun merchant tidak akan muncul saat checkout.
3. Buka **Settings → Configuration** dan isi **Payment Notification URL** dengan alamat endpoint di bawah, lalu simpan:

   ```text
   https://<domain-api>/backend/api/kantin/payment-notification.php
   ```

   Jika base API tetap `https://macdeep.my.id/backend`, alamat lengkapnya:

   ```text
   https://macdeep.my.id/backend/api/kantin/payment-notification.php
   ```

   URL harus publik, memakai HTTPS, dan menerima POST tanpa login tambahan. Endpoint memverifikasi signature Midtrans sebelum mengubah status pesanan. Dashboard menyediakan riwayat pengiriman notifikasi untuk mengecek apakah callback berhasil diterima.

## 2. Simpan konfigurasi di Hostinger

Pada File Manager Hostinger, buka folder backend yang sama dengan `api/kantin/`. Salin `backend/.env.example` menjadi `.env` jika file itu belum ada; jika `.env` sudah ada, **tambahkan hanya tiga variabel berikut** dan pertahankan variabel database, JWT, serta konfigurasi lain yang sudah dipakai:

   ```dotenv
   MIDTRANS_SERVER_KEY=<Server Key dari lingkungan Sandbox>
   MIDTRANS_IS_PRODUCTION=false
   CANTEEN_PUBLIC_URL=https://<domain-website>
   ```

Ambil **Server Key** dari halaman Access Keys dashboard Sandbox. Key ini hanya dipakai backend; jangan masukkan ke Next.js, APK, atau variabel `NEXT_PUBLIC_*`. Repository mengabaikan file `.env`, dan aturan `.htaccess` backend menolak akses web langsung ke file rahasia.

Untuk domain yang masih sama dengan default APK, contoh baris URL website:

   ```dotenv
   CANTEEN_PUBLIC_URL=https://macdeep.my.id
   ```

Jika domain website atau lokasi backend berbeda, ganti URL contoh pada file konfigurasi dan dashboard Midtrans sesuai lokasi sebenarnya. Jangan menambahkan `/backend` pada `CANTEEN_PUBLIC_URL`; variabel tersebut dipakai untuk URL kembali ke halaman kantin setelah checkout.

## 3. Uji di Sandbox

1. Buka halaman kantin, pilih menu, lalu buat pesanan uji.
2. Pastikan checkout membuka halaman pembayaran Midtrans dan pilihan GoPay/QRIS tersedia.
3. Selesaikan transaksi memakai skenario Sandbox resmi dari Midtrans.
4. Periksa **Settings → Configuration → See History** di dashboard Midtrans. Notifikasi harus terkirim dengan sukses.
5. Pastikan status pesanan berubah menjadi lunas dan pesanan muncul di APK penjual. Pesanan belum lunas tidak boleh masuk ke antrean penjual.
6. Uji juga transaksi yang dibatalkan atau kedaluwarsa agar pesanan tidak ditandai lunas.

Jangan memakai transaksi uang sungguhan saat menguji Sandbox.

## 4. Beralih ke Production

Setelah merchant disetujui, kanal pembayaran aktif, dan uji Sandbox berhasil:

1. Pilih lingkungan **Production** di dashboard Midtrans dan ambil Production Server Key.
2. Ganti nilai konfigurasi pada `.env` Hostinger:

   ```dotenv
   MIDTRANS_SERVER_KEY=<Production Server Key>
   MIDTRANS_IS_PRODUCTION=true
   CANTEEN_PUBLIC_URL=https://<domain-website>
   ```

3. Pastikan **Payment Notification URL** Production juga diarahkan ke endpoint backend yang benar. Pengaturan Sandbox dan Production dilakukan terpisah.
4. Simpan konfigurasi, lalu lakukan satu transaksi nyata hanya setelah pemilik menyetujui waktu uji dan nominalnya.

## Dana pembayaran dan GoPay

GoPay adalah metode yang dipakai pembeli untuk membayar; dana penjual tidak otomatis masuk ke dompet GoPay pribadi. Transaksi masuk ke akun merchant Midtrans, lalu pencairannya mengikuti rekening tujuan yang dikonfigurasi pada dashboard merchant. Pemilik sekolah perlu memastikan nama pemilik rekening dan entitas merchant sesuai ketentuan akun Midtrans.

## Referensi resmi

- [Access Keys Midtrans](https://docs.midtrans.com/docs/access-keys)
- [GoPay & QRIS](https://docs.midtrans.com/reference/gopay)
- [HTTP(S) Notification / Webhooks](https://docs.midtrans.com/docs/https-notification-webhooks)
- [Pengaturan rekening pencairan](https://docs.midtrans.com/docs/receive-your-fund)
