<?php
/**
 * GET    /api/galeri/index.php               -> semua galeri
 * GET    /api/galeri/index.php?kategori=...   -> filter kategori
 * GET    /api/galeri/index.php?id=1           -> detail
 * POST   /api/galeri/index.php                -> tambah (admin)
 * PUT    /api/galeri/index.php?id=1           -> update (admin)
 * DELETE /api/galeri/index.php?id=1           -> hapus (admin)
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
        $stmt = $db->prepare('SELECT * FROM galeri WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Galeri tidak ditemukan', 404);
        jsonResponse(formatRow($row));
        return;
    }

    $where = '1=1';
    $params = [];
    if (!empty($_GET['kategori'])) {
        $where .= ' AND kategori = ?';
        $params[] = $_GET['kategori'];
    }

    $stmt = $db->prepare("SELECT * FROM galeri WHERE $where ORDER BY id DESC");
    $stmt->execute($params);
    jsonResponse(array_map('formatRow', $stmt->fetchAll()));
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    validate($body);

    $stmt = $db->prepare('INSERT INTO galeri (judul, kategori, gambar) VALUES (?, ?, ?)');
    $stmt->execute([$body['judul'], $body['kategori'], $body['gambar']]);

    jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Galeri berhasil ditambahkan'], 201);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    validate($body);

    $stmt = $db->prepare('UPDATE galeri SET judul=?, kategori=?, gambar=? WHERE id=?');
    $stmt->execute([$body['judul'], $body['kategori'], $body['gambar'], $id]);

    if ($stmt->rowCount() === 0) jsonError('Data tidak ditemukan atau tidak ada perubahan', 404);
    jsonResponse(['message' => 'Galeri berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $stmt = $db->prepare('DELETE FROM galeri WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Galeri tidak ditemukan', 404);
    jsonResponse(['message' => 'Galeri berhasil dihapus']);
}

function validate(array $body): void
{
    foreach (['judul', 'kategori', 'gambar'] as $f) {
        if (empty($body[$f])) jsonError("Field '$f' wajib diisi", 400);
    }
}

function formatRow(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'judul' => $row['judul'],
        'kategori' => $row['kategori'],
        'gambar' => $row['gambar'],
    ];
}
