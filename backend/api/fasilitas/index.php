<?php
/**
 * GET    /api/fasilitas/index.php     -> semua fasilitas
 * GET    /api/fasilitas/index.php?id=1 -> detail
 * POST   /api/fasilitas/index.php     -> tambah (admin)
 * PUT    /api/fasilitas/index.php?id=1 -> update (admin)
 * DELETE /api/fasilitas/index.php?id=1 -> hapus (admin)
 */

require_once __DIR__ . '/../../bootstrap.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($db);
        break;
    case 'POST':
        requireAuth();
        handleCreate($db);
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

function handleGet(PDO $db): void
{
    if (isset($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM fasilitas WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Fasilitas tidak ditemukan', 404);
        jsonResponse(formatRow($row));
        return;
    }

    $stmt = $db->query('SELECT * FROM fasilitas ORDER BY id ASC');
    jsonResponse(array_map('formatRow', $stmt->fetchAll()));
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    validate($body);

    $stmt = $db->prepare('INSERT INTO fasilitas (judul, deskripsi, gambar) VALUES (?, ?, ?)');
    $stmt->execute([$body['judul'], $body['deskripsi'] ?? '', $body['gambar'] ?? null]);

    jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Fasilitas berhasil ditambahkan'], 201);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    validate($body);

    $stmt = $db->prepare('UPDATE fasilitas SET judul=?, deskripsi=?, gambar=? WHERE id=?');
    $stmt->execute([$body['judul'], $body['deskripsi'] ?? '', $body['gambar'] ?? null, $id]);

    if ($stmt->rowCount() === 0) jsonError('Data tidak ditemukan atau tidak ada perubahan', 404);
    jsonResponse(['message' => 'Fasilitas berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $stmt = $db->prepare('DELETE FROM fasilitas WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Fasilitas tidak ditemukan', 404);
    jsonResponse(['message' => 'Fasilitas berhasil dihapus']);
}

function validate(array $body): void
{
    if (empty($body['judul'])) jsonError("Field 'judul' wajib diisi", 400);
}

function formatRow(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'judul' => $row['judul'],
        'deskripsi' => $row['deskripsi'],
        'gambar' => $row['gambar'],
    ];
}
