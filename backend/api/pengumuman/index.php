<?php
/**
 * GET    /api/pengumuman/index.php               -> semua pengumuman
 * GET    /api/pengumuman/index.php?beranda=1      -> hanya yang tampil di beranda
 * GET    /api/pengumuman/index.php?id=1           -> detail
 * POST   /api/pengumuman/index.php                -> tambah (admin)
 * PUT    /api/pengumuman/index.php?id=1           -> update (admin)
 * DELETE /api/pengumuman/index.php?id=1           -> hapus (admin)
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
        $stmt = $db->prepare('SELECT * FROM pengumuman WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Pengumuman tidak ditemukan', 404);
        jsonResponse(formatRow($row));
        return;
    }

    $where = '1=1';
    $params = [];
    if (isset($_GET['beranda'])) {
        $where .= ' AND tampil_beranda = 1';
    }

    $stmt = $db->prepare("SELECT * FROM pengumuman WHERE $where ORDER BY tanggal DESC, id DESC");
    $stmt->execute($params);
    jsonResponse(array_map('formatRow', $stmt->fetchAll()));
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    validate($body);

    $stmt = $db->prepare(
        'INSERT INTO pengumuman (judul, isi, tanggal, kategori, penting, gambar, badge, status, link_label, link_href, icon, action_icon, variant, tampil_beranda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $body['judul'], $body['isi'] ?? '', $body['tanggal'], $body['kategori'],
        !empty($body['penting']) ? 1 : 0, $body['gambar'] ?? null,
        $body['badge'] ?? null, $body['status'] ?? null,
        $body['linkLabel'] ?? null, $body['linkHref'] ?? null,
        $body['icon'] ?? null, $body['actionIcon'] ?? null, $body['variant'] ?? null,
        !empty($body['tampilBeranda']) ? 1 : 0,
    ]);

    jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Pengumuman berhasil ditambahkan'], 201);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    validate($body);

    $stmt = $db->prepare(
        'UPDATE pengumuman SET judul=?, isi=?, tanggal=?, kategori=?, penting=?, gambar=?, badge=?, status=?, link_label=?, link_href=?, icon=?, action_icon=?, variant=?, tampil_beranda=?
         WHERE id=?'
    );
    $stmt->execute([
        $body['judul'], $body['isi'] ?? '', $body['tanggal'], $body['kategori'],
        !empty($body['penting']) ? 1 : 0, $body['gambar'] ?? null,
        $body['badge'] ?? null, $body['status'] ?? null,
        $body['linkLabel'] ?? null, $body['linkHref'] ?? null,
        $body['icon'] ?? null, $body['actionIcon'] ?? null, $body['variant'] ?? null,
        !empty($body['tampilBeranda']) ? 1 : 0,
        $id,
    ]);

    if ($stmt->rowCount() === 0) jsonError('Data tidak ditemukan atau tidak ada perubahan', 404);
    jsonResponse(['message' => 'Pengumuman berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $stmt = $db->prepare('DELETE FROM pengumuman WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Pengumuman tidak ditemukan', 404);
    jsonResponse(['message' => 'Pengumuman berhasil dihapus']);
}

function validate(array $body): void
{
    foreach (['judul', 'tanggal', 'kategori'] as $f) {
        if (empty($body[$f])) jsonError("Field '$f' wajib diisi", 400);
    }
}

function formatRow(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'judul' => $row['judul'],
        'isi' => $row['isi'],
        'tanggal' => date('d F Y', strtotime($row['tanggal'])),
        'kategori' => $row['kategori'],
        'penting' => (bool)$row['penting'],
        'gambar' => $row['gambar'],
        'badge' => $row['badge'],
        'status' => $row['status'],
        'linkLabel' => $row['link_label'],
        'linkHref' => $row['link_href'],
        'icon' => $row['icon'],
        'actionIcon' => $row['action_icon'],
        'variant' => $row['variant'],
    ];
}
