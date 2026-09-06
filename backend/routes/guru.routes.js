// routes/guru.routes.js — CRUD Data Guru (bagian "lain-lain")
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

router.get('/', (req, res) => {
  const { semua } = req.query;
  const rows =
    semua === '1'
      ? db.prepare('SELECT * FROM guru ORDER BY urutan, nama').all()
      : db.prepare('SELECT * FROM guru WHERE published = 1 ORDER BY urutan, nama').all();
  res.json(rows);
});

router.post('/', requireAuth, upload.single('foto'), (req, res) => {
  const { nama, jabatan, mapel, keterangan, urutan, published, foto_url } = req.body || {};
  if (!nama) return res.status(400).json({ error: 'Nama guru wajib diisi.' });
  const fotoFile = req.file ? req.file.filename : (foto_url || null);
  const info = db
    .prepare(
      `INSERT INTO guru (nama, jabatan, mapel, foto, keterangan, urutan, published) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(nama, jabatan || null, mapel || null, fotoFile, keterangan || null, urutan || 0, published === '0' ? 0 : 1);
  const created = db.prepare('SELECT * FROM guru WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', requireAuth, upload.single('foto'), (req, res) => {
  const existing = db.prepare('SELECT * FROM guru WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Guru tidak ditemukan.' });

  const body = req.body || {};
  let fotoFile = existing.foto;
  if (req.file) {
    fotoFile = req.file.filename;
    if (existing.foto && !existing.foto.startsWith('http')) {
      const p = path.join(UPLOAD_DIR, existing.foto);
      fs.existsSync(p) && fs.unlink(p, () => {});
    }
  } else if (body.foto_url) {
    fotoFile = body.foto_url;
  }

  const merged = { ...existing, ...body, foto: fotoFile };
  db.prepare(
    `UPDATE guru SET nama=?, jabatan=?, mapel=?, foto=?, keterangan=?, urutan=?, published=?, updated_at=datetime('now') WHERE id=?`
  ).run(
    merged.nama,
    merged.jabatan || null,
    merged.mapel || null,
    merged.foto,
    merged.keterangan || null,
    merged.urutan || 0,
    merged.published === '0' || merged.published === 0 ? 0 : 1,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM guru WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM guru WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Guru tidak ditemukan.' });
  if (existing.foto && !existing.foto.startsWith('http')) {
    const p = path.join(UPLOAD_DIR, existing.foto);
    fs.existsSync(p) && fs.unlink(p, () => {});
  }
  db.prepare('DELETE FROM guru WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
