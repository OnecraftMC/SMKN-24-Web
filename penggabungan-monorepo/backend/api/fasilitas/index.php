<?php
/**
 * GET    /api/fasilitas/index.php     -> semua fasilitas
 * GET    /api/fasilitas/index.php?unggulan=1 -> fasilitas unggulan
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

    $where = isset($_GET['unggulan']) && $_GET['unggulan'] === '1'
        ? ' WHERE unggulan = 1'
        : '';
    $stmt = $db->query('SELECT * FROM fasilitas' . $where . ' ORDER BY id ASC');
    jsonResponse(array_map('formatRow', $stmt->fetchAll()));
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    validate($body);

    $stmt = $db->prepare('INSERT INTO fasilitas (judul, deskripsi, gambar, kategori, unggulan) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([
        $body['judul'],
        $body['deskripsi'] ?? '',
        $body['gambar'] ?? null,
        validateCategorySelection($db, 'fasilitas', $body['kategori'] ?? null),
        !empty($body['unggulan']) ? 1 : 0,
    ]);

    jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Fasilitas berhasil ditambahkan'], 201);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    validate($body);

    // Eksistensi dicek dulu; rowCount() 0 saat tidak ada perubahan bukan 404.
    $exists = $db->prepare('SELECT id, unggulan FROM fasilitas WHERE id = ?');
    $exists->execute([$id]);
    $existing = $exists->fetch();
    if (!$existing) jsonError('Fasilitas tidak ditemukan', 404);

    $unggulan = array_key_exists('unggulan', $body)
        ? (!empty($body['unggulan']) ? 1 : 0)
        : (int)$existing['unggulan'];
    $stmt = $db->prepare('UPDATE fasilitas SET judul=?, deskripsi=?, gambar=?, kategori=?, unggulan=? WHERE id=?');
    $stmt->execute([
        $body['judul'],
        $body['deskripsi'] ?? '',
        $body['gambar'] ?? null,
        validateCategorySelection($db, 'fasilitas', $body['kategori'] ?? null),
        $unggulan,
        $id,
    ]);

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
    if (
        array_key_exists('unggulan', $body) &&
        !is_bool($body['unggulan']) &&
        !in_array($body['unggulan'], [0, 1, '0', '1'], true)
    ) {
        jsonError("Field 'unggulan' harus berupa boolean", 400);
    }
}

function formatRow(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'judul' => $row['judul'],
        'deskripsi' => $row['deskripsi'],
        'gambar' => $row['gambar'],
        'kategori' => $row['kategori'] ?? null,
        // `?? 0` mengikuti pola berita.php: aman bila migrasi belum dijalankan
        // (kunci tidak ada) sehingga response tetap JSON valid.
        'unggulan' => (bool)($row['unggulan'] ?? 0),
    ];
}
