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

// Dideklarasikan SEBELUM switch: `const` top-level tidak di-hoist, jadi bila
// diletakkan setelah switch, handleGet() memanggilnya sebelum dieksekusi
// (bug: "Undefined constant JURUSAN_LIST" -> HTTP 500, ditemukan saat uji e2e).
const JURUSAN_LIST = ['perhotelan', 'boga', 'busana', 'pplg', 'pariwisata'];

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

function handleGet(PDO $db): void
{
    if (isset($_GET['admin'])) {
        requireAuth();
        $stmt = $db->query('SELECT * FROM jadwal ORDER BY jurusan, sesi, urutan');
        // Baris PDO mentah mengirim id/urutan sebagai string — petakan dulu
        // agar cocok dengan kontrak DTO admin (temuan A19, laporan inspeksi).
        jsonResponse(array_map('formatAdminRow', $stmt->fetchAll()));
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
    // urutan = posisi kolom ke-0..4 pada matriks 5 kolom; tolak nilai di luar
    // rentang atau bukan bilangan bulat sebelum menyentuh kolom INT.
    if (!preg_match('/^\d+$/', (string)$body['urutan'])
        || (int)$body['urutan'] < 0 || (int)$body['urutan'] > 4) {
        jsonError("Field 'urutan' harus integer antara 0 dan 4", 400);
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

/**
 * Bentuk baris jadwal untuk konsumen admin (`?admin=1`).
 * PDO mengembalikan id/urutan sebagai string; petakan ke integer agar cocok
 * dengan JadwalRowDTO di aplikasi admin (temuan A19).
 */
function formatAdminRow(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'jurusan' => $row['jurusan'],
        'sesi' => $row['sesi'],
        'urutan' => (int)$row['urutan'],
        'mapel' => $row['mapel'],
        'jam' => $row['jam'],
        'waktu' => $row['waktu'],
        'guru' => $row['guru'],
    ];
}
