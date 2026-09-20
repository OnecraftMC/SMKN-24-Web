<?php
/**
 * POST   /api/aspirasi/index.php        -> kirim aspirasi (publik, dari FormAspirasi.tsx)
 * GET    /api/aspirasi/index.php        -> daftar aspirasi (admin)
 * PUT    /api/aspirasi/index.php?id=1   -> update status (admin)
 * DELETE /api/aspirasi/index.php?id=1   -> hapus (admin)
 */

require_once __DIR__ . '/../../bootstrap.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleCreate($db);
        break;
    case 'GET':
        requireAuth();
        handleGet($db);
        break;
    case 'PUT':
        requireAuth();
        handleUpdate($db);
        break;
    case 'DELETE':
        requireAuth();
        handleDelete($db);
        break;
    default:
        jsonError('Method tidak diizinkan', 405);
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    if (empty($body['pesan'])) {
        jsonError("Field 'pesan' wajib diisi", 400);
    }

    $stmt = $db->prepare(
        'INSERT INTO aspirasi (nama, email, kategori, pesan) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([
        $body['nama'] ?? null, $body['email'] ?? null,
        $body['kategori'] ?? null, $body['pesan'],
    ]);

    jsonResponse(['message' => 'Aspirasi Anda berhasil dikirim. Terima kasih!'], 201);
}

function handleGet(PDO $db): void
{
    $stmt = $db->query('SELECT * FROM aspirasi ORDER BY created_at DESC');
    jsonResponse($stmt->fetchAll());
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    if (empty($body['status']) || !in_array($body['status'], ['Baru', 'Ditinjau', 'Selesai'], true)) {
        jsonError('Status tidak valid', 400);
    }

    $stmt = $db->prepare('UPDATE aspirasi SET status = ? WHERE id = ?');
    $stmt->execute([$body['status'], $id]);

    if ($stmt->rowCount() === 0) jsonError('Data tidak ditemukan atau tidak ada perubahan', 404);
    jsonResponse(['message' => 'Status berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $stmt = $db->prepare('DELETE FROM aspirasi WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Data tidak ditemukan', 404);
    jsonResponse(['message' => 'Aspirasi berhasil dihapus']);
}
