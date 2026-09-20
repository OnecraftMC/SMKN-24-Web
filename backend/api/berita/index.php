<?php
/**
 * GET    /api/berita/index.php           -> daftar semua berita (publik)
 * GET    /api/berita/index.php?id=1      -> detail satu berita
 * GET    /api/berita/index.php?utama=1   -> hanya berita utama (headline)
 * POST   /api/berita/index.php           -> tambah berita (butuh login admin)
 * PUT    /api/berita/index.php?id=1      -> update berita (butuh login admin)
 * DELETE /api/berita/index.php?id=1      -> hapus berita (butuh login admin)
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
        $stmt = $db->prepare('SELECT * FROM berita WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) {
            jsonError('Berita tidak ditemukan', 404);
        }
        jsonResponse(formatRow($row));
        return;
    }

    $where = "WHERE status = 'terbit'";
    $params = [];

    if (isset($_GET['utama'])) {
        $where .= ' AND utama = 1';
    }
    if (!empty($_GET['kategori'])) {
        $where .= ' AND kategori = ?';
        $params[] = $_GET['kategori'];
    }

    // Jika request datang dengan token admin valid, tampilkan semua (termasuk draft)
    $token = getBearerToken();
    if ($token && verifyJwt($token)) {
        $where = '1=1';
        $params = [];
        if (!empty($_GET['kategori'])) {
            $where .= ' AND kategori = ?';
            $params[] = $_GET['kategori'];
        }
    }

    $stmt = $db->prepare("SELECT * FROM berita $where ORDER BY tanggal DESC, id DESC");
    $stmt->execute($params);
    $rows = array_map('formatRow', $stmt->fetchAll());

    jsonResponse($rows);
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    validateBerita($body);

    $gambar = $body['gambar'] ?? null;

    $stmt = $db->prepare(
        'INSERT INTO berita (judul, kategori, tanggal, gambar, ringkasan, isi, status, utama)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $body['judul'],
        $body['kategori'],
        $body['tanggal'],
        $gambar,
        $body['ringkasan'] ?? '',
        $body['isi'] ?? null,
        $body['status'] ?? 'terbit',
        !empty($body['utama']) ? 1 : 0,
    ]);

    jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Berita berhasil ditambahkan'], 201);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        jsonError('Parameter id wajib diisi', 400);
    }

    $body = getJsonBody();
    validateBerita($body);

    $stmt = $db->prepare(
        'UPDATE berita SET judul = ?, kategori = ?, tanggal = ?, gambar = ?, ringkasan = ?, isi = ?, status = ?, utama = ?
         WHERE id = ?'
    );
    $stmt->execute([
        $body['judul'],
        $body['kategori'],
        $body['tanggal'],
        $body['gambar'] ?? null,
        $body['ringkasan'] ?? '',
        $body['isi'] ?? null,
        $body['status'] ?? 'terbit',
        !empty($body['utama']) ? 1 : 0,
        $id,
    ]);

    if ($stmt->rowCount() === 0) {
        jsonError('Berita tidak ditemukan atau tidak ada perubahan', 404);
    }

    jsonResponse(['message' => 'Berita berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) {
        jsonError('Parameter id wajib diisi', 400);
    }

    $stmt = $db->prepare('DELETE FROM berita WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        jsonError('Berita tidak ditemukan', 404);
    }

    jsonResponse(['message' => 'Berita berhasil dihapus']);
}

function validateBerita(array $body): void
{
    $required = ['judul', 'kategori', 'tanggal'];
    foreach ($required as $field) {
        if (empty($body[$field])) {
            jsonError("Field '$field' wajib diisi", 400);
        }
    }
}

function formatRow(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'judul' => $row['judul'],
        'kategori' => $row['kategori'],
        'tanggal' => date('d F Y', strtotime($row['tanggal'])),
        'gambar' => $row['gambar'],
        'ringkasan' => $row['ringkasan'],
        'isi' => $row['isi'] ?? null,
        'status' => $row['status'] ?? null,
        'utama' => (bool)($row['utama'] ?? 0),
    ];
}
