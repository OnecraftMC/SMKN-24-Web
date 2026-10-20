-- =============================================================================
-- Migration: notifikasi WhatsApp Guru BK (eskalasi laporan berat)
--
-- Aditif saja: 2 tabel baru. Aman diulang (IF NOT EXISTS). Data lama tidak
-- disentuh. Jalankan SATU KALI setelah backup, lewat phpMyAdmin.
--
-- PENTING — cara impor yang benar (salah ini memunculkan #1046):
--   1. Klik NAMA DATABASE di panel kiri phpMyAdmin dahulu
--      (local: smkn24; Hostinger produksi: u104889167_admin_dash_24 —
--      sesuaikan dengan DB_NAME di file .env backend).
--   2. Baru buka tab "Import" DI HALAMAN database itu, pilih file ini, Go.
--   3. JANGAN pakai menu "Import" di bagian paling atas (level server).
--   File ini idempotent, jadi aman dijalankan ulang.
--
-- Struktur:
--   bk_wa_setting -> konfigurasi eskalasi (1 baris, id=1): tujuan, toggle,
--                    ambang jumlah laporan berat terbuka, provider (Fonnte).
--                    Dikelola dari dashboard admin /admin/bk.
--   bk_wa_alert   -> jejak setiap percobaan kirim (audit + anti-spam).
--
-- Credential gateway (WA_API_TOKEN / WA_API_URL) TIDAK ada di tabel ini —
-- hanya di .env backend (server-only). Yang di sini hanya nomor tujuan.
-- =============================================================================

-- 1) Konfigurasi eskalasi (single-row, id = 1).
CREATE TABLE IF NOT EXISTS bk_wa_setting (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  -- Nomor tujuan Guru BK dalam format internasional tanpa '+' (62812xxxx).
  -- NULL/kosong = belum dikonfigurasi; notifikasi dilewati dengan log 'Dilewati'.
  target VARCHAR(30) NOT NULL DEFAULT '',
  -- Toggle utama: 0 = fitur mati (dipakai untuk demo/presentasi), 1 = aktif.
  aktif TINYINT(1) NOT NULL DEFAULT 0,
  -- Ambang jumlah laporan berat terbuka yang memicu notifikasi.
  threshold INT UNSIGNED NOT NULL DEFAULT 10,
  provider ENUM('fonnte','wablas') NOT NULL DEFAULT 'fonnte',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Baris konfigurasi tunggal. INSERT ... ON DUPLICATE KEY = idempotent dan tidak
-- menimpa nilai yang sudah diubah admin lewat dashboard (karena IF(target='')).
INSERT INTO bk_wa_setting (id, target, aktif, threshold, provider)
VALUES (1, '', 0, 10, 'fonnte')
ON DUPLICATE KEY UPDATE target = IF(target = '', VALUES(target), target);

-- 2) Jejak pengiriman: dipakai anti-spam (cooldown per target) dan audit.
CREATE TABLE IF NOT EXISTS bk_wa_alert (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jumlah_laporan INT UNSIGNED NOT NULL DEFAULT 0,
  target VARCHAR(30) NOT NULL DEFAULT '',
  pesan TEXT DEFAULT NULL,
  status ENUM('Terkirim','Gagal','Dilewati') NOT NULL,
  -- Alasan singkat untuk 'Gagal'/'Dilewati'; NULL untuk 'Terkirim'.
  error VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_bk_wa_alert_target (target, created_at),
  KEY idx_bk_wa_alert_status (status)
) ENGINE=InnoDB;
