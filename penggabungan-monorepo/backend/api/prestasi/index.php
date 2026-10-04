<?php
/**
 * POST /api/prestasi/index.php                  -> pengajuan publik (multipart)
 * GET  /api/prestasi/index.php                  -> daftar admin
 * GET  /api/prestasi/index.php?id=1             -> detail admin
 * GET  /api/prestasi/index.php?download=1&id=1  -> bukti admin-only
 * PUT  /api/prestasi/index.php?id=1             -> moderasi status admin
 */

require_once __DIR__ . '/../../bootstrap.php';

header('Cache-Control: no-store, private');

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST', 'PUT'], true)) {
    jsonError('Method tidak diizinkan', 405);
}
if (in_array($method, ['GET', 'PUT'], true)) {
    requireAuth();
}

switch ($method) {
    case 'POST':
        handleCreate(getDB());
        break;
    case 'GET':
        handleGet(getDB());
        break;
    case 'PUT':
        handleUpdateStatus(getDB());
        break;
    default:
        jsonError('Method tidak diizinkan', 405);
}

function handleCreate(PDO $db): void
{
    $fields = [
        'nisn' => 20,
        'namaSiswa' => 150,
        'kelas' => 80,
        'jurusan' => 100,
        'perlombaan' => 255,
        'tingkat' => 100,
        'tanggalLomba' => 10,
        'penyelenggara' => 200,
        'prestasi' => 150,
    ];
    $values = [];
    foreach ($fields as $field => $maxLength) {
        $value = trim((string)($_POST[$field] ?? ''));
        if ($value === '' || strlen($value) > $maxLength) {
            jsonError("Field '$field' wajib diisi dan maksimal $maxLength karakter.", 400);
        }
        $values[$field] = $value;
    }

    $date = DateTime::createFromFormat('!Y-m-d', $values['tanggalLomba']);
    if (!$date || $date->format('Y-m-d') !== $values['tanggalLomba']) {
        jsonError("Field 'tanggalLomba' harus berupa tanggal yang valid.", 400);
    }

    $deskripsi = trim((string)($_POST['deskripsi'] ?? ''));
    if (strlen($deskripsi) > 3000) jsonError("Field 'deskripsi' maksimal 3.000 karakter.", 400);

    enforceSubmissionRateLimit('prestasi', 5, 3600);
    $upload = storePrivateUpload('bukti', achievementUploadTypes());

    try {
        $stmt = $db->prepare(
            'INSERT INTO prestasi
             (nisn, nama_siswa, kelas, jurusan, perlombaan, tingkat, tanggal_lomba,
              penyelenggara, prestasi, deskripsi, nama_file, storage_key, mime_type, ukuran_file)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $values['nisn'],
            $values['namaSiswa'],
            $values['kelas'],
            $values['jurusan'],
            $values['perlombaan'],
            $values['tingkat'],
            $values['tanggalLomba'],
            $values['penyelenggara'],
            $values['prestasi'],
            $deskripsi === '' ? null : $deskripsi,
            $upload['originalName'] ?? null,
            $upload['storedName'] ?? null,
            $upload['mime'] ?? null,
            $upload['size'] ?? null,
        ]);
    } catch (Throwable $error) {
        if ($upload !== null && !deletePrivateUpload($upload['storedName'])) {
            error_log('[SMKN24] File bukti gagal dibersihkan setelah insert database gagal.');
        }
        throw $error;
    }

    jsonResponse([
        'message' => 'Pengajuan prestasi berhasil diterima untuk ditinjau. Data hanya dapat diakses admin.',
    ], 201);
}

function handleGet(PDO $db): void
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (isset($_GET['download']) && $_GET['download'] === '1') {
        if (!$id || $id < 1) jsonError('Parameter id tidak valid.', 400);
        $stmt = $db->prepare('SELECT nama_file, storage_key, mime_type FROM prestasi WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row || !$row['storage_key']) jsonError('Bukti prestasi tidak ditemukan.', 404);
        sendPrivateDownload($row['storage_key'], $row['nama_file'], $row['mime_type']);
    }

    if (isset($_GET['id'])) {
        if (!$id || $id < 1) jsonError('Parameter id tidak valid.', 400);
        $stmt = $db->prepare('SELECT * FROM prestasi WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Pengajuan tidak ditemukan.', 404);
        jsonResponse(formatAchievement($row));
    }

    $page = filter_var($_GET['page'] ?? '1', FILTER_VALIDATE_INT);
    if (!$page || $page < 1 || $page > 100000) jsonError('Parameter page tidak valid.', 400);
    $pageSize = 50;
    $status = trim((string)($_GET['status'] ?? ''));
    $allowedStatuses = ['Baru', 'Ditinjau', 'Disetujui', 'Ditolak'];
    if ($status !== '' && !in_array($status, $allowedStatuses, true)) {
        jsonError('Filter status tidak valid.', 400);
    }
    $query = trim((string)($_GET['q'] ?? ''));
    if (strlen($query) > 100) jsonError('Kata pencarian maksimal 100 karakter.', 400);

    $conditions = [];
    $parameters = [];
    if ($status !== '') {
        $conditions[] = 'status = ?';
        $parameters[] = $status;
    }
    if ($query !== '') {
        $conditions[] = '(nama_siswa LIKE ? OR kelas LIKE ? OR jurusan LIKE ? OR perlombaan LIKE ? OR tingkat LIKE ? OR penyelenggara LIKE ? OR prestasi LIKE ?)';
        $search = '%' . $query . '%';
        array_push($parameters, $search, $search, $search, $search, $search, $search, $search);
    }
    $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';

    $count = $db->prepare('SELECT COUNT(*) FROM prestasi' . $where);
    $count->execute($parameters);
    $total = (int)$count->fetchColumn();

    $statement = $db->prepare(
        'SELECT * FROM prestasi' . $where . ' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?'
    );
    foreach ($parameters as $index => $parameter) {
        $statement->bindValue($index + 1, $parameter, PDO::PARAM_STR);
    }
    $statement->bindValue(count($parameters) + 1, $pageSize, PDO::PARAM_INT);
    $statement->bindValue(count($parameters) + 2, ($page - 1) * $pageSize, PDO::PARAM_INT);
    $statement->execute();

    jsonResponse([
        'items' => array_map('formatAchievement', $statement->fetchAll()),
        'page' => $page,
        'pageSize' => $pageSize,
        'total' => $total,
    ]);
}

function handleUpdateStatus(PDO $db): void
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) jsonError('Parameter id tidak valid.', 400);

    $body = getJsonBody();
    $status = $body['status'] ?? null;
    $allowedStatuses = ['Baru', 'Ditinjau', 'Disetujui', 'Ditolak'];
    if (!is_string($status) || !in_array($status, $allowedStatuses, true)) {
        jsonError('Status moderasi tidak valid.', 400);
    }

    $stmt = $db->prepare(
        "UPDATE prestasi SET status = ?, reviewed_at = IF(? = 'Baru', NULL, CURRENT_TIMESTAMP) WHERE id = ?"
    );
    $stmt->execute([$status, $status, $id]);

    $exists = $db->prepare('SELECT id FROM prestasi WHERE id = ?');
    $exists->execute([$id]);
    if (!$exists->fetch()) jsonError('Pengajuan tidak ditemukan.', 404);
    jsonResponse(['message' => 'Status pengajuan berhasil diperbarui.']);
}

function achievementUploadTypes(): array
{
    return [
        'pdf' => ['application/pdf'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
    ];
}

function formatAchievement(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'nisn' => $row['nisn'],
        'namaSiswa' => $row['nama_siswa'],
        'kelas' => $row['kelas'],
        'jurusan' => $row['jurusan'],
        'perlombaan' => $row['perlombaan'],
        'tingkat' => $row['tingkat'],
        'tanggalLomba' => $row['tanggal_lomba'],
        'penyelenggara' => $row['penyelenggara'],
        'prestasi' => $row['prestasi'],
        'deskripsi' => $row['deskripsi'],
        'namaFile' => $row['nama_file'],
        'adaBukti' => $row['storage_key'] !== null,
        'status' => $row['status'],
        'createdAt' => $row['created_at'],
        'reviewedAt' => $row['reviewed_at'],
        'downloadUrl' => $row['storage_key'] === null
            ? null
            : '/api/prestasi/index.php?id=' . (int)$row['id'] . '&download=1',
    ];
}
