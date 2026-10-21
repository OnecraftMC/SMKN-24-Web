<?php
/**
 * Endpoint pengetahuan chatbot — buat jalur dashboard admin.
 *
 * GET    /api/knowledge/index.php              -> daftar potongan entri (admin)
 * GET    /api/knowledge/index.php?id=7          -> satu entri penuh (untuk edit)
 * POST   /api/knowledge/index.php               -> unggah dataset + upsert (admin)
 *   multipart/form-data field "file" (.md .txt .csv .docx .xlsx, maks 8 MB)
 *   POST ?preview=1 -> hanya parse + validasi: tidak menulis ke tabel.
 * PUT    /api/knowledge/index.php               -> ubah satu entri manual (admin)
 * DELETE /api/knowledge/index.php?id=7          -> hapus satu entri (admin)
 *
 * Parser dari helpers/knowledge_parser.php — satu kontrak dengan CLI
 * (backend/tools/import-chat-knowledge.php) dan tabel `knowledge`
 * (backend/migrations/20261006_add_chat_knowledge.sql). Chatbot membaca
 * tabel ini live lewat alat `cari_pengetahuan`, jadi hasil impor langsung
 * masuk memori tanpa proses lain.
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../helpers/knowledge_parser.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        requireAuth();
        handleGet($db);
        break;
    case 'POST':
        requireAuth();
        handleImport($db);
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

/** GET: daftar potongan (list) atau satu entri penuh (?id=). */
function handleGet(PDO $db): void
{
    if (isset($_GET['id'])) {
        $stmt = $db->prepare('SELECT id, judul, kategori, konten, tags, sumber, updated_at FROM knowledge WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            jsonError('Entri tidak ditemukan', 404);
        }
        jsonResponse(['entri' => $row]);
    }

    try {
        $db->query('SELECT 1 FROM knowledge LIMIT 1');
    } catch (PDOException $e) {
        error_log('[SMKN24] knowledge belum siap: ' . $e->getMessage());
        jsonError('Tabel knowledge belum dibuat. Jalankan backend/migrations/20261006_add_chat_knowledge.sql terlebih dahulu.', 500);
    }

    $q = trim((string) ($_GET['q'] ?? ''));
    if ($q !== '') {
        $like = '%' . $q . '%';
        // LIKE di judul+konten+tags; LIMIT 200 cukup untuk pengelolaan dashboard.
        $stmt = $db->prepare(
            'SELECT id, judul, kategori, tags, sumber, LEFT(konten, 180) AS potongan, updated_at
             FROM knowledge WHERE judul LIKE ? OR konten LIKE ? OR tags LIKE ?
             ORDER BY updated_at DESC LIMIT 200'
        );
        $stmt->execute([$like, $like, $like]);
    } else {
        $stmt = $db->prepare(
            'SELECT id, judul, kategori, tags, sumber, LEFT(konten, 180) AS potongan, updated_at
             FROM knowledge ORDER BY updated_at DESC LIMIT 200'
        );
        $stmt->execute();
    }
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $total = (int) $db->query('SELECT COUNT(*) FROM knowledge')->fetchColumn();

    jsonResponse(['entri' => $rows, 'total' => $total]);
}

/** POST multipart: parse -> (preview | upsert). */
function handleImport(PDO $db): void
{
    $file = $_FILES['file'] ?? null;
    if (!$file || $file['error'] === UPLOAD_ERR_NO_FILE) {
        jsonError('Tidak ada file yang diunggah', 400);
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        jsonError('Gagal mengunggah file (kode ' . $file['error'] . ')', 400);
    }

    $namaAsli = (string) ($file['name'] ?? '');
    $ekstensi = strtolower(pathinfo($namaAsli, PATHINFO_EXTENSION));
    if (!in_array($ekstensi, EKSTENSI_DATASET, true)) {
        jsonError('Format untuk harus .md .txt .csv .docx atau .xlsx.', 400);
    }
    $maxSize = 8 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        jsonError('Ukuran file maksimal 8MB.', 400);
    }
    // MIME dibenarkan: teks (md/txt/csv) atau tipe OOXML (docx/xlsx).
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!$mime || !(
        str_starts_with($mime, 'text/')
        || str_starts_with($mime, 'application/vnd.openxmlformats-officedocument.')
    )) {
        jsonError('Tipe file (' . $mime . ') tidak dikenali untuk dataset.', 400);
    }

    [$rows, $catatanAwal] = knowledge_parseFile($file['tmp_name'], $namaAsli);
    $hasil = knowledge_validasi($rows);
    $valid = $hasil['valid'];
    $catatan = array_merge($catatanAwal, $hasil['catatan']);

    // Pratinjau: tidak menulis sama sekali — admin cek dulu,
    // lihat baris yang akan dimasukkan, baru tekan "imporkan".
    if (in_array((string) ($_GET['preview'] ?? ''), ['1', 'true'], true)) {
        jsonResponse([
            'dibaca' => count($rows),
            'valid' => array_map('knowledge_barisPreview', $valid),
            'gagal' => $catatan,
        ]);
    }

    if ($valid === []) {
        $pesan = $catatan !== [] ? implode(' ', array_slice($catatan, 0, 3)) : 'Tidak ada baris valid dalam file.';
        jsonError($pesan, 422);
    }

    try {
        $db->query('SELECT 1 FROM knowledge LIMIT 1');
        $upsert = $db->prepare(
            'INSERT INTO knowledge (judul, kategori, konten, tags, sumber) VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE kategori = VALUES(kategori), konten = VALUES(konten),
                                     tags = VALUES(tags), sumber = VALUES(sumber)'
        );
    } catch (PDOException $e) {
        error_log('[SMKN24] knowledge belum siap: ' . $e->getMessage());
        jsonError('Tabel knowledge belum dibuat. Jalankan backend/migrations/20261006_add_chat_knowledge.sql terlebih dahulu.', 500);
    }

    // Judul yang sudah ada di tabel = update; yang belum = entri baru.
    $antara = $db->prepare('SELECT COUNT(*) FROM knowledge WHERE judul = ?');
    $baru = 0;
    $disimpan = 0;
    $tulisGagal = [];

    try {
        $db->beginTransaction();
        foreach ($valid as $baris) {
            $antara->execute([$baris['judul']]);
            $sudahAda = ((int) $antara->fetchColumn()) > 0;
            $antara->closeCursor();
            $upsert->execute([$baris['judul'], $baris['kategori'], $baris['konten'], $baris['tags'], $baris['sumber']]);
            $disimpan++;
            if (!$sudahAda) {
                $baru++;
            }
        }
        $db->commit();
    } catch (PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        error_log('[SMKN24] import knowledge gagal: ' . $e->getMessage());
        jsonError('Penulisan ke knowledge gagal: ' . $e->getMessage(), 500);
    }

    $total = (int) $db->query('SELECT COUNT(*) FROM knowledge')->fetchColumn();
    jsonResponse([
        'dibaca' => count($rows),
        'tersimpan' => $disimpan,
        'baru' => $baru,
        'diperbarui' => $disimpan - $baru,
        'gagal' => $tulisGagal,
        'catatan' => $catatan,
        'total' => $total,
        'file' => $namaAsli,
    ]);
}

/** Sampel konten untuk pratinjau UI: potong biaya jaringan gede. */
function knowledge_barisPreview(array $baris): array
{
    $potongan = mb_substr($baris['konten'], 0, 220);
    return [
        'judul' => $baris['judul'],
        'kategori' => $baris['kategori'],
        'potongan' => $potongan . (mb_strlen($baris['konten']) > 220 ? '…' : ''),
        'tags' => $baris['tags'],
        'sumber' => $baris['sumber'],
    ];
}

/** PUT JSON: ubah satu entri manual (mis. admin membetulkan kategori). */
function handleUpdate(PDO $db): void
{
    $body = getJsonBody();
    $id = (int) ($body['id'] ?? 0);
    if ($id <= 0) {
        jsonError('id wajib diisi', 400);
    }
    $stmt = $db->prepare('SELECT id FROM knowledge WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonError('Entri tidak ditemukan', 404);
    }

    $judul = trim((string) ($body['judul'] ?? ''));
    $konten = trim((string) ($body['konten'] ?? ''));
    $kategori = trim((string) ($body['kategori'] ?? 'Umum')) ?: 'Umum';
    $tags = trim((string) ($body['tags'] ?? ''));
    $sumber = trim((string) ($body['sumber'] ?? ''));
    if ($judul === '' || $konten === '') {
        jsonError('Judul dan konten wajib diisi', 400);
    }
    if (!in_array($kategori, KATEGORI_KNOWLEDGE, true)) {
        jsonError("Kategori '{$kategori}' tidak dikenali (pilih salah satu: " . implode(', ', KATEGORI_KNOWLEDGE) . ').', 400);
    }
    if (knowledge_utf8Len($judul) > 255 || knowledge_utf8Len($tags) > 255 || knowledge_utf8Len($sumber) > 255) {
        jsonError('Judul/tags/sumber melebihi 255 karakter', 400);
    }
    if (knowledge_utf8Len($konten) > 65000) {
        jsonError('Konten melebihi batas TEXT (65.000 karakter)', 400);
    }

    // Unik judul: bila judul kodok sama seperti entri lain -> bentrok.
    $dupStmt = $db->prepare('SELECT id FROM knowledge WHERE judul = ? AND id <> ?');
    $dupStmt->execute([$judul, $id]);
    if ($dupStmt->fetch()) {
        jsonError('Judul sudah dipakai entri lain', 409);
    }

    $stmt = $db->prepare(
        'UPDATE knowledge SET judul = ?, kategori = ?, konten = ?, tags = ?, sumber = ? WHERE id = ?'
    );
    $stmt->execute([$judul, $kategori, $konten, $tags, $sumber, $id]);
    jsonResponse(['ok' => true]);
}

/** DELETE: hapus satu entri. */
function handleDelete(PDO $db): void
{
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        jsonError('id wajib diisi', 400);
    }
    $stmt = $db->prepare('DELETE FROM knowledge WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        jsonError('Entri tidak ditemukan', 404);
    }
    jsonResponse(['ok' => true]);
}
