<?php
require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../helpers/canteen.php';
requireCanteenAdmin();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $resource = $_GET['resource'] ?? 'stands';
    if ($resource === 'stands') {
        $rows = $db->query('SELECT s.*, (SELECT COUNT(*) FROM canteen_users u WHERE u.stand_id = s.id AND u.is_active = 1) AS seller_count, (SELECT COUNT(*) FROM canteen_menu_items m WHERE m.stand_id = s.id) AS menu_count FROM canteen_stands s ORDER BY s.id DESC')->fetchAll();
        foreach ($rows as &$row) { $row['id'] = (int)$row['id']; $row['is_active'] = (int)$row['is_active']; $row['seller_count'] = (int)$row['seller_count']; $row['menu_count'] = (int)$row['menu_count']; }
        unset($row);
        jsonResponse(['stands' => $rows]);
    }
    if ($resource === 'sellers') {
        $rows = $db->query('SELECT u.id, u.stand_id AS standId, s.name AS standName, u.username, u.full_name AS fullName, u.is_active AS isActive, u.must_change_password AS mustChangePassword, u.last_login_at AS lastLoginAt FROM canteen_users u JOIN canteen_stands s ON s.id = u.stand_id ORDER BY u.id DESC')->fetchAll();
        foreach ($rows as &$row) { $row['id'] = (int)$row['id']; $row['standId'] = (int)$row['standId']; $row['isActive'] = (int)$row['isActive']; $row['mustChangePassword'] = (int)$row['mustChangePassword']; }
        unset($row);
        jsonResponse(['sellers' => $rows]);
    }
    if ($resource === 'menu') {
        $rows = $db->query('SELECT m.id, m.stand_id AS standId, s.name AS standName, m.name, m.description, m.category, m.price, m.image_url AS imageUrl, m.is_available AS isAvailable, m.sort_order AS sortOrder FROM canteen_menu_items m JOIN canteen_stands s ON s.id = m.stand_id ORDER BY s.name, m.sort_order, m.id')->fetchAll();
        foreach ($rows as &$row) { $row['id'] = (int)$row['id']; $row['standId'] = (int)$row['standId']; $row['price'] = (int)$row['price']; $row['isAvailable'] = (int)$row['isAvailable']; $row['sortOrder'] = (int)$row['sortOrder']; }
        unset($row);
        jsonResponse(['menu' => $rows]);
    }
    jsonError('Resource tidak ditemukan.', 404);
}

if ($method === 'POST') {
    $body = getJsonBody();
    $action = $body['action'] ?? '';
    if ($action === 'create_stand') {
        $name = canteenString($body, 'name', 120);
        $asciiName = function_exists('iconv') ? iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) : $name;
        $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $asciiName ?: $name), '-'));
        if ($slug === '') $slug = 'stand-' . bin2hex(random_bytes(3));
        $baseSlug = substr($slug, 0, 70);
        $slug = $baseSlug;
        $suffix = 2;
        $check = $db->prepare('SELECT id FROM canteen_stands WHERE slug = ?');
        while (true) {
            $check->execute([$slug]);
            if (!$check->fetch()) break;
            $slug = $baseSlug . '-' . $suffix++;
        }
        $db->prepare('INSERT INTO canteen_stands (slug, name, description, image_url, is_active) VALUES (?, ?, ?, ?, ?)')
            ->execute([$slug, $name, trim((string)($body['description'] ?? '')), trim((string)($body['imageUrl'] ?? '')) ?: null, !empty($body['isActive']) ? 1 : 0]);
        jsonResponse(['created' => true, 'id' => (int)$db->lastInsertId(), 'slug' => $slug], 201);
    }
    if ($action === 'create_seller') {
        $standId = filter_var($body['standId'] ?? null, FILTER_VALIDATE_INT);
        $username = trim((string)($body['username'] ?? ''));
        $fullName = canteenString($body, 'fullName', 120);
        if (!$standId || !preg_match('/^[a-zA-Z0-9._-]{3,60}$/', $username)) jsonError('Pilih stand dan username 3–60 karakter (huruf, angka, titik, _ atau -).', 422);
        $standCheck = $db->prepare('SELECT id FROM canteen_stands WHERE id = ? AND is_active = 1');
        $standCheck->execute([$standId]);
        if (!$standCheck->fetch()) jsonError('Stand tidak tersedia.', 422);
        $temporaryPassword = bin2hex(random_bytes(10)) . 'Aa!';
        try {
            $db->prepare('INSERT INTO canteen_users (stand_id, username, password_hash, full_name) VALUES (?, ?, ?, ?)')
                ->execute([$standId, $username, password_hash($temporaryPassword, PASSWORD_DEFAULT), $fullName]);
        } catch (PDOException $e) {
            if ((string)$e->getCode() === '23000') jsonError('Username sudah digunakan.', 409);
            throw $e;
        }
        jsonResponse(['created' => true, 'temporaryPassword' => $temporaryPassword], 201);
    }
    if ($action === 'reset_password') {
        $sellerId = filter_var($body['sellerId'] ?? null, FILTER_VALIDATE_INT);
        if (!$sellerId) jsonError('Akun penjual tidak valid.', 422);
        $temporaryPassword = bin2hex(random_bytes(10)) . 'Aa!';
        $update = $db->prepare('UPDATE canteen_users SET password_hash = ?, must_change_password = 1 WHERE id = ?');
        $update->execute([password_hash($temporaryPassword, PASSWORD_DEFAULT), $sellerId]);
        if (!$update->rowCount()) jsonError('Akun penjual tidak ditemukan.', 404);
        jsonResponse(['temporaryPassword' => $temporaryPassword]);
    }
    if ($action === 'create_menu') {
        $standId = filter_var($body['standId'] ?? null, FILTER_VALIDATE_INT);
        $name = canteenString($body, 'name', 140);
        $category = $body['category'] ?? '';
        $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_INT);
        if (!$standId || !in_array($category, ['food', 'drink'], true) || !$price || $price < 1000 || $price > 1000000) jsonError('Data menu tidak valid.', 422);
        $db->prepare('INSERT INTO canteen_menu_items (stand_id, name, description, category, price, image_url, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$standId, $name, trim((string)($body['description'] ?? '')), $category, $price, trim((string)($body['imageUrl'] ?? '')) ?: null, !empty($body['isAvailable']) ? 1 : 0, (int)($body['sortOrder'] ?? 0)]);
        jsonResponse(['created' => true, 'id' => (int)$db->lastInsertId()], 201);
    }
    jsonError('Aksi tidak dikenali.', 400);
}

if ($method === 'PUT') {
    $body = getJsonBody();
    $action = $body['action'] ?? '';
    if ($action === 'update_stand') {
        $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
        $name = canteenString($body, 'name', 120);
        if (!$id) jsonError('Stand tidak valid.', 422);
        $update = $db->prepare('UPDATE canteen_stands SET name = ?, description = ?, image_url = ?, is_active = ? WHERE id = ?');
        $update->execute([$name, trim((string)($body['description'] ?? '')), trim((string)($body['imageUrl'] ?? '')) ?: null, !empty($body['isActive']) ? 1 : 0, $id]);
        jsonResponse(['updated' => true]);
    }
    if ($action === 'update_menu') {
        $id = filter_var($body['id'] ?? null, FILTER_VALIDATE_INT);
        $name = canteenString($body, 'name', 140);
        $category = $body['category'] ?? '';
        $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_INT);
        if (!$id || !in_array($category, ['food', 'drink'], true) || !$price || $price < 1000 || $price > 1000000) jsonError('Data menu tidak valid.', 422);
        $update = $db->prepare('UPDATE canteen_menu_items SET name = ?, description = ?, category = ?, price = ?, image_url = ?, is_available = ?, sort_order = ? WHERE id = ?');
        $update->execute([$name, trim((string)($body['description'] ?? '')), $category, $price, trim((string)($body['imageUrl'] ?? '')) ?: null, !empty($body['isAvailable']) ? 1 : 0, (int)($body['sortOrder'] ?? 0), $id]);
        jsonResponse(['updated' => true]);
    }
    jsonError('Aksi tidak dikenali.', 400);
}

jsonError('Method tidak diizinkan.', 405);
