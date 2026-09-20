<?php
/**
 * GET  /api/jadwal/index.php                 -> semua jurusan, format JADWAL_DATA (matriks)
 * GET  /api/jadwal/index.php?jurusan=pplg     -> hanya 1 jurusan
 * GET  /api/jadwal/index.php?admin=1          -> daftar mentah per baris (untuk tabel admin), butuh login
 * POST /api/jadwal/index.php                  -> simpan/replace 1 slot (admin)
 *      body: { jurusan, sesi, urutan, mapel, jam, waktu, guru }
 * DELETE /api/jadwal/index.php?id=1           -> hapus 1 baris (admin)
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
        handleUpsert($db);
        break;
    case 'DELETE':
        requireAuth();
        handleDelete($db);
        break;
    default:
        jsonError('Method tidak diizinkan', 405);
}

const JURUSAN_LIST = ['perhotelan', 'boga', 'busana', 'pplg', 'pariwisata'];

function handleGet(PDO $db): void
{
    if (isset($_GET['admin'])) {
        requireAuth();
        $stmt = $db->query('SELECT * FROM jadwal ORDER BY jurusan, sesi, urutan');
        jsonResponse($stmt->fetchAll());
        return;
    }

    $jurusanFilter = $_GET['jurusan'] ?? null;
    $list = $jurusanFilter ? [$jurusanFilter] : JURUSAN_LIST;

    $result = [];
    foreach ($list as $jurusan) {
        $stmt = $db->prepare('SELECT * FROM jadwal WHERE jurusan = ? ORDER BY sesi, urutan');
        $stmt->execute([$jurusan]);
        $rows = $stmt->fetchAll();

        $pagi = [];
        $siang = [];
        foreach ($rows as $r) {
            if ($r['sesi'] === 'pagi') $pagi[] = $r['mapel'];
            else $siang[] = $r['mapel'];
        }
        $result[$jurusan] = ['pagi' => $pagi, 'siang' => $siang];
    }

    jsonResponse($jurusanFilter ? ($result[$jurusanFilter] ?? []) : $result);
}

function handleUpsert(PDO $db): void
{
    $body = getJsonBody();
    foreach (['jurusan', 'sesi', 'urutan', 'mapel'] as $f) {
        if (!isset($body[$f]) || $body[$f] === '') jsonError("Field '$f' wajib diisi", 400);
    }
    if (!in_array($body['jurusan'], JURUSAN_LIST, true)) {
        jsonError('Jurusan tidak valid', 400);
    }
    if (!in_array($body['sesi'], ['pagi', 'siang'], true)) {
        jsonError('Sesi harus pagi atau siang', 400);
    }

    $stmt = $db->prepare(
        'INSERT INTO jadwal (jurusan, sesi, urutan, mapel, jam, waktu, guru)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE mapel=VALUES(mapel), jam=VALUES(jam), waktu=VALUES(waktu), guru=VALUES(guru)'
    );
    $stmt->execute([
        $body['jurusan'], $body['sesi'], (int)$body['urutan'], $body['mapel'],
        $body['jam'] ?? null, $body['waktu'] ?? null, $body['guru'] ?? null,
    ]);

    jsonResponse(['message' => 'Jadwal berhasil disimpan']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $stmt = $db->prepare('DELETE FROM jadwal WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Data jadwal tidak ditemukan', 404);
    jsonResponse(['message' => 'Jadwal berhasil dihapus']);
}
