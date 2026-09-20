<?php
/**
 * File ini di-include di setiap endpoint untuk memuat semua dependency dasar.
 */

error_reporting(E_ALL);
ini_set('display_errors', '0'); // matikan tampilan error langsung ke user di production

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/cors.php';
require_once __DIR__ . '/helpers/jwt.php';
require_once __DIR__ . '/helpers/upload.php';

applyCors();

set_exception_handler(function (Throwable $e) {
    jsonError('Terjadi kesalahan pada server', 500, [
        'detail' => $e->getMessage(),
    ]);
});
