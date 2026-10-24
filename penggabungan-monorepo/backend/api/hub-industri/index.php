<?php
/**
 * Public: GET /api/hub-industri/index.php?public=1
 * Admin: GET/POST/PUT/DELETE /api/hub-industri/index.php
 */
require_once __DIR__ . '/../../bootstrap.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (($_GET['public'] ?? '') !== '1') requireAuth();
        handleGet($db, ($_GET['public'] ?? '') === '1');
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

function handleGet(PDO $db, bool $public): void
{
    if (isset($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM hub_industri WHERE id = ?');
        $stmt->execute([(int)$_GET['id']]);
        $row = $stmt->fetch();
        if (!$row || ($public && !(bool)$row['aktif'])) jsonError('Mitra industri tidak ditemukan', 404);
        jsonResponse(formatRow($row));
        return;
    }

    $where = $public ? ' WHERE aktif = 1' : '';
    $stmt = $db->query('SELECT * FROM hub_industri' . $where . ' ORDER BY urutan ASC, id ASC');
    jsonResponse(array_map('formatRow', $stmt->fetchAll()));
}

function handleCreate(PDO $db): void
{
    $body = getJsonBody();
    validate($body);
    $stmt = $db->prepare('INSERT INTO hub_industri (nama, logo, alamat, deskripsi, link_label, link_href, urutan, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        trim($body['nama']), optionalString($body, 'logo'), trim($body['alamat']), trim($body['deskripsi']),
        optionalString($body, 'linkLabel'), optionalString($body, 'linkHref'), (int)($body['urutan'] ?? 0),
        !array_key_exists('aktif', $body) || !empty($body['aktif']) ? 1 : 0,
    ]);
    jsonResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Mitra industri berhasil ditambahkan'], 201);
}

function handleUpdate(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);
    $body = getJsonBody();
    validate($body);

    $exists = $db->prepare('SELECT id FROM hub_industri WHERE id = ?');
    $exists->execute([$id]);
    if (!$exists->fetch()) jsonError('Mitra industri tidak ditemukan', 404);

    $stmt = $db->prepare('UPDATE hub_industri SET nama=?, logo=?, alamat=?, deskripsi=?, link_label=?, link_href=?, urutan=?, aktif=? WHERE id=?');
    $stmt->execute([
        trim($body['nama']), optionalString($body, 'logo'), trim($body['alamat']), trim($body['deskripsi']),
        optionalString($body, 'linkLabel'), optionalString($body, 'linkHref'), (int)($body['urutan'] ?? 0),
        !empty($body['aktif']) ? 1 : 0, $id,
    ]);
    jsonResponse(['message' => 'Mitra industri berhasil diperbarui']);
}

function handleDelete(PDO $db): void
{
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('Parameter id wajib diisi', 400);
    $stmt = $db->prepare('DELETE FROM hub_industri WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonError('Mitra industri tidak ditemukan', 404);
    jsonResponse(['message' => 'Mitra industri berhasil dihapus']);
}

function validate(array $body): void
{
    foreach (['nama' => 255, 'alamat' => 5000, 'deskripsi' => 10000] as $field => $maxLength) {
        if (!isset($body[$field]) || !is_string($body[$field]) || trim($body[$field]) === '') {
            jsonError("Field '$field' wajib diisi", 400);
        }
        if (strlen(trim($body[$field])) > $maxLength) jsonError("Field '$field' terlalu panjang", 400);
    }
    foreach (['logo' => 500, 'linkLabel' => 120, 'linkHref' => 500] as $field => $maxLength) {
        if (isset($body[$field]) && (!is_string($body[$field]) || strlen($body[$field]) > $maxLength)) {
            jsonError("Field '$field' tidak valid", 400);
        }
    }
    $label = trim((string)($body['linkLabel'] ?? ''));
    $href = trim((string)($body['linkHref'] ?? ''));
    if (($label === '') !== ($href === '')) jsonError('Label dan tautan aksi harus diisi bersama', 400);
    if ($href !== '' && !preg_match('~^(https?://|mailto:|tel:|/)~i', $href)) jsonError('Tautan aksi harus berupa URL http, https, email, telepon, atau path lokal', 400);
    if (isset($body['urutan']) && filter_var($body['urutan'], FILTER_VALIDATE_INT) === false) jsonError("Field 'urutan' harus berupa angka", 400);
    if (array_key_exists('aktif', $body) && !is_bool($body['aktif']) && !in_array($body['aktif'], [0, 1, '0', '1'], true)) {
        jsonError("Field 'aktif' harus berupa boolean", 400);
    }
}

function optionalString(array $body, string $key): ?string
{
    $value = trim((string)($body[$key] ?? ''));
    return $value === '' ? null : $value;
}

function formatRow(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'nama' => $row['nama'],
        'logo' => $row['logo'],
        'alamat' => $row['alamat'],
        'deskripsi' => $row['deskripsi'],
        'linkLabel' => $row['link_label'],
        'linkHref' => $row['link_href'],
        'urutan' => (int)$row['urutan'],
        'aktif' => (bool)$row['aktif'],
    ];
}
