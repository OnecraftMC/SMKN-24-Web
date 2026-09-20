<?php
/**
 * POST   /api/bk/index.php            -> kirim pesan BK (publik, dari FormBK.tsx)
 * GET    /api/bk/index.php            -> daftar pesan BK (admin)
 * PUT    /api/bk/index.php?id=1       -> update status (admin)
 * DELETE /api/bk/index.php?id=1       -> hapus (admin)
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
    foreach (['nama', 'kelas', 'keperluan', 'pesan'] as $f) {
        if (empty($body[$f])) jsonError("Field '$f' wajib diisi", 400);
    }

    $stmt = $db->prepare(
        'INSERT INTO pesan_bk (nama, kelas, no_hp, keperluan, pesan) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $body['nama'], $body['kelas'], $body['noHp'] ?? null,
        $body['keperluan'], $body['pesan'],
    ]);

    jsonResponse(['message' => 'Pesan Anda berhasil dikirim ke Guru BK. Terima kasih!'], 201);
}

function handleGet(PDO $db): void
{
    $stmt = $db->query('SELECT * FROM pesan_bk ORDER BY tanggal DESC');
    $rows = array_map(function ($r) {
        return [
            'id' => (int)$r['id'],
            'nama' => $r['nama'],
            'kelas' => $r['kelas'],
            'noHp' => $r['no_hp'],
            'keperluan' => $r['keperluan'],
            'pesan' => $r['pesan'],
            'status' => $r['status'],
            'tanggal' => $r['tanggal'],
        ];
    }, $stmt->fetchAll());

    jsonResponse($rows);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    if (empty($body['status']) || !in_array($body['status'], ['Baru', 'Diproses', 'Selesai'], true)) {
        jsonError('Status tidak valid', 400);
    }

    $stmt = $db->prepare('UPDATE pesan_bk SET status = ? WHERE id = ?');
    $stmt->execute([$body['status'], $id]);

    if ($stmt->rowCount() === 0) jsonError('Data tidak ditemukan atau tidak ada perubahan', 404);
    jsonResponse(['message' => 'Status berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $stmt = $db->prepare('DELETE FROM pesan_bk WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Data tidak ditemukan', 404);
    jsonResponse(['message' => 'Pesan berhasil dihapus']);
}
