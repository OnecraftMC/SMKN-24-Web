-- Migration aditif: pusat arsip dan pengajuan prestasi.
-- Backup database sebelum menjalankan. Aman untuk dijalankan ulang.
-- Jangan jalankan rollback destruktif setelah data produksi masuk; pemulihan
-- yang disarankan ialah nonaktifkan UI/API baru dan pertahankan tabel serta file.

CREATE TABLE IF NOT EXISTS arsip (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  kategori VARCHAR(100) NOT NULL DEFAULT 'Akademik',
  nama_file VARCHAR(180) NOT NULL,
  storage_key VARCHAR(40) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  ukuran_file INT UNSIGNED NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_arsip_publik (aktif, id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prestasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nisn VARCHAR(20) NOT NULL,
  nama_siswa VARCHAR(150) NOT NULL,
  kelas VARCHAR(80) NOT NULL,
  jurusan VARCHAR(100) NOT NULL,
  perlombaan VARCHAR(255) NOT NULL,
  tingkat VARCHAR(100) NOT NULL,
  tanggal_lomba DATE NOT NULL,
  penyelenggara VARCHAR(200) NOT NULL,
  prestasi VARCHAR(150) NOT NULL,
  deskripsi TEXT DEFAULT NULL,
  nama_file VARCHAR(180) DEFAULT NULL,
  storage_key VARCHAR(40) DEFAULT NULL UNIQUE,
  mime_type VARCHAR(100) DEFAULT NULL,
  ukuran_file INT UNSIGNED DEFAULT NULL,
  status ENUM('Baru','Ditinjau','Disetujui','Ditolak') NOT NULL DEFAULT 'Baru',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_prestasi_status_created (status, created_at)
) ENGINE=InnoDB;
