// server.js — Entry point backend Admin Panel SMKN 24 Jakarta
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const { UPLOAD_DIR } = require('./db'); // memastikan db.js dijalankan (init + seed)

const authRoutes = require('./routes/auth.routes');
const jadwalRoutes = require('./routes/jadwal.routes');
const galeriRoutes = require('./routes/galeri.routes');
const beritaRoutes = require('./routes/berita.routes');
const kontenRoutes = require('./routes/konten.routes');
const guruRoutes = require('./routes/guru.routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Folder publik untuk file foto yang diupload
app.use('/uploads', express.static(UPLOAD_DIR));

// Serve admin panel (folder ./admin) sebagai static, biar bisa dibuka
// langsung lewat http://localhost:4000/admin tanpa server terpisah.
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/galeri', galeriRoutes);
app.use('/api/berita', beritaRoutes);
app.use('/api/konten', kontenRoutes);
app.use('/api/guru', guruRoutes);

app.get('/api', (req, res) => {
  res.json({
    nama: 'SMKN 24 Jakarta — API Admin Panel',
    status: 'ok',
    endpoints: [
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'POST /api/auth/change-password',
      'GET/POST/PUT/DELETE /api/jadwal',
      'GET/POST/PUT/DELETE /api/galeri  (multipart, field foto)',
      'GET/POST/PUT/DELETE /api/berita  (multipart, field foto)',
      'GET/POST/PUT/DELETE /api/konten/:key',
      'GET/POST/PUT/DELETE /api/guru    (multipart, field foto)',
    ],
  });
});

// Handler error umum (termasuk error dari multer, mis. file terlalu besar)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Terjadi kesalahan pada server.' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

app.listen(PORT, () => {
  console.log(`\nSMKN 24 Jakarta — Backend & Admin Panel`);
  console.log(`API      : http://localhost:${PORT}/api`);
  console.log(`Admin    : http://localhost:${PORT}/admin`);
  console.log(`Uploads  : http://localhost:${PORT}/uploads/<nama-file>\n`);
});
