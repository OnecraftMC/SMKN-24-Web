<?php
/**
 * Membuat atau memperbarui akun admin. Hanya untuk CLI.
 *
 * Pemakaian:
 *   php tools/create-admin.php <username> <password> [nama]
 *
 * Contoh:
 *   php tools/create-admin.php admin "PasswordKuat#2026" "Administrator Sekolah"
 *
 * Menggunakan password_hash() (bcrypt) sehingga hash selalu benar dan terverifikasi
 * oleh password_verify() di api/auth/login.php.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Script ini hanya dapat dijalankan dari command line.');
}

require_once __DIR__ . '/../config/database.php';

$username = trim($argv[1] ?? '');
$password = $argv[2] ?? '';
$nama = trim($argv[3] ?? 'Administrator');

if ($username === '' || $password === '') {
    fwrite(STDERR, "Pemakaian: php tools/create-admin.php <username> <password> [nama]\n");
    exit(1);
}

if (strlen($password) < 8) {
    fwrite(STDERR, "Password minimal 8 karakter.\n");
    exit(1);
}

$db = getDB();
$stmt = $db->prepare(
    'INSERT INTO admin_users (username, password, nama, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password = VALUES(password), nama = VALUES(nama), role = VALUES(role)'
);
$stmt->execute([$username, password_hash($password, PASSWORD_BCRYPT), $nama, 'admin']);

fwrite(STDOUT, "Akun admin '$username' berhasil dibuat/diperbarui.\n");
