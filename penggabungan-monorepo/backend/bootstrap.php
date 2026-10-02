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
    // Detail teknis hanya masuk ke log server — jangan dibocorkan ke klien.
    error_log('[SMKN24] ' . get_class($e) . ': ' . $e->getMessage()
        . ' @ ' . $e->getFile() . ':' . $e->getLine());
    jsonError('Terjadi kesalahan pada server', 500);
});

// Di produksi, rahasia wajib diisi. Jangan pernah melayani request dengan nilai default.
if (APP_ENV === 'production') {
    if (JWT_SECRET === '' || str_starts_with(JWT_SECRET, 'ganti-dengan-secret')) {
        error_log('[SMKN24] JWT_SECRET belum diisi di .env — server menolak melayani request.');
        jsonError('Konfigurasi server belum lengkap. Hubungi administrator.', 500);
    }
}
