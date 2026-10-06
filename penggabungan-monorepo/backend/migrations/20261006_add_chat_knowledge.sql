-- =============================================================================
-- Migration: knowledge base chatbot
--
-- Menambah tabel `knowledge` yang dipakai retrieval konteks pada
-- /api/chat. Tabel baru saja - tidak menyentuh tabel lain, tidak mengubah
-- atau menghapus data yang sudah ada.
--
-- Jalankan SATU KALI pada database existing, setelah backup, lewat phpMyAdmin.
-- Aman diulang beberapa kali (IF NOT EXISTS).
--
-- Catatan: index FULLTEXT memakai parser bawaan server (MySQL 5.6+/8.0 atau
-- MariaDB). Bila syntax ini ditolak server lama, jalankan tanpa dua baris
-- FULLTEXT di bawah - fungsi retrieveChatKnowledge() punya fallback LIKE.
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  kategori ENUM('PPDB','Jurusan','Jadwal','Fasilitas','Umum') NOT NULL DEFAULT 'Umum',
  konten TEXT NOT NULL,
  tags VARCHAR(255) NOT NULL DEFAULT '',
  sumber VARCHAR(255) NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_knowledge_judul (judul)
) ENGINE=InnoDB;

-- Cek dulu apakah index sudah ada supaya aman diulang.
SET @ft := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'knowledge'
    AND INDEX_NAME = 'ft_knowledge'
);
SET @sql := IF(@ft = 0,
  'ALTER TABLE knowledge ADD FULLTEXT INDEX ft_knowledge (judul, konten, tags)',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Selesai. Setelah import dataset, isi dengan:
--   php backend/tools/import-chat-knowledge.php backend/knowledge-dataset.md