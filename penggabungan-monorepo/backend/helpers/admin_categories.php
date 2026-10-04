<?php

const ADMIN_CATEGORY_MODULES = [
    'agenda',
    'berita',
    'pengumuman',
    'guru',
    'galeri',
    'fasilitas',
    'arsip',
    'jadwal',
    'bk',
    'prestasi',
];

function requireCategoryModule(string $module): void
{
    if (!in_array($module, ADMIN_CATEGORY_MODULES, true)) {
        jsonError('Modul kategori tidak valid.', 400);
    }
}

function validateCategorySelection(PDO $db, string $module, mixed $category): ?string
{
    requireCategoryModule($module);
    if ($category === null || $category === '') {
        return null;
    }
    if (!is_string($category)) {
        jsonError('Kategori harus berupa teks.', 400);
    }

    $category = trim($category);
    if ($category === '' || strlen($category) > 100) {
        jsonError('Kategori harus berisi maksimal 100 karakter.', 400);
    }

    $stmt = $db->prepare(
        'SELECT category_name FROM admin_categories WHERE module_name = ? AND category_name = ?'
    );
    $stmt->execute([$module, $category]);
    $stored = $stmt->fetchColumn();
    if (!is_string($stored)) {
        jsonError('Kategori belum terdaftar. Tambahkan kategori terlebih dahulu.', 400);
    }

    return $stored;
}
