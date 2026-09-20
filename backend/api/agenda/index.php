<?php
/**
 * GET    /api/agenda/index.php               -> semua agenda
 * GET    /api/agenda/index.php?beranda=1      -> hanya yang tampil di beranda
 * GET    /api/agenda/index.php?id=1           -> detail
 * POST   /api/agenda/index.php                -> tambah (admin)
 * PUT    /api/agenda/index.php?id=1           -> update (admin)
 * DELETE /api/agenda/index.php?id=1           -> hapus (admin)
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
        $stmt = $db->prepare('SELECT * FROM agenda WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Agenda tidak ditemukan', 404);
        jsonResponse(formatRow($row));
        return;
    }

    $where = '1=1';
    if (isset($_GET['beranda'])) {
        $where .= ' AND tampil_beranda = 1';
    }

    $stmt = $db->prepare("SELECT * FROM agenda WHERE $where ORDER BY tgl_mulai ASC, id ASC");
    $stmt->execute();
    jsonResponse(array_map('formatRow', $stmt->fetchAll()));
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    validate($body);

    $stmt = $db->prepare(
        'INSERT INTO agenda (judul, tgl_mulai, tgl_selesai, waktu, lokasi, badge, deskripsi, gambar, tampil_beranda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $body['judul'], $body['tglMulai'], $body['tglSelesai'] ?? null,
        $body['waktu'] ?? null, $body['lokasi'] ?? null,
        $body['badge'] ?? null, $body['deskripsi'] ?? null, $body['gambar'] ?? null,
        !empty($body['tampilBeranda']) ? 1 : 0,
    ]);

    jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Agenda berhasil ditambahkan'], 201);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    validate($body);

    $stmt = $db->prepare(
        'UPDATE agenda SET judul=?, tgl_mulai=?, tgl_selesai=?, waktu=?, lokasi=?, badge=?, deskripsi=?, gambar=?, tampil_beranda=?
         WHERE id=?'
    );
    $stmt->execute([
        $body['judul'], $body['tglMulai'], $body['tglSelesai'] ?? null,
        $body['waktu'] ?? null, $body['lokasi'] ?? null,
        $body['badge'] ?? null, $body['deskripsi'] ?? null, $body['gambar'] ?? null,
        !empty($body['tampilBeranda']) ? 1 : 0,
        $id,
    ]);

    if ($stmt->rowCount() === 0) jsonError('Data tidak ditemukan atau tidak ada perubahan', 404);
    jsonResponse(['message' => 'Agenda berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $stmt = $db->prepare('DELETE FROM agenda WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Agenda tidak ditemukan', 404);
    jsonResponse(['message' => 'Agenda berhasil dihapus']);
}

function validate(array $body): void
{
    foreach (['judul', 'tglMulai'] as $f) {
        if (empty($body[$f])) jsonError("Field '$f' wajib diisi", 400);
    }
}

function formatRow(array $row): array
{
    $tanggal = date('d F Y', strtotime($row['tgl_mulai']));
    if (!empty($row['tgl_selesai']) && $row['tgl_selesai'] !== $row['tgl_mulai']) {
        $tanggal = date('d', strtotime($row['tgl_mulai'])) . ' - ' . date('d F Y', strtotime($row['tgl_selesai']));
    }

    return [
        'id' => (int)$row['id'],
        'judul' => $row['judul'],
        'tanggal' => $tanggal,
        'tglMulai' => $row['tgl_mulai'],
        'tglSelesai' => $row['tgl_selesai'],
        'waktu' => $row['waktu'],
        'lokasi' => $row['lokasi'],
        'badge' => $row['badge'],
        'deskripsi' => $row['deskripsi'],
        'gambar' => $row['gambar'],
        'day' => (int)date('d', strtotime($row['tgl_mulai'])),
        'month' => strtoupper(date('M', strtotime($row['tgl_mulai']))),
    ];
}
