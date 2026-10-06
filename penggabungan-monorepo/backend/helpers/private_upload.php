<?php

/**
 * Store sensitive documents outside the web root. The directory can be overridden
 * by PRIVATE_UPLOAD_DIR in backend/.env when the hosting layout requires it.
 */
function privateUploadDirectory(): string
{
    $documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    $configured = env('PRIVATE_UPLOAD_DIR');
    $directory = is_string($configured) && trim($configured) !== ''
        ? trim($configured)
        : (($documentRoot !== false ? dirname($documentRoot) : dirname(__DIR__, 2))
            . DIRECTORY_SEPARATOR . '.smkn24-private-uploads');

    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        jsonError('Penyimpanan dokumen privat belum dapat disiapkan.', 500);
    }

    $realDirectory = realpath($directory);
    if ($realDirectory === false) {
        jsonError('Penyimpanan dokumen privat tidak tersedia.', 500);
    }
    if (!chmod($realDirectory, 0700)) {
        jsonError('Izin penyimpanan dokumen privat tidak dapat dibatasi.', 500);
    }

    if ($documentRoot !== false) {
        $root = rtrim($documentRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        $candidate = rtrim($realDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        if (str_starts_with(strtolower($candidate), strtolower($root))) {
            jsonError('Penyimpanan dokumen harus berada di luar document root.', 500);
        }
    }

    return rtrim($realDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
}

function privateBKUploadDirectory(): string
{
    $directory = privateUploadDirectory() . 'bk-evidence' . DIRECTORY_SEPARATOR;
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        jsonError('Penyimpanan bukti BK belum dapat disiapkan.', 500);
    }
    $realDirectory = realpath($directory);
    if ($realDirectory === false || !chmod($realDirectory, 0700)) {
        jsonError('Penyimpanan bukti BK tidak tersedia.', 500);
    }
    return rtrim($realDirectory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
}

/**
 * Validate and store a single uploaded file. Returns only server-generated keys
 * and sanitized display metadata; never use the submitted filename as a path.
 */
function storePrivateUpload(string $field, array $allowedExtensions): ?array
{
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $file = $_FILES[$field];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $status = in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 413 : 400;
        jsonError('Unggahan gagal diterima. Periksa ukuran file dan coba lagi.', $status);
    }

    if (!is_uploaded_file($file['tmp_name']) || $file['size'] < 1 || $file['size'] > 10 * 1024 * 1024) {
        jsonError('File tidak valid atau melebihi batas 10 MB.', 413);
    }

    $originalName = str_replace('\\', '/', (string)$file['name']);
    $originalName = basename($originalName);
    $originalName = preg_replace('/[\x00-\x1F\x7F]/u', '', $originalName) ?? '';
    $originalName = trim($originalName);
    if ($originalName === '' || strlen($originalName) > 180) {
        jsonError('Nama file tidak valid.', 400);
    }

    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    if (!array_key_exists($extension, $allowedExtensions)) {
        jsonError('Format file tidak didukung.', 400);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo === false) {
        jsonError('Validasi tipe file tidak tersedia di server.', 500);
    }
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!is_string($mime) || !in_array($mime, $allowedExtensions[$extension], true)) {
        jsonError('Isi file tidak sesuai dengan format yang diizinkan.', 400);
    }

    validatePrivateUploadContents($extension, $file['tmp_name']);

    $storedName = bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = privateUploadDirectory() . $storedName;
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        jsonError('File lolos validasi tetapi gagal disimpan.', 500);
    }
    if (!chmod($destination, 0600)) {
        if (!unlink($destination)) {
            error_log('[SMKN24] File privat gagal dihapus setelah pengaturan izin gagal.');
        }
        jsonError('Izin file privat tidak dapat dibatasi.', 500);
    }

    return [
        'storedName' => $storedName,
        'originalName' => $originalName,
        'mime' => $mime,
        'size' => (int)$file['size'],
    ];
}

function validatePrivateUploadContents(string $extension, string $temporaryPath): void
{
    if ($extension === 'pdf') {
        $handle = fopen($temporaryPath, 'rb');
        $signature = $handle === false ? false : fread($handle, 5);
        if (is_resource($handle)) {
            fclose($handle);
        }
        if ($signature !== '%PDF-') {
            jsonError('File PDF tidak memiliki tanda tangan PDF yang valid.', 400);
        }
        return;
    }

    if ($extension === 'jpg' || $extension === 'jpeg' || $extension === 'png') {
        $image = @getimagesize($temporaryPath);
        $expectedType = $extension === 'png' ? IMAGETYPE_PNG : IMAGETYPE_JPEG;
        if ($image === false || $image[2] !== $expectedType) {
            jsonError('File gambar tidak valid.', 400);
        }
        return;
    }

    if ($extension !== 'docx') {
        jsonError('Format file tidak didukung.', 400);
    }

    try {
        $archive = new PharData($temporaryPath);
        $seenContentTypes = false;
        $seenDocument = false;
        $expandedSize = 0;
        $entryCount = 0;

        foreach (new RecursiveIteratorIterator($archive) as $entry) {
            if (!$entry->isFile()) {
                continue;
            }
            $path = strtolower(str_replace('\\', '/', $entry->getPathName()));
            if (str_contains($path, '/../') || str_contains($path, '/vbaproject.bin')) {
                jsonError('Dokumen DOCX berisi path atau konten yang tidak diizinkan.', 400);
            }
            $seenContentTypes = $seenContentTypes || str_ends_with($path, '/[content_types].xml');
            $seenDocument = $seenDocument || str_ends_with($path, '/word/document.xml');
            $expandedSize += $entry->getSize();
            $entryCount += 1;

            if ($expandedSize > 25 * 1024 * 1024 || $entryCount > 500) {
                jsonError('Isi DOCX melebihi batas keamanan.', 400);
            }
        }
    } catch (Throwable $error) {
        jsonError('File DOCX bukan paket Office Open XML yang valid.', 400);
    }

    if (!$seenContentTypes || !$seenDocument) {
        jsonError('File DOCX bukan dokumen Word yang valid.', 400);
    }
}

function deletePrivateUpload(?string $storedName): bool
{
    if ($storedName === null || !preg_match('/\A[a-f0-9]{32}\.(pdf|docx|jpg|jpeg|png)\z/', $storedName)) {
        return $storedName === null;
    }

    $path = privateUploadDirectory() . $storedName;
    return !file_exists($path) || (is_file($path) && unlink($path));
}

function enforceSubmissionRateLimit(string $scope, int $limit, int $windowSeconds): void
{
    $directory = privateUploadDirectory() . 'rate-limits' . DIRECTORY_SEPARATOR;
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        jsonError('Pembatasan pengajuan tidak tersedia saat ini.', 503);
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = hash_hmac('sha256', $scope . ':' . $ip, JWT_SECRET);
    $handle = fopen($directory . $key . '.json', 'c+');
    if ($handle === false || !flock($handle, LOCK_EX)) {
        if (is_resource($handle)) fclose($handle);
        jsonError('Pembatasan pengajuan tidak tersedia saat ini.', 503);
    }
    chmod($directory . $key . '.json', 0600);

    $contents = stream_get_contents($handle);
    $timestamps = $contents === '' ? [] : json_decode($contents, true);
    if (!is_array($timestamps)) {
        flock($handle, LOCK_UN);
        fclose($handle);
        jsonError('Data pembatasan pengajuan tidak dapat dibaca.', 503);
    }

    $now = time();
    $timestamps = array_values(array_filter(
        $timestamps,
        static fn($timestamp) => is_int($timestamp) && $timestamp > $now - $windowSeconds
    ));
    if (count($timestamps) >= $limit) {
        $retryAfter = max(1, $timestamps[0] + $windowSeconds - $now);
        flock($handle, LOCK_UN);
        fclose($handle);
        header('Retry-After: ' . $retryAfter);
        jsonError('Batas pengajuan sementara tercapai. Silakan coba lagi nanti.', 429);
    }

    $timestamps[] = $now;
    $encoded = json_encode($timestamps);
    if ($encoded === false || !rewind($handle) || !ftruncate($handle, 0)) {
        flock($handle, LOCK_UN);
        fclose($handle);
        jsonError('Status pembatasan pengajuan gagal disimpan.', 503);
    }
    $written = fwrite($handle, $encoded);
    if ($written !== strlen($encoded) || !fflush($handle)) {
        flock($handle, LOCK_UN);
        fclose($handle);
        jsonError('Status pembatasan pengajuan gagal disimpan.', 503);
    }
    flock($handle, LOCK_UN);
    fclose($handle);
}

function sendPrivateDownload(string $storedName, string $originalName, string $mime): void
{
    if (!preg_match('/\A[a-f0-9]{32}\.(pdf|docx|jpg|jpeg|png)\z/', $storedName)) {
        jsonError('File tidak ditemukan.', 404);
    }

    $directory = privateUploadDirectory();
    $path = $directory . $storedName;
    $realPath = realpath($path);
    if ($realPath === false || dirname($realPath) !== rtrim($directory, DIRECTORY_SEPARATOR) || !is_file($realPath)) {
        jsonError('File tidak ditemukan.', 404);
    }

    $fallbackName = preg_replace('/[^A-Za-z0-9._-]/', '_', $originalName) ?: 'dokumen';
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($realPath));
    header('Content-Disposition: attachment; filename="' . $fallbackName . '"; filename*=UTF-8\'\'' . rawurlencode($originalName));
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-store');
    readfile($realPath);
    exit;
}
