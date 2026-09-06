// routes/galeri.routes.js — CRUD Galeri Foto (dengan keterangan/caption)
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { db, UPLOAD_DIR } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// --- Konfigurasi upload foto ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.'));
    }
    cb(null, true);
  },
});

// GET /api/galeri?kategori=ekskul  (publik)
router.get('/', (req, res) => {
  const { kategori, semua } = req.query;
  let rows;
  if (kategori && kategori !== 'semua') {
    rows = db
      .prepare('SELECT * FROM galeri WHERE kategori = ? AND published = 1 ORDER BY urutan, tanggal DESC')
      .all(kategori);
  } else if (semua === '1') {
    // admin: tampilkan juga yang belum published
    rows = db.prepare('SELECT * FROM galeri ORDER BY urutan, tanggal DESC').all();
  } else {
    rows = db.prepare('SELECT * FROM galeri WHERE published = 1 ORDER BY urutan, tanggal DESC').all();
  }
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM galeri WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Foto tidak ditemukan.' });
  res.json(row);
});

// POST /api/galeri  (admin) — multipart/form-data, field file: "foto"
router.post('/', requireAuth, upload.single('foto'), (req, res) => {
  const { judul, keterangan, kategori, tanggal, urutan, published, foto_url } = req.body || {};
  if (!judul) return res.status(400).json({ error: 'Judul foto wajib diisi.' });

  const fotoFile = req.file ? req.file.filename : (foto_url || null);

  const info = db
    .prepare(
      `INSERT INTO galeri (judul, keterangan, kategori, foto, tanggal, urutan, published)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      judul,
      keterangan || null,
      kategori || 'kegiatan',
      fotoFile,
      tanggal || new Date().toISOString().slice(0, 10),
      urutan || 0,
      published === '0' || published === 0 ? 0 : 1
    );
  const created = db.prepare('SELECT * FROM galeri WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/galeri/:id  (admin) — boleh kirim foto baru atau tidak
router.put('/:id', requireAuth, upload.single('foto'), (req, res) => {
  const existing = db.prepare('SELECT * FROM galeri WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Foto tidak ditemukan.' });

  const body = req.body || {};
  let fotoFile = existing.foto;
  if (req.file) {
    fotoFile = req.file.filename;
    // hapus file lama jika itu file lokal (bukan URL eksternal)
    if (existing.foto && !existing.foto.startsWith('http')) {
      const oldPath = path.join(UPLOAD_DIR, existing.foto);
      fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
    }
  } else if (body.foto_url) {
    fotoFile = body.foto_url;
  }

  const merged = { ...existing, ...body, foto: fotoFile };
  db.prepare(
    `UPDATE galeri SET judul=?, keterangan=?, kategori=?, foto=?, tanggal=?, urutan=?, published=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(
    merged.judul,
    merged.keterangan || null,
    merged.kategori || 'kegiatan',
    merged.foto,
    merged.tanggal,
    merged.urutan || 0,
    merged.published === '0' || merged.published === 0 ? 0 : 1,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM galeri WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/galeri/:id  (admin)
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM galeri WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Foto tidak ditemukan.' });

  if (existing.foto && !existing.foto.startsWith('http')) {
    const p = path.join(UPLOAD_DIR, existing.foto);
    fs.existsSync(p) && fs.unlink(p, () => {});
  }
  db.prepare('DELETE FROM galeri WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
