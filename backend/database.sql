-- =============================================================================
-- SMKN 24 Jakarta - Database Schema
-- Sesuai dengan struktur data di packages/shared/types.ts & apps/main-web/lib/data.ts
-- Import via phpMyAdmin / mysql CLI: mysql -u root -p smkn24 < database.sql
-- =============================================================================

CREATE DATABASE IF NOT EXISTS smkn24 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smkn24;

-- -----------------------------------------------------------------------------
-- Tabel admin (login panel admin)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- disimpan dengan password_hash()
  nama VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Akun admin TIDAK di-seed oleh skema ini.
-- Alasan: hash bawaan sebelumnya tidak dapat diverifikasi (diduga bcrypt untuk
-- "password", bukan "admin123" seperti komentar lamanya), sehingga kredensial
-- default yang menyesatkan dan mudah ditebak sengaja dihapus.
--
-- Buat akun admin pertama SETELAH import, dari folder backend:
--   php tools/create-admin.php admin "PasswordKuatAnda" "Administrator Sekolah"
-- Butuh hash saja (untuk UPDATE manual)? Jalankan:
--   php tools/hash-password.php "PasswordKuatAnda"

-- -----------------------------------------------------------------------------
-- Berita
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS berita (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  tanggal DATE NOT NULL,
  gambar VARCHAR(500) DEFAULT NULL,
  ringkasan TEXT,
  isi LONGTEXT,
  status ENUM('draft','terbit') NOT NULL DEFAULT 'terbit',
  utama TINYINT(1) NOT NULL DEFAULT 0, -- flag untuk beritaUtama
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Pengumuman
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pengumuman (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  isi TEXT,
  tanggal DATE NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  penting TINYINT(1) NOT NULL DEFAULT 0,
  gambar VARCHAR(500) DEFAULT NULL,
  badge VARCHAR(100) DEFAULT NULL,
  status VARCHAR(50) DEFAULT NULL,       -- ex: "Mendesak"
  link_label VARCHAR(150) DEFAULT NULL,
  link_href VARCHAR(255) DEFAULT NULL,
  icon VARCHAR(100) DEFAULT NULL,
  action_icon VARCHAR(100) DEFAULT NULL,
  variant VARCHAR(50) DEFAULT NULL,
  tampil_beranda TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Agenda
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agenda (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  tgl_mulai DATE NOT NULL,
  tgl_selesai DATE DEFAULT NULL,
  waktu VARCHAR(100) DEFAULT NULL,       -- ex: "08.00 - 15.00 WIB"
  lokasi VARCHAR(255) DEFAULT NULL,
  badge VARCHAR(100) DEFAULT NULL,
  deskripsi TEXT,
  gambar VARCHAR(500) DEFAULT NULL,
  tampil_beranda TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Guru
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guru (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  jabatan VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  kategori VARCHAR(100) NOT NULL, -- Pimpinan | Keahlian | BK | dst
  gambar VARCHAR(500) DEFAULT NULL,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Jadwal (per jurusan, per sesi)
-- jurusan: perhotelan | boga | busana | pplg | pariwisata
-- sesi: pagi | siang
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jadwal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jurusan ENUM('perhotelan','boga','busana','pplg','pariwisata') NOT NULL,
  sesi ENUM('pagi','siang') NOT NULL,
  urutan INT NOT NULL DEFAULT 0, -- posisi jam ke berapa (0..4)
  mapel VARCHAR(255) NOT NULL,
  jam VARCHAR(50) DEFAULT NULL,
  waktu VARCHAR(50) DEFAULT NULL,
  guru VARCHAR(150) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_slot (jurusan, sesi, urutan)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Galeri
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS galeri (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  gambar VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Fasilitas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fasilitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  gambar VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Pesan BK (konseling)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pesan_bk (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  kelas VARCHAR(50) NOT NULL,
  no_hp VARCHAR(30) DEFAULT NULL,
  keperluan VARCHAR(255) NOT NULL,
  pesan TEXT NOT NULL,
  status ENUM('Baru','Diproses','Selesai') NOT NULL DEFAULT 'Baru',
  tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Aspirasi (form aspirasi siswa/masyarakat)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aspirasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) DEFAULT NULL,
  email VARCHAR(150) DEFAULT NULL,
  kategori VARCHAR(100) DEFAULT NULL,
  pesan TEXT NOT NULL,
  status ENUM('Baru','Ditinjau','Selesai') NOT NULL DEFAULT 'Baru',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Riwayat Chat AI (opsional, untuk log/analisa percakapan chatbot)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(64) PRIMARY KEY, -- session id dari client (uuid/random string)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  sender ENUM('user','bot') NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Contoh data awal (opsional, boleh dihapus)
-- -----------------------------------------------------------------------------
INSERT INTO berita (judul, kategori, tanggal, gambar, ringkasan, status, utama) VALUES
('Tim Perhotelan SMKN 24 Raih Emas Lomba Kompetensi Siswa (LKS) Tingkat DKI Jakarta', 'Prestasi Siswa', '2024-10-28', NULL, 'Peserta didik jurusan Perhotelan berhasil mengungguli kontestan SMK se-DKI Jakarta.', 'terbit', 1),
('PKL Terpadu: Siswa RPL Magang di Perusahaan Pengembang Perangkat Lunak Mitra Industri', 'Studi Industri', '2024-10-20', NULL, 'Program PKL semester ini menempatkan siswa RPL di perusahaan mitra.', 'terbit', 0);

INSERT INTO pengumuman (judul, tanggal, kategori, isi, penting) VALUES
('Pengumuman SPMB 2025/2026 – Gelombang 2 Dibuka', '2024-11-15', 'Pendaftaran', 'Silakan lihat juknis lengkap di halaman akademik.', 1),
('Jadwal Ujian Akhir Semester Ganjil 2024/2025', '2024-11-10', 'Akademik', 'Jadwal terlampir.', 0);

INSERT INTO agenda (judul, tgl_mulai, tgl_selesai, waktu, lokasi) VALUES
('Peringatan Hari Guru Nasional', '2024-11-25', NULL, '07.30 - 12.00 WIB', 'Aula Utama SMKN 24'),
('Praktik Uji Kompetensi Keahlian (UKK) Periode I', '2024-12-02', '2024-12-06', '08.00 - 15.00 WIB', 'Laboratorium Kompetensi');

INSERT INTO guru (nama, jabatan, deskripsi, kategori, urutan) VALUES
('Dra. Isfariani Marlena, M.Pd.', 'Kepala Sekolah', 'Kepala SMK Negeri 24 Jakarta', 'Pimpinan', 1),
('Eva Yulianti, M.Pd.', 'Wakil Kepala Sekolah Bidang Humas & Kemitraan', 'Penghubung Kerja Sama DUDI', 'Pimpinan', 2);

INSERT INTO fasilitas (judul, deskripsi) VALUES
('Hotel Training', 'Laboratorium perhotelan dan housekeeping dilengkapi kamar simulasi dan peralatan standar industri.');
