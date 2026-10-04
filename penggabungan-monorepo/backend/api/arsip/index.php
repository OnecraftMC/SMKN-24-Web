<?php
/**
 * GET    /api/arsip/index.php                  -> arsip aktif untuk publik
 * GET    /api/arsip/index.php?admin=1          -> semua metadata (admin)
 * GET    /api/arsip/index.php?id=1&download=1  -> unduh file
 * POST   /api/arsip/index.php                  -> tambah arsip (admin, multipart)
 * PUT    /api/arsip/index.php?id=1             -> ubah metadata (admin)
 * DELETE /api/arsip/index.php?id=1             -> hapus arsip dan file (admin)
 */

require_once __DIR__ . '/../../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'], true)) {
    jsonError('Method tidak diizinkan', 405);
}
if (in_array($method, ['POST', 'PUT', 'DELETE'], true) ||
    ($method === 'GET' && ($_GET['admin'] ?? '') === '1')) {
    requireAuth();
}
$db = getDB();

switch ($method) {
    case 'GET':
        handleGet($db);
        break;
    case 'POST':
        handleCreate($db);
        break;
    case 'PUT':
        handleUpdate($db);
        break;
    case 'DELETE':
        handleDelete($db);
        break;
    default:
        jsonError('Method tidak diizinkan', 405);
}

function handleGet(PDO $db): void
{
    if (isset($_GET['id']) && ($_GET['download'] ?? '') === '1') {
        $stmt = $db->prepare('SELECT * FROM arsip WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row) jsonError('Dokumen tidak ditemukan.', 404);
        if ((int)$row['aktif'] !== 1) requireAuth();
        sendPrivateDownload($row['storage_key'], $row['nama_file'], $row['mime_type']);
    }

    if (($_GET['admin'] ?? '') === '1') {
        $rows = $db->query('SELECT * FROM arsip ORDER BY created_at DESC, id DESC')->fetchAll();
        jsonResponse(array_map('formatArchive', $rows));
    }

    $rows = $db->query('SELECT * FROM arsip WHERE aktif = 1 ORDER BY kategori ASC, judul ASC')->fetchAll();
    jsonResponse(array_map('formatArchive', $rows));
}

function handleCreate(PDO $db): void
{
    $judul = trim((string)($_POST['judul'] ?? ''));
    $deskripsi = trim((string)($_POST['deskripsi'] ?? ''));
    $kategori = trim((string)($_POST['kategori'] ?? 'Akademik'));
    $aktif = ($_POST['aktif'] ?? '0') === '1' ? 1 : 0;
    validateArchiveMetadata($judul, $deskripsi, $kategori);

    $upload = storePrivateUpload('file', archiveUploadTypes());
    if ($upload === null) jsonError('Pilih dokumen untuk diunggah.', 400);

    try {
        $stmt = $db->prepare(
            'INSERT INTO arsip (judul, deskripsi, kategori, nama_file, storage_key, mime_type, ukuran_file, aktif)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $judul,
            $deskripsi === '' ? null : $deskripsi,
            $kategori,
            $upload['originalName'],
            $upload['storedName'],
            $upload['mime'],
            $upload['size'],
            $aktif,
        ]);
    } catch (Throwable $error) {
        if (!deletePrivateUpload($upload['storedName'])) {
            error_log('[SMKN24] File arsip gagal dibersihkan setelah insert database gagal.');
        }
        throw $error;
    }

    jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Dokumen arsip berhasil ditambahkan.'], 201);
}

function handleUpdate(PDO $db): void
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) jsonError('Parameter id tidak valid.', 400);

    $body = getJsonBody();
    $judul = trim((string)($body['judul'] ?? ''));
    $deskripsi = trim((string)($body['deskripsi'] ?? ''));
    $kategori = trim((string)($body['kategori'] ?? ''));
    if (!isset($body['aktif']) || !in_array($body['aktif'], [true, false, 0, 1, '0', '1'], true)) {
        jsonError("Field 'aktif' harus berupa boolean.", 400);
    }
    validateArchiveMetadata($judul, $deskripsi, $kategori);

    $stmt = $db->prepare(
        'UPDATE arsip SET judul = ?, deskripsi = ?, kategori = ?, aktif = ? WHERE id = ?'
    );
    $stmt->execute([$judul, $deskripsi === '' ? null : $deskripsi, $kategori, (int)(bool)$body['aktif'], $id]);

    $exists = $db->prepare('SELECT id FROM arsip WHERE id = ?');
    $exists->execute([$id]);
    if (!$exists->fetch()) jsonError('Dokumen arsip tidak ditemukan.', 404);
    jsonResponse(['message' => 'Metadata arsip berhasil diperbarui.']);
}

function handleDelete(PDO $db): void
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) jsonError('Parameter id tidak valid.', 400);

    $stmt = $db->prepare('SELECT storage_key FROM arsip WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) jsonError('Dokumen arsip tidak ditemukan.', 404);

    $delete = $db->prepare('DELETE FROM arsip WHERE id = ?');
    $delete->execute([$id]);
    if (!deletePrivateUpload($row['storage_key'])) {
        error_log('[SMKN24] Metadata arsip terhapus, tetapi file privat gagal dibersihkan.');
        jsonError('Metadata terhapus, tetapi file gagal dibersihkan. Hubungi administrator server.', 500);
    }

    jsonResponse(['message' => 'Dokumen arsip dan file berhasil dihapus.']);
}

function validateArchiveMetadata(string $judul, string $deskripsi, string $kategori): void
{
    if ($judul === '' || strlen($judul) > 255) jsonError('Judul wajib diisi (maksimal 255 karakter).', 400);
    if (strlen($deskripsi) > 5000) jsonError('Deskripsi maksimal 5.000 karakter.', 400);
    if ($kategori === '' || strlen($kategori) > 100) jsonError('Kategori wajib diisi (maksimal 100 karakter).', 400);
}

function archiveUploadTypes(): array
{
    return [
        'pdf' => ['application/pdf'],
        'docx' => [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
            'application/x-zip',
        ],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
    ];
}

function formatArchive(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'judul' => $row['judul'],
        'deskripsi' => $row['deskripsi'],
        'kategori' => $row['kategori'],
        'namaFile' => $row['nama_file'],
        'ukuranFile' => (int)$row['ukuran_file'],
        'aktif' => (bool)$row['aktif'],
        'createdAt' => $row['created_at'],
        'downloadUrl' => '/api/arsip/index.php?id=' . (int)$row['id'] . '&download=1',
    ];
}
