-- Kategori persisten, terpisah per modul. Jalankan sekali setelah backup database.
-- Kategori lama dimigrasikan; data konten yang sudah ada tidak diubah.

CREATE TABLE IF NOT EXISTS admin_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_name VARCHAR(32) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_category (module_name, category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE agenda ADD COLUMN kategori VARCHAR(100) DEFAULT NULL;
ALTER TABLE fasilitas ADD COLUMN kategori VARCHAR(100) DEFAULT NULL;
ALTER TABLE jadwal ADD COLUMN kategori VARCHAR(100) DEFAULT NULL;
ALTER TABLE pesan_bk ADD COLUMN kategori VARCHAR(100) DEFAULT NULL;
ALTER TABLE prestasi ADD COLUMN kategori VARCHAR(100) DEFAULT NULL;

INSERT INTO admin_categories (module_name, category_name)
SELECT 'berita', kategori FROM berita WHERE TRIM(kategori) <> '' GROUP BY kategori
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT INTO admin_categories (module_name, category_name)
SELECT 'pengumuman', kategori FROM pengumuman WHERE TRIM(kategori) <> '' GROUP BY kategori
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT INTO admin_categories (module_name, category_name)
SELECT 'guru', kategori FROM guru WHERE TRIM(kategori) <> '' GROUP BY kategori
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT INTO admin_categories (module_name, category_name)
SELECT 'galeri', kategori FROM galeri WHERE TRIM(kategori) <> '' GROUP BY kategori
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT INTO admin_categories (module_name, category_name)
SELECT 'arsip', kategori FROM arsip WHERE TRIM(kategori) <> '' GROUP BY kategori
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

INSERT IGNORE INTO admin_categories (module_name, category_name) VALUES ('arsip', 'Akademik');
