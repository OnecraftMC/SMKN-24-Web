<?php
require_once __DIR__ . '/../../bootstrap.php';

requireMethod('POST');

$body = getJsonBody();
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if ($username === '' || $password === '') {
    jsonError('Username dan password wajib diisi.', 400);
}

$db = getDB();
$stmt = $db->prepare('SELECT * FROM admin_users WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    jsonError('Username atau password salah.', 401);
}

$token = generateJwt([
    'sub' => $user['id'],
    'username' => $user['username'],
    'role' => $user['role'],
]);

jsonResponse([
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'nama' => $user['nama'],
        'role' => $user['role'],
    ],
]);
