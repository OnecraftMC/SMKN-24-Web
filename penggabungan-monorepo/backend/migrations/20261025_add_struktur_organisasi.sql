-- Simpan satu gambar struktur organisasi yang dapat diganti admin.
CREATE TABLE IF NOT EXISTS struktur_organisasi (
  id TINYINT UNSIGNED PRIMARY KEY,
  gambar VARCHAR(500) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO struktur_organisasi (id, gambar)
VALUES (1, '/images/struktur-organisasi.jpeg')
ON DUPLICATE KEY UPDATE id = VALUES(id);
