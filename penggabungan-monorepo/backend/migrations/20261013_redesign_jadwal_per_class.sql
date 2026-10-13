-- Jadwal mingguan per kelas, hari, dan rentang jam pelajaran.
-- Jalankan setelah memilih database sekolah di phpMyAdmin. Migration aman
-- dijalankan ulang; data jadwal lama tetap berada di tabel `jadwal`.

CREATE TABLE IF NOT EXISTS jadwal_kelas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(80) NOT NULL UNIQUE,
  jurusan ENUM('perhotelan','boga','busana','pplg','pariwisata') NOT NULL,
  tingkat TINYINT UNSIGNED NOT NULL,
  rombel TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_jadwal_kelas (jurusan, tingkat, rombel),
  CHECK (tingkat BETWEEN 10 AND 12),
  CHECK (rombel > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kelas_id INT NOT NULL,
  hari ENUM('senin','selasa','rabu','kamis','jumat','sabtu') NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  mapel VARCHAR(255) NOT NULL,
  guru VARCHAR(150) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_jadwal_harian (kelas_id, hari, jam_mulai, jam_selesai),
  CONSTRAINT fk_jadwal_pelajaran_kelas
    FOREIGN KEY (kelas_id) REFERENCES jadwal_kelas(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (jam_selesai > jam_mulai)
) ENGINE=InnoDB;

INSERT INTO jadwal_kelas (nama, jurusan, tingkat, rombel) VALUES
  ('XRPL1','pplg',10,1), ('XRPL2','pplg',10,2),
  ('XIRPL1','pplg',11,1), ('XIRPL2','pplg',11,2),
  ('XIIRPL1','pplg',12,1), ('XIIRPL2','pplg',12,2),
  ('XULW','pariwisata',10,1), ('XIULW','pariwisata',11,1), ('XIIULW','pariwisata',12,1),
  ('XBusana1','busana',10,1), ('XBusana2','busana',10,2), ('XBusana3','busana',10,3),
  ('XIBusana1','busana',11,1), ('XIBusana2','busana',11,2), ('XIBusana3','busana',11,3),
  ('XIIBusana1','busana',12,1), ('XIIBusana2','busana',12,2), ('XIIBusana3','busana',12,3),
  ('XKuliner1','boga',10,1), ('XKuliner2','boga',10,2), ('XKuliner3','boga',10,3),
  ('XIKuliner1','boga',11,1), ('XIKuliner2','boga',11,2), ('XIKuliner3','boga',11,3),
  ('XIIKuliner1','boga',12,1), ('XIIKuliner2','boga',12,2), ('XIIKuliner3','boga',12,3),
  ('XPH1','perhotelan',10,1), ('XPH2','perhotelan',10,2), ('XPH3','perhotelan',10,3),
  ('XIPH1','perhotelan',11,1), ('XIPH2','perhotelan',11,2), ('XIPH3','perhotelan',11,3),
  ('XIIPH1','perhotelan',12,1), ('XIIPH2','perhotelan',12,2), ('XIIPH3','perhotelan',12,3)
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
