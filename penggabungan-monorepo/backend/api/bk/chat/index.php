<?php
/**
 * POST /api/bk/chat/index.php -> balasan percakapan AI atau finalisasi laporan BK.
 */
require_once __DIR__ . '/../../../bootstrap.php';

requireMethod('POST');

$isMultipart = str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data');
$body = $isMultipart
    ? (json_decode((string)($_POST['payload'] ?? ''), true) ?? [])
    : getJsonBody();

$messages = $body['messages'] ?? null;
if (!is_array($messages) || $messages === []) {
    jsonError("Field 'messages' wajib diisi dan tidak boleh kosong", 400);
}

$mode = $body['mode'] ?? 'finalize';
if (!in_array($mode, ['chat', 'finalize'], true)) {
    jsonError('Mode percakapan tidak valid.', 400);
}

$studentTexts = [];
$conversation = [];
$transcript = [];
if (count($messages) > 50) {
    jsonError('Percakapan terlalu panjang untuk dikirim.', 400);
}
$totalTextBytes = 0;
foreach ($messages as $message) {
    if (!is_array($message)) {
        jsonError('Format pesan tidak valid.', 400);
    }
    $role = $message['role'] ?? $message['sender'] ?? '';
    $text = is_string($message['text'] ?? null) ? trim($message['text']) : '';
    if (!in_array($role, ['user', 'bot'], true) || $text === '') {
        continue;
    }
    if (strlen($text) > 4000) {
        jsonError('Pesan terlalu panjang.', 400);
    }
    $totalTextBytes += strlen($text);
    if ($totalTextBytes > 8000) {
        jsonError('Percakapan terlalu panjang. Ringkas sebagian lalu coba lagi.', 400);
    }

    if ($role === 'user') {
        $studentTexts[] = $text;
    }
    $conversation[] = [
        'role' => $role === 'user' ? 'user' : 'assistant',
        'content' => $text,
    ];
    $transcript[] = ['sender' => $role, 'text' => $text];
}

if ($mode === 'chat') {
    if ($studentTexts === [] || end($conversation)['role'] !== 'user') {
        jsonError('Kirim pesan sebelum meminta balasan konselor.', 400);
    }

    try {
        $reply = callAiProvider(
            array_merge(
                [['role' => 'system', 'content' => AI_BK_CONVERSATION_SYSTEM_PROMPT]],
                array_slice($conversation, -16),
            ),
            array_merge(aiFeatureOptions('bk'), ['max_tokens' => 350]),
        );
        if ($reply === '') {
            throw new RuntimeException('AI BK mengembalikan balasan kosong.');
        }
        jsonResponse(['message' => $reply]);
    } catch (Throwable $e) {
        error_log('[SMKN24] Balasan percakapan AI BK gagal: ' . $e->getMessage());
        jsonError('Konselor AI belum dapat membalas. Pesanmu belum terkirim; coba lagi.', 503);
    }
}

$photos = $_FILES['photos'] ?? null;
if ($photos !== null && (!is_array($photos) || !is_array($photos['name'] ?? null))) {
    jsonError('Format unggahan foto tidak valid.', 400);
}
$photoCount = is_array($photos) ? count($photos['name']) : 0;
$hasAudio = isset($_FILES['audio']) && $_FILES['audio']['error'] !== UPLOAD_ERR_NO_FILE;
if ($photoCount > 2) {
    jsonError('Maksimal dua foto bukti.', 400);
}
if ($studentTexts === [] && $photoCount === 0 && !$hasAudio) {
    jsonError('Ceritakan masalah atau lampirkan foto/pesan suara.', 400);
}

if ($photoCount > 0) {
    $studentTexts[] = '[Pengadu melampirkan foto bukti untuk ditinjau Guru BK.]';
}
if ($hasAudio) {
    $studentTexts[] = '[Pengadu melampirkan pesan suara; audio perlu didengarkan Guru BK.]';
}

$nama = is_string($body['nama'] ?? null) ? trim($body['nama']) : '';
$kelas = is_string($body['kelas'] ?? null) ? trim($body['kelas']) : '';
$deviceId = is_string($body['deviceId'] ?? null) ? trim($body['deviceId']) : '';
if ($deviceId !== '' && !preg_match('/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}$/i', $deviceId)) {
    $deviceId = '';
}

$story = implode("\n", $studentTexts);
$storedUploads = storeBKChatUploads();
$ringkasan = null;
$kategori = null;
$tingkat = null;
$butuhPerhatian = false;

try {
    $messagesAi = [
        ['role' => 'system', 'content' => AI_BK_SYSTEM_PROMPT],
        ['role' => 'user', 'content' => "Ringkas laporan berikut untuk Guru BK:\n\n" . $story],
    ];
    $data = extractJsonObject(callAiProvider($messagesAi, aiFeatureOptions('bk')));
    if ($data !== null) {
        $ringkasan = trim($data['ringkasan'] ?? '') ?: null;
        $kategori = normaliseKategori($data['kategori'] ?? '');
        $tingkat = normaliseTingkat($data['tingkat_kesulitan'] ?? '');
        $butuhPerhatian = !empty($data['butuh_perhatian']);
    } else {
        error_log('[SMKN24] AI BK tidak mengembalikan JSON yang valid.');
        $ringkasan = fallbackRingkasan($studentTexts);
    }
} catch (Throwable $e) {
    error_log('[SMKN24] AI BK gagal merangkum laporan: ' . $e->getMessage());
    $ringkasan = fallbackRingkasan($studentTexts);
}

$db = null;
try {
    $db = getDB();
    $db->beginTransaction();
    $stmt = $db->prepare(
        'INSERT INTO pesan_bk
            (nama, kelas, no_hp, keperluan, pesan, ringkasan, tingkat_kesulitan, kategori,
             butuh_perhatian, transkrip, device_id, media_json)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $nama !== '' ? $nama : 'Anonim',
        $kelas !== '' ? $kelas : '-',
        'Konsultasi melalui AI',
        $story,
        $ringkasan,
        $tingkat,
        $kategori,
        $butuhPerhatian ? 1 : 0,
        json_encode($transcript, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        $deviceId !== '' ? $deviceId : null,
        json_encode($storedUploads, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
    $id = (int)$db->lastInsertId();
    $db->commit();
} catch (Throwable $e) {
    if ($db instanceof PDO && $db->inTransaction()) {
        $db->rollBack();
    }
    foreach ($storedUploads as $upload) {
        $path = privateBKUploadDirectory() . $upload['storedName'];
        if (is_file($path) && !unlink($path)) {
            error_log('[SMKN24] Gagal membersihkan lampiran BK yang tidak tersimpan.');
        }
    }
    throw $e;
}

jsonResponse(['message' => 'Percakapan berhasil dikirim ke Guru BK.', 'id' => $id], 201);

function storeBKChatUploads(): array
{
    $pending = [];
    $photoFiles = $_FILES['photos'] ?? null;
    if (is_array($photoFiles)) {
        foreach (($photoFiles['name'] ?? []) as $index => $name) {
            $error = $photoFiles['error'][$index] ?? UPLOAD_ERR_NO_FILE;
            if ($error !== UPLOAD_ERR_OK) {
                jsonError('Foto bukti gagal diunggah.', 400);
            }
            $tmpName = $photoFiles['tmp_name'][$index] ?? '';
            $size = (int)($photoFiles['size'][$index] ?? 0);
            if (!is_uploaded_file($tmpName) || $size < 1 || $size > 5 * 1024 * 1024) {
                jsonError('Setiap foto bukti maksimal 5 MB.', 413);
            }
            $mime = detectBKUploadMime($tmpName);
            $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
            if (!isset($extensions[$mime]) || @getimagesize($tmpName) === false) {
                jsonError('Bukti harus berupa foto JPG, PNG, atau WEBP.', 400);
            }
            $pending[] = [$tmpName, $extensions[$mime], $mime, $size, 'Foto bukti'];
        }
    }

    if (isset($_FILES['audio']) && $_FILES['audio']['error'] !== UPLOAD_ERR_NO_FILE) {
        $audio = $_FILES['audio'];
        if ($audio['error'] !== UPLOAD_ERR_OK) {
            jsonError('Pesan suara gagal diunggah.', 400);
        }
        $size = (int)$audio['size'];
        if (!is_uploaded_file($audio['tmp_name']) || $size < 1 || $size > 10 * 1024 * 1024) {
            jsonError('Pesan suara maksimal 10 MB.', 413);
        }
        $mime = detectBKUploadMime($audio['tmp_name']);
        $mime = [
            'video/webm' => 'audio/webm',
            'video/mp4' => 'audio/mp4',
            'video/ogg' => 'audio/ogg',
        ][$mime] ?? $mime;
        $extensions = [
            'audio/webm' => 'webm',
            'audio/ogg' => 'ogg',
            'audio/mp4' => 'm4a',
            'audio/mpeg' => 'mp3',
            'audio/wav' => 'wav',
            'application/ogg' => 'ogg',
        ];
        if (!isset($extensions[$mime])) {
            jsonError('Format pesan suara tidak didukung browser/server ini.', 400);
        }
        $pending[] = [$audio['tmp_name'], $extensions[$mime], $mime, $size, 'Pesan suara'];
    }

    $uploads = [];
    $directory = privateBKUploadDirectory();
    try {
        foreach ($pending as [$tmpName, $extension, $mime, $size, $label]) {
            $uploads[] = moveBKUpload($tmpName, $directory, $extension, $mime, $size, $label);
        }
    } catch (Throwable $error) {
        foreach ($uploads as $upload) {
            $path = $directory . $upload['storedName'];
            if (is_file($path) && !unlink($path)) {
                error_log('[SMKN24] Gagal membersihkan unggahan BK parsial.');
            }
        }
        throw $error;
    }
    return $uploads;
}

function detectBKUploadMime(string $path): string
{
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo === false) {
        jsonError('Validasi tipe media tidak tersedia di server.', 500);
    }
    $mime = finfo_file($finfo, $path);
    finfo_close($finfo);
    return is_string($mime) ? $mime : '';
}

function moveBKUpload(string $tmpName, string $directory, string $extension, string $mime, int $size, string $label): array
{
    $storedName = bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = $directory . $storedName;
    if (!move_uploaded_file($tmpName, $destination)) {
        throw new RuntimeException('File media lolos validasi tetapi gagal disimpan.');
    }
    if (!chmod($destination, 0600)) {
        if (!unlink($destination)) {
            error_log('[SMKN24] File BK gagal dibersihkan setelah pengaturan izin gagal.');
        }
        throw new RuntimeException('Izin file media tidak dapat dibatasi.');
    }
    return [
        'storedName' => $storedName,
        'mime' => $mime,
        'size' => $size,
        'label' => $label,
    ];
}

function normaliseTingkat($value): ?string
{
    $map = ['ringan' => 'Ringan', 'sedang' => 'Sedang', 'berat' => 'Berat'];
    return $map[strtolower(trim((string)$value))] ?? null;
}

function normaliseKategori($value): ?string
{
    $allowed = ['Akademik', 'Sosial', 'Keluarga', 'Ekonomi', 'Kecemasan', 'Kekerasan', 'Lainnya'];
    foreach ($allowed as $category) {
        if (strcasecmp(trim((string)$value), $category) === 0) {
            return $category;
        }
    }
    return 'Lainnya';
}

function fallbackRingkasan(array $studentTexts): string
{
    $text = trim(preg_replace('/\s+/', ' ', implode(' ', $studentTexts)) ?? '');
    if (strlen($text) > 300) {
        $text = substr($text, 0, 297) . '...';
    }
    return $text !== '' ? 'Siswa melaporkan: ' . $text : 'Siswa mengirim laporan melalui konselor AI.';
}
