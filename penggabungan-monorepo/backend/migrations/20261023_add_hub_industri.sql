-- Tambahkan tabel mitra Hub Industri (aman dijalankan berulang kali).
CREATE TABLE IF NOT EXISTS hub_industri (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  logo VARCHAR(500) DEFAULT NULL,
  alamat TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  link_label VARCHAR(120) DEFAULT NULL,
  link_href VARCHAR(500) DEFAULT NULL,
  urutan INT NOT NULL DEFAULT 0,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_hub_industri_publik (aktif, urutan, id)
) ENGINE=InnoDB;
