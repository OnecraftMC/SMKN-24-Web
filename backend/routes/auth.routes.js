// routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '12h',
  });

  res.json({
    token,
    admin: { id: user.id, username: user.username, nama: user.nama },
  });
});

// GET /api/auth/me — cek token masih valid + ambil data admin
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, nama FROM admin_users WHERE id = ?').get(req.admin.id);
  res.json({ admin: user });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, (req, res) => {
  const { password_lama, password_baru } = req.body || {};
  if (!password_lama || !password_baru) {
    return res.status(400).json({ error: 'Password lama dan password baru wajib diisi.' });
  }
  if (password_baru.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  }

  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(password_lama, user.password_hash)) {
    return res.status(401).json({ error: 'Password lama salah.' });
  }

  const newHash = bcrypt.hashSync(password_baru, 10);
  db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
  res.json({ ok: true, message: 'Password berhasil diganti.' });
});

module.exports = router;
