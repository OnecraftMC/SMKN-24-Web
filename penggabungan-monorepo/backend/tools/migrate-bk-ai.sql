-- =============================================================================
-- Migrasi: Bimbingan Konseling berbasis AI (counsellor AI + triase)
--
-- Jalankan file ini SATU KALI pada database yang SUDAH ada sebelum memakai
-- layanan Bimbingan Konseling. Aman diulang beberapa kali (IF NOT EXISTS).
--
-- Import lewat phpMyAdmin (shared hosting) atau:
--   mysql -u <user> -p <nama_database> < backend/tools/migrate-bk-ai.sql
-- =============================================================================

-- Ringkasan masalah yang dirangkum AI.
SET @exist := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pesan_bk' AND COLUMN_NAME = 'ringkasan'
);
SET @sql := IF(@exist = 0,
  'ALTER TABLE pesan_bk ADD COLUMN ringkasan TEXT DEFAULT NULL AFTER tanggal',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tingkat kesulitan: Ringan / Sedang / Berat (prioritas guru BK).
SET @exist := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pesan_bk' AND COLUMN_NAME = 'tingkat_kesulitan'
);
SET @sql := IF(@exist = 0,
  "ALTER TABLE pesan_bk ADD COLUMN tingkat_kesulitan ENUM('Ringan','Sedang','Berat') DEFAULT NULL AFTER ringkasan",
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Kategori masalah.
SET @exist := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pesan_bk' AND COLUMN_NAME = 'kategori'
);
SET @sql := IF(@exist = 0,
  'ALTER TABLE pesan_bk ADD COLUMN kategori VARCHAR(50) DEFAULT NULL AFTER tingkat_kesulitan',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tanda ada indikasi risiko keselamatan (self-harm, kekerasan, ancaman).
SET @exist := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pesan_bk' AND COLUMN_NAME = 'butuh_perhatian'
);
SET @sql := IF(@exist = 0,
  'ALTER TABLE pesan_bk ADD COLUMN butuh_perhatian TINYINT(1) NOT NULL DEFAULT 0 AFTER kategori',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Transkrip percakapan siswa dengan counseller AI.
SET @exist := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pesan_bk' AND COLUMN_NAME = 'transkrip'
);
SET @sql := IF(@exist = 0,
  'ALTER TABLE pesan_bk ADD COLUMN transkrip MEDIUMTEXT DEFAULT NULL AFTER butuh_perhatian',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ID perangkat siswa (HP) untuk membaca history milik siswa sendiri.
-- Tidak memakai IP: IP handphone sering berubah dan IP sekolah dipakai
-- bersama banyak siswa sehingga history bisa tercampur.
SET @exist := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pesan_bk' AND COLUMN_NAME = 'device_id'
);
SET @sql := IF(@exist = 0,
  'ALTER TABLE pesan_bk ADD COLUMN device_id VARCHAR(64) DEFAULT NULL AFTER transkrip',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index untuk mempercepat pembacaan history per perangkat.
SET @exist := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pesan_bk' AND INDEX_NAME = 'idx_pesan_bk_device'
);
SET @sql := IF(@exist = 0,
  'CREATE INDEX idx_pesan_bk_device ON pesan_bk (device_id, tanggal)',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
