-- Data kelulusan siswa, dikelola admin dan hanya dapat dicek publik dengan NISN.
-- Jalankan setelah backup database. Tabel dan data dipertahankan saat rollback aplikasi.
CREATE TABLE IF NOT EXISTS kelulusan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nisn VARCHAR(10) NOT NULL UNIQUE,
  nama_siswa VARCHAR(150) NOT NULL,
  kelas VARCHAR(80) NOT NULL,
  jurusan VARCHAR(100) NOT NULL,
  tahun_lulus SMALLINT UNSIGNED NOT NULL,
  status ENUM('Lulus', 'Tidak Lulus') NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_kelulusan_publik (aktif, tahun_lulus)
) ENGINE=InnoDB;
