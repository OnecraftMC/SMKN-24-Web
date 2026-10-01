<?php
/**
 * Konfigurasi koneksi database MySQL (PDO).
 *
 * Nilai dibaca dari file .env di folder backend (lihat .env.example), sehingga
 * berpindah antara database lokal (XAMPP/Laragon) dan database hosting
 * (misalnya Hostinger) cukup dengan mengubah .env tanpa menyentuh kode.
 */

require_once __DIR__ . '/env.php';
loadEnv(__DIR__ . '/../.env');

// Hostinger:
//   - DB_HOST = hostname MySQL dari hPanel > Remote MySQL (bukan URL phpMyAdmin),
//     atau "localhost" bila PHP ini berjalan di hosting yang sama dengan database.
//   - DB_PORT = 3306 (port default remote MySQL Hostinger).
//   - DB_NAME / DB_USER memakai awalan akun, contoh:
//     u104889167_admin_dash_24 / u104889167_admin24.
define('DB_HOST', env('DB_HOST', 'localhost'));
define('DB_PORT', env('DB_PORT', '3306'));
define('DB_NAME', env('DB_NAME', 'smkn24'));
define('DB_USER', env('DB_USER', 'root'));
define('DB_PASS', env('DB_PASS', ''));
define('DB_CHARSET', env('DB_CHARSET', 'utf8mb4'));

function getDB(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Detail teknis hanya ke log server (dapat memuat host/driver/nama database).
            error_log('[SMKN24] Koneksi database gagal: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Koneksi database gagal']);
            exit;
        }
    }

    return $pdo;
}

