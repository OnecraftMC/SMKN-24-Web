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
    // Prioritas guru BK: kasus butuh perhatian didahulukan, lalu tingkat
    // kesulitan (Berat > Sedang > Ringan), lalu yang terbaru.
    // Catatan: pesan lama (sebelum fitur ini) punya tingkat_kesulitan NULL.
    // FIELD() mengembalikan 0 untuk NULL sehingga akan menduduki posisi
    // teratas; itu tidak diinginkan, jadi NULL dipaksa ke nilai paling akhir
    // ('zzz') agar urutannya tidak menutupi kasus yang benar-benar triase.
    $sql = "SELECT * FROM pesan_bk
            ORDER BY
                butuh_perhatian DESC,
                FIELD(IFNULL(tingkat_kesulitan, 'zzz'), 'Berat', 'Sedang', 'Ringan', 'zzz'),
                tanggal DESC";
    $stmt = $db->query($sql);
    $rows = array_map(function ($r) {
        return [
            'id' => (int)$r['id'],
            'nama' => $r['nama'],
            'kelas' => $r['kelas'],
            'noHp' => $r['no_hp'],
            'keperluan' => $r['keperluan'],
            'pesan' => $r['pesan'],
            'status' => $r['status'],
            'kategori' => $r['kategori'] ?? null,
            'tanggal' => $r['tanggal'],
            // Hasil triase AI Bimbingan Konseling.
            'ringkasan' => $r['ringkasan'] ?? null,
            'tingkatKesulitan' => $r['tingkat_kesulitan'] ?? null,
            'kategori' => $r['kategori'] ?? null,
            'butuhPerhatian' => (bool)($r['butuh_perhatian'] ?? 0),
            'transkrip' => $r['transkrip'] ?? null,
            'media' => json_decode((string)($r['media_json'] ?? '[]'), true) ?: [],
        ];
    }, $stmt->fetchAll());

    jsonResponse($rows);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);

    $body = getJsonBody();
    $hasStatus = array_key_exists('status', $body);
    $hasCategory = array_key_exists('kategori', $body);
    if (!$hasStatus && !$hasCategory) {
        jsonError('Status atau kategori harus diubah.', 400);
    }
    if ($hasStatus && !in_array($body['status'], ['Baru', 'Diproses', 'Selesai'], true)) {
        jsonError('Status tidak valid', 400);
    }

    $exists = $db->prepare('SELECT id FROM pesan_bk WHERE id = ?');
    $exists->execute([$id]);
    if (!$exists->fetch()) jsonError('Data tidak ditemukan.', 404);

    $sets = [];
    $values = [];
    if ($hasStatus) {
        $sets[] = 'status = ?';
        $values[] = $body['status'];
    }
    if ($hasCategory) {
        $sets[] = 'kategori = ?';
        $values[] = validateCategorySelection($db, 'bk', $body['kategori']);
    }
    $values[] = $id;
    $stmt = $db->prepare('UPDATE pesan_bk SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($values);

    jsonResponse(['message' => 'Pesan BK berhasil diperbarui.']);
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
