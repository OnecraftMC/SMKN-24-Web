// db.js — Setup database SQLite + seed data awal
// Menggunakan better-sqlite3 (sinkron, ringan, tidak butuh server DB terpisah)

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'smkn24.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// SKEMA TABEL
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jadwal_pelajaran (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jurusan TEXT NOT NULL,          -- perhotelan | boga | busana | rpl | pariwisata
  hari TEXT NOT NULL,             -- Senin | Selasa | Rabu | Kamis | Jumat
  sesi TEXT NOT NULL,             -- pagi | siang
  jam_mulai TEXT NOT NULL,        -- '07.45'
  jam_selesai TEXT NOT NULL,      -- '09.15'
  mapel TEXT NOT NULL,
  ruang TEXT,
  keterangan TEXT,                -- catatan tambahan (mis. guru pengampu, kelas)
  urutan INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS galeri (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  keterangan TEXT,                 -- caption/deskripsi foto
  kategori TEXT NOT NULL DEFAULT 'kegiatan', -- ekskul | praktik | pkl | jurusan
  foto TEXT,                       -- nama file di /uploads, atau URL eksternal
  tanggal TEXT NOT NULL DEFAULT (date('now')),
  urutan INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS berita (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  ringkasan TEXT,
  isi TEXT,
  foto TEXT,
  tanggal TEXT NOT NULL DEFAULT (date('now')),
  is_headline INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS konten_teks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key TEXT UNIQUE NOT NULL,  -- contoh: 'hero_headline'
  label TEXT NOT NULL,               -- nama yang tampil di admin panel
  grup TEXT NOT NULL DEFAULT 'umum', -- pengelompokan: beranda, profil, kontak, dll
  tipe TEXT NOT NULL DEFAULT 'text', -- text | textarea
  isi TEXT,
  keterangan TEXT,                   -- penjelasan field ini untuk admin (dipakai di mana)
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guru (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  jabatan TEXT,
  mapel TEXT,
  foto TEXT,
  keterangan TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// ---------------------------------------------------------------------------
// SEED: admin default (hanya jika tabel masih kosong)
// ---------------------------------------------------------------------------
const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admin_users').get().c;
if (adminCount === 0) {
  const defaultUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const hash = bcrypt.hashSync(defaultPassword, 10);
  db.prepare(
    'INSERT INTO admin_users (username, password_hash, nama) VALUES (?, ?, ?)'
  ).run(defaultUsername, hash, 'Administrator SMKN 24');
  console.log(`[seed] Admin default dibuat -> username: ${defaultUsername} / password: ${defaultPassword}`);
  console.log('[seed] PENTING: segera login dan ganti password ini.');
}

// ---------------------------------------------------------------------------
// SEED: konten teks (diambil dari isi website saat ini, supaya admin panel
// langsung terisi dan bisa langsung diedit)
// ---------------------------------------------------------------------------
const kontenCount = db.prepare('SELECT COUNT(*) AS c FROM konten_teks').get().c;
if (kontenCount === 0) {
  const items = [
    ['hero_headline', 'Judul Utama (Hero) Beranda', 'beranda', 'text',
      'Mencetak Talenta Unggul Siap Kerja & Berdaya Saing Global',
      'Judul besar yang tampil di bagian paling atas halaman Beranda.'],
    ['hero_subheadline', 'Sub-judul Hero Beranda', 'beranda', 'textarea',
      'SMK Negeri 24 Jakarta membuka Kompetensi Keahlian Perhotelan, Kuliner, Tata Busana, RPL, dan Usaha Layanan Pariwisata.',
      'Kalimat pendukung di bawah judul utama Beranda.'],
    ['sambutan_kepsek', 'Sambutan Kepala Sekolah', 'profil', 'textarea', '',
      'Teks sambutan yang tampil di halaman Profil Sekolah.'],
    ['nama_kepsek', 'Nama Kepala Sekolah', 'profil', 'text', 'Dra. Isfariani Marlena, M.Pd.',
      'Dipakai chatbot & halaman profil saat menjawab pertanyaan tentang kepala sekolah.'],
    ['visi', 'Visi Sekolah', 'profil', 'textarea', '', 'Tampil di halaman Profil Sekolah.'],
    ['misi', 'Misi Sekolah', 'profil', 'textarea', '', 'Tampil di halaman Profil Sekolah (boleh dipisah per baris).'],
    ['alamat', 'Alamat Sekolah', 'kontak', 'textarea', '', 'Tampil di footer & halaman kontak/lokasi.'],
    ['telepon', 'Nomor Telepon', 'kontak', 'text', '(021) 844-1976', 'Tampil di topbar & footer.'],
    ['email', 'Email Sekolah', 'kontak', 'text', 'smk24jakarta@gmail.com', 'Tampil di topbar & footer.'],
    ['jam_operasional', 'Jam Operasional', 'kontak', 'text', 'Senin - Jumat: 07.00 - 15.00 WIB', 'Tampil di topbar.'],
    ['status_akreditasi', 'Status Akreditasi', 'umum', 'text', 'Terakreditasi A (BAN-S/M)', 'Badge di topbar.'],
  ];
  const stmt = db.prepare(
    'INSERT INTO konten_teks (section_key, label, grup, tipe, isi, keterangan) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows) => rows.forEach((r) => stmt.run(...r)));
  insertMany(items);
}

module.exports = { db, UPLOAD_DIR };
