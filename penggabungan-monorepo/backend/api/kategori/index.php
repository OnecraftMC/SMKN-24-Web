<?php
/**
 * GET  /api/kategori/index.php?module=galeri -> daftar kategori modul (admin)
 * POST /api/kategori/index.php               -> tambah kategori modul (admin)
 */

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../helpers/admin_categories.php';

requireAuth();
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $module = trim((string)($_GET['module'] ?? ''));
    requireCategoryModule($module);

    $stmt = $db->prepare(
        'SELECT category_name FROM admin_categories WHERE module_name = ? ORDER BY category_name ASC'
    );
    $stmt->execute([$module]);
    jsonResponse(array_column($stmt->fetchAll(), 'category_name'));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    $module = $body['module'] ?? null;
    $name = $body['name'] ?? null;
    if (!is_string($module)) jsonError("Field 'module' tidak valid.", 400);
    requireCategoryModule($module);
    if (!is_string($name)) jsonError("Field 'name' wajib berupa teks.", 400);

    $name = trim($name);
    if ($name === '' || strlen($name) > 100) {
        jsonError("Field 'name' wajib diisi dan maksimal 100 karakter.", 400);
    }

    $insert = $db->prepare(
        'INSERT IGNORE INTO admin_categories (module_name, category_name) VALUES (?, ?)'
    );
    $insert->execute([$module, $name]);

    $select = $db->prepare(
        'SELECT category_name FROM admin_categories WHERE module_name = ? AND category_name = ?'
    );
    $select->execute([$module, $name]);
    $stored = $select->fetchColumn();
    if (!is_string($stored)) jsonError('Kategori gagal disimpan.', 500);

    jsonResponse(['name' => $stored], $insert->rowCount() === 1 ? 201 : 200);
}

jsonError('Method tidak diizinkan.', 405);
