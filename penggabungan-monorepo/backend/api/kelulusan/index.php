<?php
/**
 * POST ?action=cek -> cek hasil kelulusan berdasarkan NISN (respons publik terbatas)
 * GET ?admin=1     -> daftar data admin
 * POST             -> tambah data admin
 * PUT ?id=1        -> ubah data admin
 * DELETE ?id=1     -> hapus data admin
 */
require_once __DIR__ . '/../../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'], true)) {
    jsonError('Method tidak diizinkan.', 405);
}

if ($method === 'POST' && ($_GET['action'] ?? '') === 'cek') {
    checkGraduation(getDB());
}

if ($method === 'GET' && ($_GET['admin'] ?? '') === '1') {
    requireAuth();
    header('Cache-Control: no-store, private');
    $rows = getDB()->query(
        'SELECT id, nisn, nama_siswa, kelas, jurusan, tahun_lulus, status, aktif, created_at, updated_at
         FROM kelulusan ORDER BY tahun_lulus DESC, nama_siswa ASC'
    )->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(array_map('formatGraduationAdmin', $rows));
}

if (!in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
    jsonError('Method tidak diizinkan.', 405);
}
requireAuth();
header('Cache-Control: no-store, private');
$db = getDB();

switch ($method) {
    case 'POST':
        saveGraduation($db, null);
    case 'PUT':
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id || $id < 1) jsonError('Parameter id tidak valid.', 400);
        saveGraduation($db, $id);
    case 'DELETE':
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id || $id < 1) jsonError('Parameter id tidak valid.', 400);
        $stmt = $db->prepare('DELETE FROM kelulusan WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonError('Data kelulusan tidak ditemukan.', 404);
        jsonResponse(['message' => 'Data kelulusan berhasil dihapus.']);
}

function checkGraduation(PDO $db): void
{
    header('Cache-Control: no-store, private');
    $body = getJsonBody();
    $nisn = trim((string)($body['nisn'] ?? ''));
    if (!preg_match('/\A\d{10}\z/', $nisn)) {
        jsonError('NISN harus terdiri dari 10 digit.', 400);
    }
    $stmt = $db->prepare(
        'SELECT nama_siswa, kelas, jurusan, tahun_lulus, status
         FROM kelulusan WHERE nisn = ? AND aktif = 1 LIMIT 1'
    );
    $stmt->execute([$nisn]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) jsonError('Data kelulusan tidak ditemukan. Periksa NISN atau hubungi pihak sekolah.', 404);
    jsonResponse([
        'namaSiswa' => $row['nama_siswa'],
        'kelas' => $row['kelas'],
        'jurusan' => $row['jurusan'],
        'tahunLulus' => (int)$row['tahun_lulus'],
        'status' => $row['status'],
    ]);
}

function saveGraduation(PDO $db, ?int $id): void
{
    $body = getJsonBody();
    $nisn = trim((string)($body['nisn'] ?? ''));
    $nama = trim((string)($body['namaSiswa'] ?? ''));
    $kelas = trim((string)($body['kelas'] ?? ''));
    $jurusan = trim((string)($body['jurusan'] ?? ''));
    $year = filter_var($body['tahunLulus'] ?? null, FILTER_VALIDATE_INT);
    $status = $body['status'] ?? '';
    $aktif = $body['aktif'] ?? null;

    if (!preg_match('/\A\d{10}\z/', $nisn)) jsonError('NISN harus terdiri dari 10 digit.', 400);
    foreach (['nama siswa' => [$nama, 150], 'kelas' => [$kelas, 80], 'jurusan' => [$jurusan, 100]] as $label => [$value, $max]) {
        if ($value === '' || mb_strlen($value) > $max) jsonError("$label wajib diisi, maksimal $max karakter.", 400);
    }
    if (!$year || $year < 1950 || $year > (int)date('Y') + 1) jsonError('Tahun lulus tidak valid.', 400);
    if (!in_array($status, ['Lulus', 'Tidak Lulus'], true)) jsonError('Status kelulusan tidak valid.', 400);
    if (!in_array($aktif, [true, false, 0, 1, '0', '1'], true)) jsonError("Field 'aktif' harus berupa boolean.", 400);

    $duplicate = $db->prepare('SELECT id FROM kelulusan WHERE nisn = ? AND id <> ? LIMIT 1');
    $duplicate->execute([$nisn, $id ?? 0]);
    if ($duplicate->fetch()) jsonError('NISN sudah memiliki data kelulusan.', 409);

    $values = [$nisn, $nama, $kelas, $jurusan, $year, $status, (int)(bool)$aktif];
    if ($id === null) {
        $stmt = $db->prepare(
            'INSERT INTO kelulusan (nisn, nama_siswa, kelas, jurusan, tahun_lulus, status, aktif)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute($values);
        jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Data kelulusan berhasil ditambahkan.'], 201);
    }

    $stmt = $db->prepare(
        'UPDATE kelulusan SET nisn = ?, nama_siswa = ?, kelas = ?, jurusan = ?, tahun_lulus = ?, status = ?, aktif = ? WHERE id = ?'
    );
    $stmt->execute([...$values, $id]);
    $exists = $db->prepare('SELECT id FROM kelulusan WHERE id = ?');
    $exists->execute([$id]);
    if (!$exists->fetch()) jsonError('Data kelulusan tidak ditemukan.', 404);
    jsonResponse(['message' => 'Data kelulusan berhasil diperbarui.']);
}

function formatGraduationAdmin(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'nisn' => $row['nisn'],
        'namaSiswa' => $row['nama_siswa'],
        'kelas' => $row['kelas'],
        'jurusan' => $row['jurusan'],
        'tahunLulus' => (int)$row['tahun_lulus'],
        'status' => $row['status'],
        'aktif' => (bool)$row['aktif'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}
