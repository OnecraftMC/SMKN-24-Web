<?php
require_once __DIR__ . '/../config/config.php';

/**
 * Menangani upload file gambar dari form-data ($_FILES['gambar']).
 * Return URL publik file, atau null jika tidak ada file di-upload.
 */
function handleImageUpload(string $fieldName = 'gambar'): ?string
{
    if (!isset($_FILES[$fieldName]) || $_FILES[$fieldName]['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $file = $_FILES[$fieldName];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        jsonError('Gagal mengunggah gambar (kode error: ' . $file['error'] . ')', 400);
    }

    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mime, $allowedTypes, true)) {
        jsonError('Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.', 400);
    }

    $maxSize = 5 * 1024 * 1024; // 5 MB
    if ($file['size'] > $maxSize) {
        jsonError('Ukuran file maksimal 5MB.', 400);
    }

    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = bin2hex(random_bytes(16)) . '.' . strtolower($ext);
    $destination = UPLOAD_DIR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        jsonError('Gagal menyimpan file di server.', 500);
    }

    return UPLOAD_URL_BASE . $filename;
}
