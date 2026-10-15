<?php
require_once __DIR__ . '/../../../bootstrap.php';
require_once __DIR__ . '/../../../helpers/canteen.php';
requireMethod('POST');
$body = getJsonBody();
$db = getDB();
$action = $body['action'] ?? 'login';

if ($action === 'login') {
    $username = trim((string)($body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');
    $query = $db->prepare('SELECT u.id, u.stand_id, u.username, u.password_hash, u.full_name, u.must_change_password, u.is_active, s.name AS stand_name FROM canteen_users u JOIN canteen_stands s ON s.id = u.stand_id WHERE u.username = ? LIMIT 1');
    $query->execute([$username]);
    $user = $query->fetch();
    if (!$user || !(int)$user['is_active'] || !password_verify($password, $user['password_hash'])) {
        jsonError('Nama pengguna atau kata sandi salah.', 401);
    }
    $db->prepare('UPDATE canteen_users SET last_login_at = NOW() WHERE id = ?')->execute([(int)$user['id']]);
    $token = generateCanteenSellerToken(['sub' => (int)$user['id'], 'stand_id' => (int)$user['stand_id']]);
    jsonResponse([
        'token' => $token,
        'mustChangePassword' => (bool)$user['must_change_password'],
        'user' => ['id' => (int)$user['id'], 'username' => $user['username'], 'fullName' => $user['full_name'], 'standId' => (int)$user['stand_id'], 'standName' => $user['stand_name']],
    ]);
}

if ($action === 'change_password') {
    $claims = requireCanteenSeller();
    $current = (string)($body['currentPassword'] ?? '');
    $new = (string)($body['newPassword'] ?? '');
    if (strlen($new) < 10 || strlen($new) > 128) jsonError('Kata sandi baru harus 10–128 karakter.', 422);
    $query = $db->prepare('SELECT password_hash FROM canteen_users WHERE id = ? AND is_active = 1');
    $query->execute([(int)$claims['sub']]);
    $user = $query->fetch();
    if (!$user || !password_verify($current, $user['password_hash'])) jsonError('Kata sandi saat ini tidak sesuai.', 401);
    $db->prepare('UPDATE canteen_users SET password_hash = ?, must_change_password = 0 WHERE id = ?')
        ->execute([password_hash($new, PASSWORD_DEFAULT), (int)$claims['sub']]);
    jsonResponse(['updated' => true]);
}
jsonError('Aksi tidak dikenali.', 400);
