// routes/jadwal.routes.js — CRUD Jadwal Pelajaran
const express = require('express');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/jadwal?jurusan=rpl  (publik — dipakai website utama)
router.get('/', (req, res) => {
  const { jurusan } = req.query;
  let rows;
  if (jurusan) {
    rows = db
      .prepare('SELECT * FROM jadwal_pelajaran WHERE jurusan = ? ORDER BY hari, urutan, jam_mulai')
      .all(jurusan);
  } else {
    rows = db.prepare('SELECT * FROM jadwal_pelajaran ORDER BY jurusan, hari, urutan, jam_mulai').all();
  }
  res.json(rows);
});

// GET /api/jadwal/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM jadwal_pelajaran WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
  res.json(row);
});

// POST /api/jadwal  (admin)
router.post('/', requireAuth, (req, res) => {
  const { jurusan, hari, sesi, jam_mulai, jam_selesai, mapel, ruang, keterangan, urutan } = req.body || {};
  if (!jurusan || !hari || !sesi || !jam_mulai || !jam_selesai || !mapel) {
    return res.status(400).json({ error: 'jurusan, hari, sesi, jam_mulai, jam_selesai, dan mapel wajib diisi.' });
  }
  const info = db
    .prepare(
      `INSERT INTO jadwal_pelajaran (jurusan, hari, sesi, jam_mulai, jam_selesai, mapel, ruang, keterangan, urutan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(jurusan, hari, sesi, jam_mulai, jam_selesai, mapel, ruang || null, keterangan || null, urutan || 0);
  const created = db.prepare('SELECT * FROM jadwal_pelajaran WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/jadwal/:id  (admin)
router.put('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM jadwal_pelajaran WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });

  const merged = { ...existing, ...req.body };
  db.prepare(
    `UPDATE jadwal_pelajaran SET jurusan=?, hari=?, sesi=?, jam_mulai=?, jam_selesai=?, mapel=?, ruang=?, keterangan=?, urutan=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(
    merged.jurusan,
    merged.hari,
    merged.sesi,
    merged.jam_mulai,
    merged.jam_selesai,
    merged.mapel,
    merged.ruang || null,
    merged.keterangan || null,
    merged.urutan || 0,
    req.params.id
  );
  const updated = db.prepare('SELECT * FROM jadwal_pelajaran WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/jadwal/:id  (admin)
router.delete('/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM jadwal_pelajaran WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
  res.json({ ok: true });
});

module.exports = router;
