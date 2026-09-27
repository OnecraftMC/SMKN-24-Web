<?php
/**
 * GET /api/auth/me.php -> data admin yang sedang login (butuh Bearer token).
 * Nama diambil dari database agar selalu segar (perbaikan B1).
 */

require_once __DIR__ . '/../../bootstrap.php';

requireMethod('GET');

$payload = requireAuth();

$db = getDB();
$stmt = $db->prepare('SELECT id, username, nama, role FROM admin_users WHERE id = ? LIMIT 1');
$stmt->execute([(int)$payload['sub']]);
$user = $stmt->fetch();

if (!$user) {
    jsonError('Akun admin tidak ditemukan.', 401);
}

jsonResponse([
    'id' => (int)$user['id'],
    'username' => $user['username'],
    'nama' => $user['nama'],
    'role' => $user['role'],
]);

