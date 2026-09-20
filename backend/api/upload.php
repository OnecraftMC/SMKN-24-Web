<?php
/**
 * Endpoint generik upload gambar (dipakai form admin: berita, galeri, dll).
 * POST multipart/form-data dengan field "gambar" -> mengembalikan { url }
 * Butuh login admin.
 */

require_once __DIR__ . '/../bootstrap.php';

requireMethod('POST');
requireAuth();

$url = handleImageUpload('gambar');

if (!$url) {
    jsonError('Tidak ada file yang diunggah', 400);
}

jsonResponse(['url' => $url]);
