// routes/berita.routes.js — CRUD Berita / Kabar Sekolah
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { db, UPLOAD_DIR } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/berita  (publik)
router.get('/', (req, res) => {
  const { semua } = req.query;
  const rows =
    semua === '1'
      ? db.prepare('SELECT * FROM berita ORDER BY is_headline DESC, tanggal DESC').all()
      : db.prepare('SELECT * FROM berita WHERE published = 1 ORDER BY is_headline DESC, tanggal DESC').all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM berita WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Berita tidak ditemukan.' });
  // hitung view publik sederhana
  db.prepare('UPDATE berita SET views = views + 1 WHERE id = ?').run(req.params.id);
  res.json(row);
});

router.post('/', requireAuth, upload.single('foto'), (req, res) => {
  const { judul, ringkasan, isi, tanggal, is_headline, published, foto_url } = req.body || {};
  if (!judul) return res.status(400).json({ error: 'Judul berita wajib diisi.' });

  const fotoFile = req.file ? req.file.filename : (foto_url || null);

  if (is_headline === '1' || is_headline === 1 || is_headline === true) {
    db.prepare('UPDATE berita SET is_headline = 0').run(); // hanya satu headline aktif
  }

  const info = db
    .prepare(
      `INSERT INTO berita (judul, ringkasan, isi, foto, tanggal, is_headline, published)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      judul,
      ringkasan || null,
      isi || null,
      fotoFile,
      tanggal || new Date().toISOString().slice(0, 10),
      is_headline === '1' || is_headline === 1 || is_headline === true ? 1 : 0,
      published === '0' || published === 0 ? 0 : 1
    );
  const created = db.prepare('SELECT * FROM berita WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', requireAuth, upload.single('foto'), (req, res) => {
  const existing = db.prepare('SELECT * FROM berita WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Berita tidak ditemukan.' });

  const body = req.body || {};
  let fotoFile = existing.foto;
  if (req.file) {
    fotoFile = req.file.filename;
    if (existing.foto && !existing.foto.startsWith('http')) {
      const oldPath = path.join(UPLOAD_DIR, existing.foto);
      fs.existsSync(oldPath) && fs.unlink(oldPath, () => {});
    }
  } else if (body.foto_url) {
    fotoFile = body.foto_url;
  }

  const jadiHeadline = body.is_headline === '1' || body.is_headline === 1 || body.is_headline === true;
  if (jadiHeadline) db.prepare('UPDATE berita SET is_headline = 0').run();

  const merged = { ...existing, ...body, foto: fotoFile };
  db.prepare(
    `UPDATE berita SET judul=?, ringkasan=?, isi=?, foto=?, tanggal=?, is_headline=?, published=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(
    merged.judul,
    merged.ringkasan || null,
    merged.isi || null,
    merged.foto,
    merged.tanggal,
    jadiHeadline ? 1 : (existing.is_headline && body.is_headline === undefined ? 1 : 0),
    merged.published === '0' || merged.published === 0 ? 0 : 1,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM berita WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM berita WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Berita tidak ditemukan.' });
  if (existing.foto && !existing.foto.startsWith('http')) {
    const p = path.join(UPLOAD_DIR, existing.foto);
    fs.existsSync(p) && fs.unlink(p, () => {});
  }
  db.prepare('DELETE FROM berita WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
