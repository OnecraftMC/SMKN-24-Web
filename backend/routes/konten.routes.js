// routes/konten.routes.js — CRUD Konten Teks (CMS sederhana berbasis key-value)
const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/konten  (publik) — semua teks, dikelompokkan oleh frontend jika perlu
router.get('/', (req, res) => {
  const { grup } = req.query;
  const rows = grup
    ? db.prepare('SELECT * FROM konten_teks WHERE grup = ? ORDER BY label').all(grup)
    : db.prepare('SELECT * FROM konten_teks ORDER BY grup, label').all();
  res.json(rows);
});

// GET /api/konten/:key  (publik) — ambil satu teks by section_key
router.get('/:key', (req, res) => {
  const row = db.prepare('SELECT * FROM konten_teks WHERE section_key = ?').get(req.params.key);
  if (!row) return res.status(404).json({ error: 'Konten tidak ditemukan.' });
  res.json(row);
});

// POST /api/konten  (admin) — membuat field teks baru (untuk kebutuhan "lain-lain")
router.post('/', requireAuth, (req, res) => {
  const { section_key, label, grup, tipe, isi, keterangan } = req.body || {};
  if (!section_key || !label) {
    return res.status(400).json({ error: 'section_key dan label wajib diisi.' });
  }
  try {
    const info = db
      .prepare(
        `INSERT INTO konten_teks (section_key, label, grup, tipe, isi, keterangan) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(section_key, label, grup || 'umum', tipe || 'text', isi || '', keterangan || null);
    const created = db.prepare('SELECT * FROM konten_teks WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: 'section_key sudah dipakai, gunakan key lain.' });
  }
});

// PUT /api/konten/:key  (admin) — update isi teks
router.put('/:key', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM konten_teks WHERE section_key = ?').get(req.params.key);
  if (!existing) return res.status(404).json({ error: 'Konten tidak ditemukan.' });

  const { label, grup, tipe, isi, keterangan } = req.body || {};
  const merged = {
    label: label ?? existing.label,
    grup: grup ?? existing.grup,
    tipe: tipe ?? existing.tipe,
    isi: isi ?? existing.isi,
    keterangan: keterangan ?? existing.keterangan,
  };
  db.prepare(
    `UPDATE konten_teks SET label=?, grup=?, tipe=?, isi=?, keterangan=?, updated_at=datetime('now') WHERE section_key=?`
  ).run(merged.label, merged.grup, merged.tipe, merged.isi, merged.keterangan, req.params.key);

  const updated = db.prepare('SELECT * FROM konten_teks WHERE section_key = ?').get(req.params.key);
  res.json(updated);
});

// DELETE /api/konten/:key  (admin)
router.delete('/:key', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM konten_teks WHERE section_key = ?').run(req.params.key);
  if (info.changes === 0) return res.status(404).json({ error: 'Konten tidak ditemukan.' });
  res.json({ ok: true });
});

module.exports = router;
