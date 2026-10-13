-- =============================================================================
-- Migration: telemetri analytics chatbot (PRD fitur-tambahan.md §7.1)
--
-- Aditif saja: 4 kolom nullable di chat_messages + 2 tabel baru. Aman diulang
-- (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS versi MariaDB didukung via
-- pengecekan information_schema). Data lama tidak disentuh: kolom baru NULL
-- = "belum diklasifikasi", query analytics memperlakukannya sebagai netral.
--
-- Jalankan SATU KALI setelah backup, lewat phpMyAdmin.
--
-- PENTING — cara impor yang benar (salah ini memunculkan #1046):
--   1. Klik NAMA DATABASE di panel kiri phpMyAdmin dahulu
--      (local: smkn24; Hostinger produksi: u104889167_admin_dash_24 —
--      sesuaikan dengan DB_NAME di file .env backend).
--   2. Baru buka tab "Import" DI HALAMAN database itu, pilih file ini, Go.
--   3. JANGAN pakai menu "Import" di bagian paling atas (level server) —
--      koneksi tidak punya database aktif, semua statement di bawah gagal
--      #1046 karena DATABASE() bernilai NULL.
--   File ini idempotent (IF NOT EXISTS + pengecekan information_schema),
--   jadi aman dijalankan ulang bila sebelumnya gagal di tengah jalan.
--
-- Struktur:
--   chat_messages.kategori       -> tebakan classifyChatCategory() (user saja)
--   chat_messages.sentimen       -> positif|netral|negatif (user saja)
--   chat_messages.di_luar_konteks-> 0/1 dari classifyOutOfContext() (user saja)
--   chat_messages.status_resolusi-> resolved|escalated|unanswered (bot saja)
--   chat_insights                -> insight AI + status tindak lanjut
--   chat_analytics_log           -> jejak generate insight & export (PRD §5)
-- =============================================================================

-- 1) Kolom telemetri di chat_messages (hanya bila belum ada).
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'
    AND COLUMN_NAME = 'kategori');
SET @sql := IF(@col = 0,
  'ALTER TABLE chat_messages ADD COLUMN kategori VARCHAR(40) NULL DEFAULT NULL AFTER text',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'
    AND COLUMN_NAME = 'sentimen');
SET @sql := IF(@col = 0,
  'ALTER TABLE chat_messages ADD COLUMN sentimen ENUM(''positif'',''netral'',''negatif'') NULL DEFAULT NULL AFTER kategori',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'
    AND COLUMN_NAME = 'di_luar_konteks');
SET @sql := IF(@col = 0,
  'ALTER TABLE chat_messages ADD COLUMN di_luar_konteks TINYINT(1) NULL DEFAULT NULL AFTER sentimen',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages'
    AND COLUMN_NAME = 'status_resolusi');
SET @sql := IF(@col = 0,
  'ALTER TABLE chat_messages ADD COLUMN status_resolusi ENUM(''resolved'',''escalated'',''unanswered'') NULL DEFAULT NULL AFTER di_luar_konteks',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Insight AI: hasil generate (otomatis/manual) + status tindak lanjut.
CREATE TABLE IF NOT EXISTS chat_insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipe ENUM('tren','konten_kurang','rekomendasi','teknis','faq') NOT NULL,
  judul VARCHAR(255) NOT NULL,
  isi TEXT NOT NULL,
  sumber ENUM('ai','heuristik') NOT NULL DEFAULT 'heuristik',
  periode_mulai DATE NULL,
  periode_selesai DATE NULL,
  status ENUM('baru','selesai','diabaikan') NOT NULL DEFAULT 'baru',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_chat_insights_status (status)
) ENGINE=InnoDB;

-- 3) Jejak audit generate insight & export (PRD §5 Logging).
CREATE TABLE IF NOT EXISTS chat_analytics_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aksi ENUM('generate_insight','export_csv','export_pdf') NOT NULL,
  detail VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_chat_analytics_log_aksi (aksi)
) ENGINE=InnoDB;
