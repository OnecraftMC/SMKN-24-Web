<?php
/**
 * GET /api/bk/media/index.php?file=<server-generated-name>
 * Privately serves evidence files to authenticated dashboard users.
 */
require_once __DIR__ . '/../../../bootstrap.php';

requireMethod('GET');
requireAuth();

$file = (string)($_GET['file'] ?? '');
if (!preg_match('/^[a-f0-9]{32}\.(jpg|png|webp|webm|ogg|m4a|mp3|wav)$/', $file)) {
    jsonError('Lampiran tidak ditemukan.', 404);
}

$path = privateBKUploadDirectory() . $file;
if (!is_file($path) || !is_readable($path)) {
    jsonError('Lampiran tidak ditemukan.', 404);
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = $finfo === false ? false : finfo_file($finfo, $path);
if ($finfo !== false) {
    finfo_close($finfo);
}
$allowed = [
    'image/jpeg', 'image/png', 'image/webp',
    'audio/webm', 'video/webm', 'audio/ogg', 'audio/mp4', 'video/mp4', 'audio/mpeg',
    'audio/wav', 'audio/x-wav', 'application/ogg',
];
if (!is_string($mime) || !in_array($mime, $allowed, true)) {
    jsonError('Format lampiran tidak didukung.', 415);
}

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($path));
header('Content-Disposition: inline; filename="lampiran-bk"');
header('Cache-Control: private, no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
readfile($path);
exit;
