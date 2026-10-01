<?php
/**
 * Menguji koneksi database memakai kredensial dari .env. Hanya untuk CLI.
 *
 * Pemakaian:
 *   php tools/check-db.php
 *
 * Berhasil: menampilkan versi server MySQL, nama database, dan host tujuan.
 * Gagal: menampilkan penyebab dari PDO (host/port salah, Remote MySQL Hostinger
 * belum meng-whitelist IP Anda, user/password salah, atau nama database keliru).
 *
 * Catatan: sengaja TIDAK memakai getDB() supaya penyebab kegagalan tampil jelas
 * di layar, bukan sebagai response JSON untuk endpoint.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Script ini hanya dapat dijalankan dari command line.');
}

require_once __DIR__ . '/../config/database.php';

fwrite(STDOUT, 'Menguji koneksi ke ' . DB_HOST . ':' . DB_PORT . ' (db: ' . DB_NAME . ')...' . PHP_EOL);

try {
    $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        // 10 detik: jangan menggantung bila host/port ditakifsir firewall.
        PDO::ATTR_TIMEOUT => 10,
    ]);
} catch (PDOException $e) {
    fwrite(STDERR, 'Koneksi GAGAL: ' . $e->getMessage() . PHP_EOL);
    fwrite(STDERR, 'Periksa: host & port, whitelist Remote MySQL Hostinger (IP publik Anda), '
        . 'user/password, dan nama database.' . PHP_EOL);
    exit(1);
}

$version = $pdo->query('SELECT VERSION() AS v')->fetch();
$tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

fwrite(STDOUT, 'Koneksi BERHASIL.' . PHP_EOL);
fwrite(STDOUT, 'Server MySQL : ' . ($version['v'] ?? '(tidak diketahui)') . PHP_EOL);
fwrite(STDOUT, 'Database     : ' . DB_NAME . PHP_EOL);
fwrite(STDOUT, 'Host         : ' . DB_HOST . ':' . DB_PORT . PHP_EOL);
fwrite(STDOUT, 'Jumlah tabel : ' . count($tables) . PHP_EOL);

foreach ($tables as $table) {
    fwrite(STDOUT, '  - ' . $table . PHP_EOL);
}

if (count($tables) === 0) {
    fwrite(STDOUT, 'Database masih kosong. Import backend/database.sql lewat phpMyAdmin.' . PHP_EOL);
}

