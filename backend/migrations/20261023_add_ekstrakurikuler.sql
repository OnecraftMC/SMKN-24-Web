-- =============================================================================
-- Migrasi: Modul Ekstrakurikuler
--
-- Jalankan SATU KALI pada database yang SUDAH ada (setelah backup), sebelum
-- membuka /admin/ekstrakurikuler. Aman diulang: CREATE TABLE memakai
-- IF NOT EXISTS dan data contoh hanya dimasukkan ketika tabel masih kosong.
--
-- Endpoint backend/api/ekstrakurikuler juga menyiapkan tabel ini otomatis
-- saat pertama kali diakses, jadi migrasi manual bersifat opsional.
--
--   mysql -u <user> -p <nama_database> < backend/migrations/20261023_add_ekstrakurikuler.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS ekstrakurikuler (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(150) NOT NULL,
  deskripsi TEXT,
  logo VARCHAR(500) DEFAULT NULL,
  kategori VARCHAR(100) DEFAULT NULL,
  pembina VARCHAR(150) DEFAULT NULL,
  jadwal VARCHAR(150) DEFAULT NULL,
  lokasi VARCHAR(150) DEFAULT NULL,
  unggulan TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data contoh hanya untuk database yang belum punya eskul sama sekali.
-- Admin bebas mengganti logo, info, atau menghapus baris contoh ini.
SET @ekstrakurikuler_kosong := (SELECT COUNT(*) = 0 FROM ekstrakurikuler);

INSERT INTO ekstrakurikuler (nama, deskripsi, logo, kategori, pembina, jadwal, lokasi, unggulan)
SELECT * FROM (
  SELECT 'Paskibra' AS nama, 'Pasukan Pengibar Bendera melatih kedisiplinan, kepemimpinan, dan rasa cinta tanah air melalui latihan baris-berbaris serta protokol upacara.' AS deskripsi, '/images/ekstrakurikuler/paskibra.svg' AS logo, 'Kepemimpinan' AS kategori, 'Pembina Kesiswaan' AS pembina, 'Sabtu, 08.00 - 10.00 WIB' AS jadwal, 'Lapangan Utama' AS lokasi, 1 AS unggulan
  UNION ALL SELECT 'Pramuka', 'Gerakan Pramuka membentuk karakter mandiri, gotong royong, dan peduli lingkungan lewat kegiatan kepramukaan yang menyenangkan.', '/images/ekstrakurikuler/pramuka.svg', 'Kepemimpinan', 'Kak Pembina Pramuka', 'Jumat, 14.00 - 16.00 WIB', 'Aula Serbaguna', 1
  UNION ALL SELECT 'PMR', 'Palang Merah Remaja membekali siswa dengan pertolongan pertama, kesehatan remaja, dan kesiapsiagaan bencana.', '/images/ekstrakurikuler/pmr.svg', 'Sosial', 'Tim Kesehatan Sekolah', 'Rabu, 14.30 - 16.00 WIB', 'Ruang UKS', 0
  UNION ALL SELECT 'Basket', 'Klub basket mengembangkan teknik dasar, kerja sama tim, dan kebugaran melalui latihan rutin serta sparring antarsekolah.', '/images/ekstrakurikuler/basket.svg', 'Olahraga', 'Pelatih Basket', 'Selasa & Kamis, 15.30 - 17.00 WIB', 'Lapangan Basket', 1
  UNION ALL SELECT 'Futsal', 'Futsal menjadi wadah siswa menyalurkan minat olahraga, membangun sportivitas, dan bersiap mengikuti turnamen pelajar.', '/images/ekstrakurikuler/futsal.svg', 'Olahraga', 'Pelatih Futsal', 'Senin & Jumat, 15.30 - 17.00 WIB', 'Lapangan Futsal', 0
  UNION ALL SELECT 'Tari Tradisional', 'Sanggar tari melestarikan seni tari Nusantara sekaligus menyiapkan penampilan untuk acara sekolah dan festival budaya.', '/images/ekstrakurikuler/tari.svg', 'Seni', 'Guru Seni Budaya', 'Kamis, 14.00 - 16.00 WIB', 'Studio Tari', 1
  UNION ALL SELECT 'Paduan Suara', 'Paduan suara melatih teknik vokal, harmonisasi, dan kepercayaan diri untuk tampil pada upacara serta kompetisi.', '/images/ekstrakurikuler/paduan-suara.svg', 'Seni', 'Guru Musik', 'Rabu, 14.00 - 15.30 WIB', 'Ruang Musik', 0
  UNION ALL SELECT 'Jurnalistik', 'Ekstrakurikuler jurnalistik mengasah kemampuan menulis, fotografi, dan produksi konten untuk media sekolah.', '/images/ekstrakurikuler/jurnalistik.svg', 'Akademik', 'Tim Humas Sekolah', 'Jumat, 13.00 - 15.00 WIB', 'Laboratorium Komputer', 0
) AS seed
WHERE @ekstrakurikuler_kosong = 1;

-- Rollback aman: kembalikan aplikasi versi sebelumnya; tabel additive ini diabaikan.
-- Jangan DROP TABLE setelah admin mengisi data.
