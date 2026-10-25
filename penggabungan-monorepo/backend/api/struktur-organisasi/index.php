<?php
/**
 * GET /api/struktur-organisasi/index.php?public=1 -> gambar publik
 * GET /api/struktur-organisasi/index.php            -> admin
 * PUT /api/struktur-organisasi/index.php            -> ganti gambar (admin)
 */
require_once __DIR__ . '/../../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $public = ($_GET['public'] ?? '') === '1';
    if (!$public) requireAuth();

    $stmt = getDB()->query('SELECT gambar FROM struktur_organisasi WHERE id = 1');
    $row = $stmt->fetch();
    jsonResponse(['gambar' => $row['gambar'] ?? '/images/struktur-organisasi.jpeg']);
}

if ($method === 'PUT') {
    requireAuth();
    $body = getJsonBody();
    $gambar = $body['gambar'] ?? null;
    if ($gambar !== null && (!is_string($gambar) || strlen($gambar) > 500)) {
        jsonError("Field 'gambar' tidak valid", 400);
    }
    if ($gambar !== null && trim($gambar) === '') $gambar = null;

    $stmt = getDB()->prepare(
        'INSERT INTO struktur_organisasi (id, gambar) VALUES (1, ?) '
        . 'ON DUPLICATE KEY UPDATE gambar = VALUES(gambar)'
    );
    $stmt->execute([$gambar]);
    jsonResponse(['gambar' => $gambar, 'message' => 'Struktur organisasi berhasil diperbarui']);
}

jsonError('Method tidak diizinkan', 405);
