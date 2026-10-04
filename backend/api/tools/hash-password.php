<?php
/**
 * Generator hash password untuk akun admin. Hanya untuk CLI.
 *
 * Pemakaian:
 *   php tools/hash-password.php "PasswordBaruYangKuat"
 *
 * Hasilnya dapat dipakai untuk UPDATE manual pada tabel admin_users, atau lebih
 * praktis gunakan tools/create-admin.php yang langsung menulis ke database.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Script ini hanya dapat dijalankan dari command line.');
}

$password = $argv[1] ?? '';

if ($password === '') {
    fwrite(STDERR, "Pemakaian: php tools/hash-password.php \"PasswordBaru\"\n");
    exit(1);
}

if (strlen($password) < 8) {
    fwrite(STDERR, "Password minimal 8 karakter.\n");
    exit(1);
}

fwrite(STDOUT, password_hash($password, PASSWORD_BCRYPT) . PHP_EOL);
