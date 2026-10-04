<?php
/**
 * GET    /api/guru/index.php               -> semua guru
 * GET    /api/guru/index.php?kategori=BK    -> filter kategori
 * GET    /api/guru/index.php?id=1           -> detail
 * POST   /api/guru/index.php                -> tambah (admin)
 * PUT    /api/guru/index.php?id=1           -> update (admin)
 * DELETE /api/guru/index.php?id=1           -> hapus (admin)
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
        $stmt = $db->prepare('SELECT * FROM guru WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Data guru tidak ditemukan', 404);
        jsonResponse(formatRow($row));
        return;
    }

    $where = '1=1';
    $params = [];
    if (!empty($_GET['kategori'])) {
        $where .= ' AND kategori = ?';
        $params[] = $_GET['kategori'];
    }

    $stmt = $db->prepare("SELECT * FROM guru WHERE $where ORDER BY urutan ASC, id ASC");
    $stmt->execute($params);
    jsonResponse(array_map('formatRow', $stmt->fetchAll()));
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    validate($body, $db);
    $body['kategori'] = validateCategorySelection($db, 'guru', $body['kategori']);

    $stmt = $db->prepare(
        'INSERT INTO guru (nama, jabatan, deskripsi, kategori, gambar, urutan) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $body['nama'], $body['jabatan'], $body['deskripsi'] ?? '',
        $body['kategori'], $body['gambar'] ?? null, $body['urutan'] ?? 0,
    ]);

    jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Data guru berhasil ditambahkan'], 201);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    validate($body, $db);
    $body['kategori'] = validateCategorySelection($db, 'guru', $body['kategori']);

    // Eksistensi dicek dulu: rowCount() bisa 0 saat update tanpa perubahan,
    // yang sebelumnya salah dilaporkan sebagai 404 "tidak ditemukan".
    $exists = $db->prepare('SELECT id FROM guru WHERE id = ?');
    $exists->execute([$id]);
    if (!$exists->fetch()) jsonError('Data guru tidak ditemukan', 404);

    $stmt = $db->prepare(
        'UPDATE guru SET nama=?, jabatan=?, deskripsi=?, kategori=?, gambar=?, urutan=? WHERE id=?'
    );
    $stmt->execute([
        $body['nama'], $body['jabatan'], $body['deskripsi'] ?? '',
        $body['kategori'], $body['gambar'] ?? null, $body['urutan'] ?? 0,
        $id,
    ]);

    jsonResponse(['message' => 'Data guru berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $stmt = $db->prepare('DELETE FROM guru WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Data guru tidak ditemukan', 404);
    jsonResponse(['message' => 'Data guru berhasil dihapus']);
}

function validate(array $body, PDO $db): void
{
    foreach (['nama', 'jabatan', 'kategori'] as $f) {
        if (empty($body[$f])) jsonError("Field '$f' wajib diisi", 400);
    }
    validateCategorySelection($db, 'guru', $body['kategori']);

    // urutan guru bebas >= 0, tetapi harus bilangan bulat valid.
    if (isset($body['urutan']) && $body['urutan'] !== '' && $body['urutan'] !== null) {
        if (!is_numeric($body['urutan'])
            || (int)$body['urutan'] != $body['urutan']
            || (int)$body['urutan'] < 0) {
            jsonError("Field 'urutan' harus bilangan bulat 0 atau lebih", 400);
        }
    }
}

function formatRow(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'nama' => $row['nama'],
        'jabatan' => $row['jabatan'],
        'deskripsi' => $row['deskripsi'],
        'kategori' => $row['kategori'],
        'gambar' => $row['gambar'],
        // B4: ikut dikirim agar admin bisa mengurutkan; sebelumnya hanya
        // diterima POST/PUT tapi tidak pernah dikembalikan oleh GET.
        'urutan' => (int)$row['urutan'],
    ];
}
